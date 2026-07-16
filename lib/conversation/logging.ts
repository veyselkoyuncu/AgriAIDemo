// ─────────────────────────────────────────────────────────────────────────────
// Structured Logging — Sprint 2.5
// ─────────────────────────────────────────────────────────────────────────────
//
// Provides structured, machine-parseable logs for every request lifecycle.
// Lifecycle stages: QUEUED → STARTED → AI → MERGE → SAVE → SEND → COMPLETED
// ─────────────────────────────────────────────────────────────────────────────

export type LifecycleStage =
  | "QUEUED"
  | "STARTED"
  | "AI"
  | "MERGE"
  | "SAVE"
  | "SEND"
  | "COMPLETED"
  | "FAILED"
  | "STALE_IGNORED"
  | "DUPLICATE_SKIPPED"
  | "EXPIRED";

export interface LifecycleLogEntry {
  REQUEST_ID: string;
  CONVERSATION_VERSION: number;
  MESSAGE_ID: string;
  PHONE: string;
  STAGE: LifecycleStage;
  PREV_STAGE?: LifecycleStage;
  TIMESTAMP: string;
  DURATION_MS?: number;
  TOTAL_DURATION_MS?: number;
  QUEUE_STATUS?: "active" | "queued" | "rejected";
  PROVIDER_USED?: string;
  PROVIDER_DURATION_MS?: number;
  TIMEOUT?: boolean;
  STALE_RESPONSE_IGNORED?: boolean;
  DUPLICATE_MESSAGE_SKIPPED?: boolean;
  REQUEST_START?: string;
  REQUEST_END?: string;
  ERROR?: string;
  DETAIL?: string;
}

/**
 * Central lifecycle logger. Emits structured JSON to stdout for
 * production debugging. Every stage transition is logged.
 */
export class LifecycleLogger {
  private requestId: string;
  private conversationVersion: number;
  private messageId: string;
  private phone: string;
  private requestStart: string;
  private stageStart: string;
  private currentStage: LifecycleStage;
  private totalStartedAt: number;

  constructor(
    requestId: string,
    conversationVersion: number,
    messageId: string,
    phone: string
  ) {
    this.requestId = requestId;
    this.conversationVersion = conversationVersion;
    this.messageId = messageId;
    this.phone = phone;
    this.totalStartedAt = Date.now();
    this.requestStart = new Date().toISOString();
    this.currentStage = "QUEUED";
    this.stageStart = this.requestStart;
  }

  /** Transition to a new lifecycle stage. */
  transition(
    stage: LifecycleStage,
    extras?: Partial<LifecycleLogEntry>
  ): void {
    const prevStage = this.currentStage;
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const stageDuration = now - new Date(this.stageStart).getTime();
    const totalDuration = now - this.totalStartedAt;

    const entry: LifecycleLogEntry = {
      REQUEST_ID: this.requestId,
      CONVERSATION_VERSION: this.conversationVersion,
      MESSAGE_ID: this.messageId,
      PHONE: this.phone,
      STAGE: stage,
      PREV_STAGE: prevStage,
      TIMESTAMP: nowISO,
      DURATION_MS: stageDuration,
      TOTAL_DURATION_MS: totalDuration,
      REQUEST_START: this.requestStart,
      ...extras,
    };

    // Emit as structured JSON for log aggregation
    console.log(`[LIFECYCLE] ${JSON.stringify(entry)}`);

    this.currentStage = stage;
    this.stageStart = nowISO;
  }

  /** Log completion with total duration. */
  complete(extras?: Partial<LifecycleLogEntry>): void {
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const stageDuration = now - new Date(this.stageStart).getTime();
    const totalDuration = now - this.totalStartedAt;

    const entry: LifecycleLogEntry = {
      REQUEST_ID: this.requestId,
      CONVERSATION_VERSION: this.conversationVersion,
      MESSAGE_ID: this.messageId,
      PHONE: this.phone,
      STAGE: "COMPLETED",
      PREV_STAGE: this.currentStage,
      TIMESTAMP: nowISO,
      DURATION_MS: stageDuration,
      TOTAL_DURATION_MS: totalDuration,
      REQUEST_START: this.requestStart,
      REQUEST_END: nowISO,
      ...extras,
    };

    console.log(`[LIFECYCLE] ${JSON.stringify(entry)}`);
  }

  /** Log early exit (duplicate, stale, expired). */
  earlyExit(stage: LifecycleStage, reason: string): void {
    const now = Date.now();
    const nowISO = new Date().toISOString();
    const totalDuration = now - this.totalStartedAt;

    const entry: LifecycleLogEntry = {
      REQUEST_ID: this.requestId,
      CONVERSATION_VERSION: this.conversationVersion,
      MESSAGE_ID: this.messageId,
      PHONE: this.phone,
      STAGE: stage,
      PREV_STAGE: this.currentStage,
      TIMESTAMP: nowISO,
      TOTAL_DURATION_MS: totalDuration,
      REQUEST_START: this.requestStart,
      REQUEST_END: nowISO,
      [stage === "DUPLICATE_SKIPPED" ? "DUPLICATE_MESSAGE_SKIPPED" : "STALE_RESPONSE_IGNORED"]: true,
      DETAIL: reason,
    };

    console.log(`[LIFECYCLE] ${JSON.stringify(entry)}`);
  }
}

/**
 * Generate a unique request ID. Format: req_<timestamp>_<random>
 */
export function generateRequestId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `req_${ts}_${rand}`;
}
