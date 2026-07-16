import { supabase } from "@/lib/supabase";
import { ExtractorResponse } from "@/lib/ai/types";

export type ConversationStatus = 
  | "NEW" 
  | "EXTRACTING" 
  | "MERGING" 
  | "WAITING_REQUIRED_FIELDS" 
  | "READY_TO_SAVE" 
  | "SAVED" 
  | "NEXT_ACTIVITY" 
  | "FINISHED"
  | "CANCELLED";

export interface ActivityState {
  activity_type: string | null;
  farm: string | null;
  crop: string | null;
  product: string | null;
  quantity: string | null;
  date: string | null;
  farm_id?: string | null;
  crop_id?: string | null;
}

export interface ConversationContext {
  currentActivity: ActivityState | null;
  pendingActivities: any[];
  completedActivities: ActivityState[];
  resolvedContext: any;
  extractedEntities: ExtractorResponse | null;
  history: any[];
  // Sprint 2.5: Conversation version for stale AI response detection
  conversationVersion?: number;
  // Sprint 2.5: Timestamp when the pending activity was last updated
  pendingActivitySince?: string;
}

export interface ConversationState {
  id: string;
  phone: string;
  intent: string;
  status: ConversationStatus;
  state_data: ConversationContext | null; // We use state_data mapping to the same JSONB column
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch the active conversation state for a specific phone number.
 */
export async function getConversation(phone: string): Promise<ConversationState | null> {
  try {
    const { data, error } = await supabase
      .from("conversation_state")
      .select("*")
      .eq("phone", phone)
      .maybeSingle();

    if (error) {
      console.error("[ERROR] getConversation failed:", error);
      return null;
    }

    if (!data) return null;
    const result = data as any;
    return { ...result, state_data: result.pending_data } as ConversationState;
  } catch (err) {
    console.error("[ERROR] Unexpected error in getConversation:", err);
    return null;
  }
}

/**
 * Create a new conversation state record.
 */
export async function createConversation(
  phone: string,
  intent: string,
  status: ConversationStatus,
  stateData: ConversationContext
): Promise<ConversationState | null> {
  try {
    const { data, error } = await supabase
      .from("conversation_state")
      .insert({
        phone,
        intent,
        status,
        pending_data: stateData as any, // Map to existing DB column
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[ERROR] createConversation failed:", error);
      return null;
    }

    const result = data as any;
    return { ...result, state_data: result.pending_data } as ConversationState;
  } catch (err) {
    console.error("[ERROR] Unexpected error in createConversation:", err);
    return null;
  }
}

/**
 * Update an existing conversation state.
 */
export async function updateConversation(
  phone: string,
  updates: Partial<Pick<ConversationState, "intent" | "status" | "state_data">>
): Promise<ConversationState | null> {
  try {
    const dbUpdates: any = {
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (updates.intent !== undefined) dbUpdates.intent = updates.intent;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.state_data !== undefined) dbUpdates.pending_data = updates.state_data;

    const { data, error } = await supabase
      .from("conversation_state")
      .update(dbUpdates)
      .eq("phone", phone)
      .select()
      .single();

    if (error) {
      console.error("[ERROR] updateConversation failed:", error);
      return null;
    }

    const result = data as any;
    return { ...result, state_data: result.pending_data } as ConversationState;
  } catch (err) {
    console.error("[ERROR] Unexpected error in updateConversation:", err);
    return null;
  }
}

/**
 * Reset conversation fields to default values.
 */
export async function clearConversation(phone: string): Promise<ConversationState | null> {
  return updateConversation(phone, {
    intent: "unknown",
    status: "FINISHED",
    state_data: null
  });
}

/**
 * Delete a conversation state entirely (called when a flow completes or is cancelled).
 */
export async function deleteConversation(phone: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("conversation_state")
      .delete()
      .eq("phone", phone);

    if (error) {
      console.error("[ERROR] deleteConversation failed:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[ERROR] Unexpected error in deleteConversation:", err);
    return false;
  }
}

/**
 * Determine if a conversation session has expired.
 */
export function isConversationExpired(
  conversation: ConversationState,
  timeoutInMinutes: number = 15
): boolean {
  if (!conversation.last_message_at) return true;
  
  const lastMessageTime = new Date(conversation.last_message_at).getTime();
  const now = Date.now();
  const diffInMinutes = (now - lastMessageTime) / (1000 * 60);
  
  return diffInMinutes > timeoutInMinutes;
}

// ─── Sprint 2.5: Pending Activity Expiration ────────────────────────────────

const PENDING_ACTIVITY_TIMEOUT_MINUTES = 10;

/**
 * Check whether the pending activity should be expired.
 * If a pending activity has been inactive for more than the configurable
 * timeout, it should be discarded to prevent stale resumption.
 */
export function isPendingActivityExpired(ctx: ConversationContext): boolean {
  if (!ctx.currentActivity) return false;
  if (!ctx.pendingActivitySince) return false;

  const since = new Date(ctx.pendingActivitySince).getTime();
  const now = Date.now();
  const diffMinutes = (now - since) / (1000 * 60);

  return diffMinutes > PENDING_ACTIVITY_TIMEOUT_MINUTES;
}

/**
 * Bump the conversation version and return the new version.
 * Each new incoming message increments the version.
 * This is used for stale AI response detection.
 */
export function bumpConversationVersion(ctx: ConversationContext): number {
  const newVersion = (ctx.conversationVersion ?? 0) + 1;
  ctx.conversationVersion = newVersion;
  return newVersion;
}

/**
 * Mark the start of a pending activity for expiration tracking.
 */
export function markPendingActivityStart(ctx: ConversationContext): void {
  if (ctx.currentActivity) {
    ctx.pendingActivitySince = new Date().toISOString();
  }
}
