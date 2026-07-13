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

export interface ConversationContext {
  currentActivity: any | null;
  pendingActivities: any[];
  completedActivities: any[];
  resolvedContext: any;
  extractedEntities: ExtractorResponse | null;
  history: any[];
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
