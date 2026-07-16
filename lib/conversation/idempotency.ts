// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Message Idempotency — Sprint 2.5, Item 1
// ─────────────────────────────────────────────────────────────────────────────
//
// Every incoming WhatsApp message has a unique wamid (message.id).
// Before processing any webhook, we check whether this wamid has already
// been processed. If so, we return HTTP 200 immediately without any
// extraction, responder, or database writes.
//
// Uses an in-memory Set as primary cache + Supabase "processed_messages"
// table as persistent store.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/lib/supabase";

// In-memory cache for fast duplicate detection (survives per-process)
const processedCache = new Set<string>();

/**
 * Check whether a WhatsApp message ID (wamid) has already been processed.
 * Checks the in-memory cache first, then falls back to the database.
 *
 * Returns true if the message was already processed (should skip).
 */
export async function isMessageProcessed(wamid: string): Promise<boolean> {
  // 1. Check in-memory cache (fast path)
  if (processedCache.has(wamid)) {
    console.log(`[IDEMPOTENCY] Cache HIT — duplicate wamid: ${wamid}`);
    return true;
  }

  // 2. Check database (persistent store)
  try {
    const { data, error } = await supabase
      .from("processed_messages")
      .select("id")
      .eq("message_id", wamid)
      .maybeSingle();

    if (error) {
      console.warn(`[IDEMPOTENCY] DB check error for ${wamid}:`, error.message);
      // On DB error, allow processing (fail open) but log
      return false;
    }

    if (data) {
      // Found in DB — add to cache and skip
      processedCache.add(wamid);
      console.log(`[IDEMPOTENCY] DB HIT — duplicate wamid: ${wamid}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[IDEMPOTENCY] Unexpected error checking ${wamid}:`, err.message);
    return false;
  }

  return false;
}

/**
 * Mark a WhatsApp message ID (wamid) as successfully processed.
 * Saves to both in-memory cache and database.
 */
export async function markMessageProcessed(wamid: string): Promise<void> {
  // 1. Add to in-memory cache
  processedCache.add(wamid);

  // 2. Persist to database
  try {
    const { error } = await supabase.from("processed_messages").insert({
      message_id: wamid,
      processed_at: new Date().toISOString(),
    });

    if (error) {
      // If it's a unique constraint violation, that means it was already
      // inserted by another concurrent request — that's fine.
      if (error.code === "23505") {
        console.log(`[IDEMPOTENCY] wamid ${wamid} already in DB (concurrent insert).`);
      } else {
        console.warn(`[IDEMPOTENCY] Failed to persist wamid ${wamid}:`, error.message);
      }
    }
  } catch (err: any) {
    console.warn(`[IDEMPOTENCY] Unexpected error saving ${wamid}:`, err.message);
  }
}
