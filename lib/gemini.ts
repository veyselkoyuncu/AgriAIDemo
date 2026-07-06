export interface GeminiResponse {
  intent: "activity" | "question" | "unknown";
  data: {
    activity_type: "fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null;
    product: string | null;
    quantity: string | null;
    farm_name: string | null;
    crop_name: string | null;
    date: string | null;
  };
  missing_fields: string[];
  reply_message: string;
}

export async function analyzeMessage(
  message: string,
  farmerStatus: any,
  history: any[],
  audioData?: { base64: string; mimeType: string }
): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const todayStr = new Date().toLocaleDateString("tr-TR");

  const systemPrompt = `Sen bir tarım danışmanı yapay zekasısın. Çiftçilerin Türkçe sesli veya yazılı WhatsApp mesajlarını analiz ederek tarımsal faaliyet günlüğü tutmalarını sağlarsın ve tarımsal sorularına cevap verirsin.
  
Çiftçinin mevcut profili, tarlaları ve ürünleri şunlardır:
${JSON.stringify(farmerStatus, null, 2)}

Çiftçinin son faaliyet geçmişi:
${JSON.stringify(history, null, 2)}

Gelen mesajı (ses dosyası veya yazılı mesaj) analiz et ve şu kurallara göre JSON çıktısı üret:
1. 'intent' (niyet) alanını belirle:
   - 'activity': Çiftçi bir faaliyet kaydetmek istiyorsa (Örn: 'Bugün domatesleri suladım', '20 kg üre gübresi attım', 'ilaçlama yaptık').
   - 'question': Çiftçi bir soru soruyorsa (Örn: 'Domateslere ne kadar gübre atmalıyım?', 'Yapraklar sarardı ne yapayım?').
   - 'unknown': Diğer durumlar (Örn: selamlaşma, belirsiz ifadeler).
2. 'data' alanını doldur (yalnızca activity için geçerlidir, aksi takdirde alanlar null olmalıdır):
   - 'activity_type': 'fertilization' (gübreleme), 'spraying' (ilaçlama), 'irrigation' (sulama), 'harvesting' (hasat), 'planting' (ekim) değerlerinden biri veya null.
   - 'product': Kullanılan ürünün adı (Örn: 'Üre gübresi', 'K-Obiol ilaç', 'Domates tohumu') veya null.
   - 'quantity': Kullanılan miktar (Örn: '20 kg', '3 çuval', '500 litre') veya null.
   - 'farm_name': Uygulanan tarla adı. Çiftçinin mevcut tarlalarından eşleştirmeye çalış, yoksa mesajda geçen yeni tarla ismini yaz.
   - 'crop_name': Uygulanan ürün/ekim adı (Örn: 'Domates', 'Biber'). Çiftçinin mevcut ürünlerinden eşleştirmeye çalış, yoksa yeni ürün ismini yaz.
   - 'date': Faaliyet tarihi (mesajda belirtilmemişse bugünün tarihi: ${todayStr}).
3. 'missing_fields' alanını doldur:
   - Çiftçi bir faaliyet girmek istiyorsa ama 'farm_name', 'crop_name', 'product', 'quantity' veya 'activity_type' belirtilmediyse bu alanların isimlerini bir dizi olarak ekle (Örn: ["farm_name", "crop_name"]).
4. 'reply_message' alanını oluştur:
   - Çiftçiye samimi, sıcak ve çiftçi diline uygun Türkçe bir cevap yaz.
   - Eksik bilgiler varsa ('missing_fields' doluysa) bunları nazikçe sor (Örn: 'Ahmet Bey, gübrelemeyi hangi tarladaki domates için yaptık?').
   - Soru sorduysa ('intent' == 'question') tarımsal geçmişine ve mevcut durumuna bakarak tavsiyelerde bulunup sorusunu cevapla.
   - Kayıt başarılıysa ('intent' == 'activity' ve 'missing_fields' boşsa) kaydın alındığını onaylayan samimi bir cevap yaz (Örn: 'Hasan Bey, Dere tarlasındaki domatesler için 20 kg Üre Gübresi kaydını başarıyla aldım. Bereketli olsun!').

JSON formatı kesinlikle şu şablonda olmalıdır:
{
  "intent": "activity" | "question" | "unknown",
  "data": {
    "activity_type": string | null,
    "product": string | null,
    "quantity": string | null,
    "farm_name": string | null,
    "crop_name": string | null,
    "date": string | null
  },
  "missing_fields": string[],
  "reply_message": string
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const parts: any[] = [];

  // Add audio content if available
  if (audioData) {
    parts.push({
      inlineData: {
        mimeType: audioData.mimeType,
        data: audioData.base64,
      },
    });
  }

  // Add text content (always add message or instruction)
  parts.push({
    text: message || "Lütfen ekteki ses kaydını analiz et ve yanıtla.",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Invalid response structure from Gemini API");
  }

  try {
    return JSON.parse(rawText.trim()) as GeminiResponse;
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText);
    return {
      intent: "unknown",
      data: {
        activity_type: null,
        product: null,
        quantity: null,
        farm_name: null,
        crop_name: null,
        date: null,
      },
      missing_fields: [],
      reply_message: "Mesajınızı tam olarak anlayamadım, lütfen tekrar açıklayabilir misiniz?",
    };
  }
}
