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

// ─── Timeout Constants (Sprint 2.5) ──────────────────────────────────────────

/** Maximum time an extraction request may take. */
export const EXTRACTION_TIMEOUT_MS = 8_000; // 8 seconds

/** Maximum time a responder request may take. */
export const RESPONDER_TIMEOUT_MS = 8_000; // 8 seconds

/** Hard cap on total webhook processing time. */
export const MAX_REQUEST_DURATION_MS = 15_000; // 15 seconds

/** Default provider cooldown on generic errors. */
export const DEFAULT_COOLDOWN_SECONDS = 30;

/** Circuit breaker: minimum time before a provider is retried. */
export const MIN_COOLDOWN_SECONDS = 10;

/** Circuit breaker: maximum cooldown for repeated failures. */
export const MAX_COOLDOWN_SECONDS = 300; // 5 minutes

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
