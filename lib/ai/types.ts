export class ProviderError extends Error {
  statusCode: number;
  retryAfterSeconds?: number;

  constructor(message: string, statusCode: number, retryAfterSeconds?: number) {
    super(message);
    this.name = "ProviderError";
    this.statusCode = statusCode;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface ExtractedEntity<T> {
  value: T;
  confidence: number;
}

export interface ExtractedActivity {
  activity_type: ExtractedEntity<"fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null>;
  farm: ExtractedEntity<string | null>;
  crop: ExtractedEntity<string | null>;
  product: ExtractedEntity<string | null>;
  quantity: ExtractedEntity<string | null>;
  date: ExtractedEntity<string | null>;
}

export interface ExtractorResponse {
  intent: "activity" | "question" | "unknown";
  activities: ExtractedActivity[];
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
