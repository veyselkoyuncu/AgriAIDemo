// Dashboard — shared TypeScript types for dashboard data
// These mirror the Supabase response shapes for type safety.

export interface FarmRow {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  area: number | null;
  created_at: string;
}

export interface CropRow {
  id: string;
  farm_id: string;
  name: string;
  planting_date: string | null;
  created_at: string;
  farms?: { name: string };
}

export interface ActivityRow {
  id: string;
  crop_id: string;
  data: ActivityData | null;
  created_at: string;
  crops?: {
    name: string;
    farms?: { name: string };
  };
}

export interface ActivityData {
  activity_type?: string;
  product?: string;
  quantity?: string;
  farm_name?: string;
  farm_id?: string;
  crop_name?: string;
  crop_id?: string;
  date?: string;
  message_id?: string;
}

export interface MessageRow {
  id: string;
  phone: string;
  raw_message: string;
  intent: string | null;
  extracted_data: Record<string, unknown> | null;
  reply_message: string | null;
  created_at: string;
}

export interface DashboardStats {
  farms: number;
  crops: number;
  activities: number;
  messages: number;
}
