// ─────────────────────────────────────────────────────────────────────────────
// Message Inbox — Sprint 2.5.1
// ─────────────────────────────────────────────────────────────────────────────
//
// Instead of processing every WhatsApp message immediately inside the webhook,
// incoming messages are stored in an inbox. A separate "worker" (the webhook
// request that successfully acquires the per-user lock) loads all pending
// messages and processes them in a single batch.
//
// This eliminates the "one step behind" problem where the bot asks questions
// the user has already answered in rapid-fire messages.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/lib/supabase";

export interface IncomingMessage {
  id: string;
  wamid: string;
  phone: string;
  text: string;
  message_type: string;
  audio_data?: { base64: string; mimeType: string } | null;
  created_at: string;
  processed: boolean;
}

/**
 * Save an incoming WhatsApp message to the inbox for later processing.
 * Returns true if the message was saved, false if it was a duplicate wamid.
 */
export async function saveToInbox(params: {
  wamid: string;
  phone: string;
  text: string;
  messageType: string;
  audioData?: { base64: string; mimeType: string } | null;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("incoming_messages").insert({
      wamid: params.wamid,
      phone: params.phone,
      text: params.text,
      message_type: params.messageType,
      audio_data: params.audioData ?? null,
    });

    if (error) {
      // Unique constraint violation = duplicate wamid (already in inbox)
      if (error.code === "23505") {
        console.log(`[INBOX] Duplicate wamid ${params.wamid} — already in inbox.`);
        return false;
      }
      console.warn("[INBOX] Failed to save message:", error.message);
      return false;
    }

    return true;
  } catch (err: any) {
    console.warn("[INBOX] Unexpected error saving message:", err.message);
    return false;
  }
}

/**
 * Load all unprocessed inbox messages for a given phone number,
 * ordered by creation time (oldest first).
 */
export async function getPendingMessages(phone: string): Promise<IncomingMessage[]> {
  try {
    const { data, error } = await supabase
      .from("incoming_messages")
      .select("*")
      .eq("phone", phone)
      .eq("processed", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[INBOX] Failed to load pending messages:", error.message);
      return [];
    }

    return (data as IncomingMessage[]) ?? [];
  } catch (err: any) {
    console.warn("[INBOX] Unexpected error loading pending messages:", err.message);
    return [];
  }
}

/**
 * Mark a batch of inbox messages as processed.
 */
export async function markMessagesProcessed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  try {
    const { error } = await supabase
      .from("incoming_messages")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .in("id", ids);

    if (error) {
      console.warn("[INBOX] Failed to mark messages as processed:", error.message);
    }
  } catch (err: any) {
    console.warn("[INBOX] Unexpected error marking messages:", err.message);
  }
}

/**
 * Check if there are any unprocessed messages for a user that arrived
 * after a given timestamp. Used for the "flush before responding" check.
 */
export async function hasNewMessagesSince(phone: string, since: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from("incoming_messages")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .eq("processed", false)
      .gt("created_at", since);

    if (error) {
      console.warn("[INBOX] Failed to check new messages:", error.message);
      return false;
    }

    return (count ?? 0) > 0;
  } catch (err: any) {
    console.warn("[INBOX] Unexpected error checking new messages:", err.message);
    return false;
  }
}
