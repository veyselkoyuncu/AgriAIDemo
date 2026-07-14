/**
 * Turkish Date Parser — Sprint 2, Item 2
 *
 * Parses Turkish date expressions into ISO 8601 (YYYY-MM-DD).
 * Runs entirely in Node.js — AI never resolves dates.
 */

const TURKISH_DAYS: Record<string, number> = {
  "pazartesi": 1,
  "salı": 2, "sali": 2,
  "çarşamba": 3, "carsamba": 3,
  "perşembe": 4, "persembe": 4,
  "cuma": 5,
  "cumartesi": 6,
  "pazar": 0,
};

/**
 * Parses a Turkish date expression into ISO date string.
 * Returns null for unresolvable expressions (e.g. "bayramdan sonra").
 * 
 * Supported:
 *   "bugün" / "bugun"           → today
 *   "dün" / "dun"               → yesterday
 *   "evvelsi gün" / "öbür gün"  → 2 days ago
 *   "3 gün önce"                → today - 3
 *   "geçen hafta"               → last Monday
 *   "geçen cuma"                → last Friday
 *   "salı"                      → most recent Tuesday (last week if today is past Tuesday)
 *   "bayramdan sonra"           → null (unresolvable)
 */
export function parseTurkishDate(expr: string | null | undefined): string | null {
  if (!expr) return null;
  
  const raw = expr.trim().toLocaleLowerCase("tr-TR");
  const today = getToday();
  
  // bugün / bugun
  if (raw === "bugün" || raw === "bugun") {
    return formatDate(today);
  }
  
  // dün / dun
  if (raw === "dün" || raw === "dun") {
    return formatDate(addDays(today, -1));
  }
  
  // evvelsi gün / öbür gün (2 days ago)
  if (raw === "evvelsi gün" || raw === "evvelsi gun" || raw === "öbür gün" || raw === "obur gun") {
    return formatDate(addDays(today, -2));
  }
  
  // N gün önce
  const daysAgoMatch = raw.match(/^(\d+)\s*gün\s*önce$/);
  if (!daysAgoMatch) {
    // Also try ASCII version
    const daysAgoMatchAscii = raw.match(/^(\d+)\s*gun\s*once$/);
    if (daysAgoMatchAscii) {
      const n = parseInt(daysAgoMatchAscii[1], 10);
      return formatDate(addDays(today, -n));
    }
  } else {
    const n = parseInt(daysAgoMatch[1], 10);
    return formatDate(addDays(today, -n));
  }
  
  // geçen hafta → last Monday
  if (raw === "geçen hafta" || raw === "gecen hafta") {
    return formatDate(getLastWeekday(today, 1)); // Monday
  }
  
  // geçen + day name (e.g. "geçen cuma")
  const lastDayMatch = raw.match(/^(geçen|gecen)\s+(.+)$/);
  if (lastDayMatch) {
    const dayName = lastDayMatch[2].trim();
    const dayNum = TURKISH_DAYS[dayName];
    if (dayNum !== undefined) {
      return formatDate(getLastWeekday(today, dayNum));
    }
  }
  
  // Bare day name (e.g. "salı") — most recent occurrence
  if (TURKISH_DAYS[raw] !== undefined) {
    const target = TURKISH_DAYS[raw];
    const currentDay = today.getDay();
    let diff = currentDay - target;
    if (diff <= 0) diff += 7; // Always go back (never forward)
    return formatDate(addDays(today, -diff));
  }
  
  // Already ISO format? (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  
  // Unresolvable (bayramdan sonra, hasattan önce, etc.)
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getToday(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getLastWeekday(fromDate: Date, targetDay: number): Date {
  const current = fromDate.getDay();
  let diff = current - targetDay;
  if (diff <= 0) diff += 7;
  return addDays(fromDate, -diff);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
