/**
 * Quantity Normalization — Sprint 2, Item 1
 * 
 * Strips filler words (yaklaşık, civarı, kadar, etc.) from raw quantities.
 * Normalizes fractional Turkish expressions (yarım, buçuk, çeyrek).
 * Normalizes Turkish number words (bir, iki, üç...) to numeric digits.
 * Normalizes units (kilogram, lt, L, gr...) to standard formats (kg, L, g, ton).
 * AI is never responsible for normalization — this runs entirely in Node.js.
 */

const FILLER_WORDS = [
  "yaklaşık", "yaklasik",
  "civarı", "civari", "civarında", "civarinda",
  "kadar",
  "aşağı yukarı", "asagi yukari",
  "tahminen",
  "hemen hemen",
  "az çok", "az cok",
];

const NUMBER_WORDS: Record<string, number> = {
  "sıfır": 0, "sifir": 0,
  "bir": 1,
  "iki": 2,
  "üç": 3, "uc": 3,
  "dört": 4, "dort": 4,
  "beş": 5, "bes": 5,
  "altı": 6, "alti": 6,
  "yedi": 7,
  "sekiz": 8,
  "dokuz": 9,
  "on": 10,
  "yirmi": 20,
  "otuz": 30,
  "kırk": 40, "kirk": 40,
  "elli": 50,
  "altmış": 60, "altmis": 60,
  "yetmiş": 70, "yetmis": 70,
  "seksen": 80,
  "doksan": 90,
  "yüz": 100, "yuz": 100,
  "bin": 1000
};

/**
 * Parses Turkish number words into numeric digits.
 * e.g., "iki buçuk" -> "2.5", "on beş" -> "15", "iki bin beş yüz elli" -> "2550"
 */
export function parseTurkishNumberWords(text: string): string {
  const tokens = text.toLowerCase().split(/\s+/);
  const resultTokens: string[] = [];
  
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    
    if (NUMBER_WORDS[token] !== undefined) {
      let sum = 0;
      let currentVal = 0;
      
      while (i < tokens.length && (NUMBER_WORDS[tokens[i]] !== undefined || tokens[i] === "buçuk" || tokens[i] === "bucuk")) {
        const word = tokens[i];
        
        if (word === "buçuk" || word === "bucuk") {
          currentVal = currentVal + 0.5;
          i++;
          break;
        }
        
        const val = NUMBER_WORDS[word];
        if (val === 1000) {
          if (currentVal === 0) currentVal = 1;
          sum += currentVal * 1000;
          currentVal = 0;
        } else if (val === 100) {
          if (currentVal === 0) currentVal = 1;
          sum += currentVal * 100;
          currentVal = 0;
        } else {
          currentVal += val;
        }
        i++;
      }
      
      sum += currentVal;
      resultTokens.push(sum.toString());
    } else {
      resultTokens.push(tokens[i]);
      i++;
    }
  }
  
  return resultTokens.join(" ");
}

/**
 * Normalizes units to standard abbreviations:
 * - kilogram, kilo, kg, KG -> kg
 * - litre, lt, L, l -> L
 * - gram, gr, g -> g
 * - ton -> ton
 */
export function normalizeUnit(raw: string): string {
  let text = raw.trim();
  
  const regex = /(\d+(?:\.\d+)?)\s*(kilogram|kilo|kg|litre|lt|l|gram|gr|g|ton)\b/gi;
  
  text = text.replace(regex, (match, num, unit) => {
    const lowerUnit = unit.toLowerCase();
    let normUnit = lowerUnit;
    if (lowerUnit === "kilogram" || lowerUnit === "kilo" || lowerUnit === "kg") {
      normUnit = "kg";
    } else if (lowerUnit === "litre" || lowerUnit === "lt" || lowerUnit === "l") {
      normUnit = "L";
    } else if (lowerUnit === "gram" || lowerUnit === "gr" || lowerUnit === "g") {
      normUnit = "g";
    } else if (lowerUnit === "ton") {
      normUnit = "ton";
    }
    return `${num} ${normUnit}`;
  });
  
  return text;
}

/**
 * Normalizes a raw quantity string by removing filler words, parsing number words,
 * resolving fractions, and normalizing units.
 */
export function normalizeQuantity(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let result = raw.trim();
  
  // 1. Remove filler words (longest first to avoid partial matches)
  const sortedFillers = [...FILLER_WORDS].sort((a, b) => b.length - a.length);
  for (const filler of sortedFillers) {
    const regex = new RegExp(`\\b${escapeRegex(filler)}\\b`, "gi");
    result = result.replace(regex, "");
  }
  
  // 2. Parse Turkish number words
  result = parseTurkishNumberWords(result);
  
  // 3. Handle "yarım X" -> "0.5 X"
  result = result.replace(/\byarım\b|\byarim\b/gi, "0.5");
  
  // 4. Handle standalone fractions/leftover buçuk
  result = result.replace(/(\d+)\s*(buçuk|bucuk)/gi, (_match, num) => `${num}.5`);
  result = result.replace(/\bbuçuk\b|\bbucuk\b/gi, "0.5");
  result = result.replace(/\bçeyrek\b|\bceyrek\b/gi, "0.25");
  
  // 5. Normalize units
  result = normalizeUnit(result);
  
  // Clean up multiple spaces
  result = result.replace(/\s+/g, " ").trim();
  
  return result || null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

