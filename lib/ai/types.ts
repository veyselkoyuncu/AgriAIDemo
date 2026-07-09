export interface ExtractorResponse {
  intent: "activity" | "question" | "unknown";
  activity_type: "fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null;
  farm: string | null;
  crop: string | null;
  product: string | null;
  quantity: string | null;
  date: string | null;
  /**
   * Collection Mode only.
   * true  → user is clearly starting a brand new activity (e.g. "Hayır, biberi suladım").
   *         Node will delete the current session and start fresh.
   * false → user's message is a normal answer or correction within the current session.
   */
  is_new_activity: boolean;
}

export interface ActiveSession {
  activity_type: string;
  next_missing_field: string;
  pending_data: any;
}

export interface ExtractorRequest {
  message: string;
  farmerStatus: any;
  history: any[];
  audioData?: { base64: string; mimeType: string };
  /**
   * Provided when status === "collecting".
   * Switches the extractor into guided Collection Mode.
   */
  activeSession?: ActiveSession;
}

export interface ResponderRequest {
  message: string;
  status: "idle" | "collecting" | "completed" | "cancelled";
  intent: "activity" | "question" | "unknown";
  pendingData: any;
  nextMissingField: string | null;
  farmerStatus: any;
  history: any[];
}

export interface AIProvider {
  name: string;
  extract(request: ExtractorRequest): Promise<ExtractorResponse>;
  respond(request: ResponderRequest): Promise<string>;
}
