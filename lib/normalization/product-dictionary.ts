/**
 * Product Dictionary — Sprint 2, Item 3
 * 
 * Maps common abbreviations and informal names to canonical product names.
 * If no match is found, the input is returned as-is (silent passthrough).
 */

const PRODUCT_ALIASES: Record<string, string> = {
  // ── Fungicides ──────────────────────────────────────────
  "bravo": "Bravo 250 SC",
  "bravo 250": "Bravo 250 SC",
  "bravo 250 sc": "Bravo 250 SC",
  "score": "Score 250 EC",
  "score 250": "Score 250 EC",
  "score 250 ec": "Score 250 EC",
  "nativo": "Nativo 75 WG",
  "nativo 75": "Nativo 75 WG",
  "nativo 75 wg": "Nativo 75 WG",
  "forum": "Forum 500 SC",
  "forum 500": "Forum 500 SC",
  "forum 500 sc": "Forum 500 SC",
  "karate": "Karate 2.5 WG",
  "karate 2.5": "Karate 2.5 WG",
  "karate 2.5 wg": "Karate 2.5 WG",
  
  // ── Fertilizers ─────────────────────────────────────────
  "üre": "Üre Gübresi",
  "ure": "Üre Gübresi",
  "üre gübresi": "Üre Gübresi",
  "ure gubresi": "Üre Gübresi",
  "dap": "DAP",
  "dap 18-46": "DAP",
  "amonyum nitrat": "Amonyum Nitrat",
  "an": "Amonyum Nitrat",
  "potasyum nitrat": "Potasyum Nitrat",
  "kalsiyum nitrat": "Kalsiyum Nitrat",
  "can": "Kalsiyum Nitrat",
  "20-20-0": "20-20-0",
  "15-15-15": "15-15-15",
  "kompoze": "15-15-15",
  
  // ── Insecticides ────────────────────────────────────────
  "confidor": "Confidor 200 SL",
  "confidor 200": "Confidor 200 SL",
  "confidor 200 sl": "Confidor 200 SL",
  "decis": "Decis 2.5 EC",
  "decis 2.5": "Decis 2.5 EC",
  "decis 2.5 ec": "Decis 2.5 EC",
  
  // ── Herbicides ──────────────────────────────────────────
  "roundup": "Roundup",
  "glifosat": "Roundup",
};

/**
 * Normalizes a product name using the alias dictionary.
 * Returns the canonical name if found, otherwise the original input trimmed.
 */
export function normalizeProduct(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  const trimmed = raw.trim();
  const key = trimmed.toLocaleLowerCase("tr-TR").normalize("NFC");
  
  return PRODUCT_ALIASES[key] || trimmed;
}
