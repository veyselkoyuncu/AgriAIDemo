export interface ExtractorResponse {
  intent: "activity" | "question" | "unknown";
  activity_type: "fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null;
  farm: string | null;
  crop: string | null;
  product: string | null;
  quantity: string | null;
  date: string | null;
}

export async function extractFromMessage(
  message: string,
  farmerStatus: any,
  history: any[],
  audioData?: { base64: string; mimeType: string }
): Promise<ExtractorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  const todayStr = new Date().toLocaleDateString("tr-TR");

  const systemPrompt = `Sen bir tarım veri çıkarma asistanısın. Çiftçinin gönderdiği son mesajı (yazılı metin veya sesli mesaj) analiz ederek sadece yapılandırılmış JSON verisi çıkarırsın.
  
Kesinlikle çiftçiye hitap eden samimi veya herhangi bir sohbet yanıtı üretme! Sadece JSON nesnesini dön.

Çiftçinin mevcut kayıtlı tarlaları ve ürünleri:
${JSON.stringify(farmerStatus, null, 2)}
Bu tarlaları ve ürünleri, mesajda geçen ifadelerle eşleştirmek için kullan. Örneğin mesajda "dere" veya "dereye" geçiyorsa ve çiftçinin tarlaları arasında "Dere Tarlası" varsa bunu "Dere Tarlası" olarak eşle. Eğer listede olmayan yeni bir tarla veya ürün adı söylüyorsa, o zaman aynen yazdığı ismi çıkar.

Çiftçinin son faaliyet geçmişi:
${JSON.stringify(history, null, 2)}

Çıkarılması gereken alanlar:
1. 'intent': Çiftçinin niyetini belirle:
   - 'activity': Çiftçi bir tarımsal faaliyeti (gübreleme, ilaçlama, sulama, hasat, ekim) bildirdiğinde veya daha önce sorulmuş bir soruya cevap verdiğinde (Örn: "Dere tarlası", "Domates", "Evet", "150 litre", "Üre").
   - 'question': Tarımsal bir soru sorduğunda (Örn: "Domates yaprağı sarardı ne yapmalıyım?", "Hangi gübre iyi gelir?").
   - 'unknown': Selamlaşma, teşekkür, emoji, anlaşılmayan sözler veya iptal/vazgeçme kelimeleri (Örn: "selam", "👍", "sağ ol", "iptal", "vazgeçtim", "boşver", "tamam").
2. 'activity_type': Eğer intent 'activity' ise şu değerlerden birini ata, aksi takdirde null:
   - 'fertilization': Gübreleme, gübre atma.
   - 'spraying': İlaçlama, ilaç atma.
   - 'irrigation': Sulama, su verme.
   - 'harvesting': Hasat yapma, toplama, biçme.
   - 'planting': Ekim, dikim, tohum saçma.
3. 'farm': Uygulanan tarla ismi. Çiftçinin tarlalarıyla eşleştir. Bulamazsan yeni söylenen tarla ismini yaz. Yoksa veya belirtilmemişse null.
4. 'crop': Uygulanan ürün ismi (Örn: Domates, Biber, Buğday). Çiftçinin ürünleriyle eşleştir. Bulamazsan yeni söylenen ürün ismini yaz. Yoksa veya belirtilmemişse null.
5. 'product': Kullanılan ürün/ilaç/gübre markası veya adı (Örn: "Üre gübresi", "K-Obiol ilaç", "Domates tohumu"). Sulama veya hasat için ürün yoksa null.
6. 'quantity': Miktar bilgisi (Örn: "20 kg", "150 litre", "5 çuval", "3 saat"). Yoksa null.
7. 'date': Belirtilen tarih. Eğer kullanıcı "dün", "2 gün önce", "geçen Cuma" gibi bir tarih belirttiyse, bugünün tarihini (${todayStr}) baz alarak YYYY-MM-DD formatında hesapla. Belirtilmemişse null dön.

JSON formatı kesinlikle şu şablonda olmalıdır:
{
  "intent": "activity" | "question" | "unknown",
  "activity_type": string | null,
  "farm": string | null,
  "crop": string | null,
  "product": string | null,
  "quantity": string | null,
  "date": string | null
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

  // Add text content (always add message or instructions)
  parts.push({
    text: message || "Lütfen ekteki ses kaydını analiz et ve çıkarım yap.",
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
    return JSON.parse(rawText.trim()) as ExtractorResponse;
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawText);
    return {
      intent: "unknown",
      activity_type: null,
      farm: null,
      crop: null,
      product: null,
      quantity: null,
      date: null,
    };
  }
}
