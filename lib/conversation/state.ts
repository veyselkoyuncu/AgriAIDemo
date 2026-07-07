import { supabase } from "@/lib/supabase";

export interface ConversationState {
  id: string;
  phone: string;
  intent: string;
  status: string;
  pending_data: {
    activity_type: "fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null;
    farm: string | null;
    crop: string | null;
    product: string | null;
    quantity: string | null;
    date: string | null;
    missing_fields: string[];
  } | null;
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

    return data as ConversationState | null;
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
  status: string,
  pendingData: any
): Promise<ConversationState | null> {
  try {
    const { data, error } = await supabase
      .from("conversation_state")
      .insert({
        phone,
        intent,
        status,
        pending_data: pendingData,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("[ERROR] createConversation failed:", error);
      return null;
    }

    return data as ConversationState;
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
  updates: Partial<Pick<ConversationState, "intent" | "status" | "pending_data">>
): Promise<ConversationState | null> {
  try {
    const { data, error } = await supabase
      .from("conversation_state")
      .update({
        ...updates,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("phone", phone)
      .select()
      .single();

    if (error) {
      console.error("[ERROR] updateConversation failed:", error);
      return null;
    }

    return data as ConversationState;
  } catch (err) {
    console.error("[ERROR] Unexpected error in updateConversation:", err);
    return null;
  }
}

/**
 * Reset conversation fields to default values (idle status, unknown intent, null pending_data).
 */
export async function clearConversation(phone: string): Promise<ConversationState | null> {
  return updateConversation(phone, {
    intent: "unknown",
    status: "idle",
    pending_data: null
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
