import { MIN_COOLDOWN_SECONDS, MAX_COOLDOWN_SECONDS } from "./types";

export interface HealthStatus {
  unhealthyUntil: number; // timestamp ms
  reason: string;
  failureCount: number;  // Sprint 2.5: track consecutive failures
  lastCheckAt: number;   // Sprint 2.5: track last health check
}

export class AIProviderHealthRegistry {
  private static registry = new Map<string, HealthStatus>();

  /**
   * Mark a provider as unhealthy with exponential backoff.
   * Repeated failures increase cooldown duration.
   */
  static markUnhealthy(providerName: string, baseDurationSeconds: number, reason: string) {
    const key = providerName.toLowerCase();
    const existing = this.registry.get(key);
    const failureCount = (existing?.failureCount ?? 0) + 1;

    // Exponential backoff: baseDuration * 2^(failureCount-1), capped at MAX_COOLDOWN
    const exponentialDuration = Math.min(
      baseDurationSeconds * Math.pow(2, failureCount - 1),
      MAX_COOLDOWN_SECONDS
    );
    const duration = Math.max(exponentialDuration, MIN_COOLDOWN_SECONDS);

    const until = Date.now() + duration * 1000;
    this.registry.set(key, {
      unhealthyUntil: until,
      reason,
      failureCount,
      lastCheckAt: Date.now(),
    });
    console.warn(
      `[AI Health] Provider "${providerName}" marked UNHEALTHY for ${duration}s ` +
      `(failure #${failureCount}, reason: ${reason})`
    );
  }

  /**
   * Check if a provider is currently available.
   * Automatically recovers providers whose cooldown has expired.
   */
  static isAvailable(providerName: string): boolean {
    const key = providerName.toLowerCase();
    const status = this.registry.get(key);
    if (!status) return true;

    if (Date.now() > status.unhealthyUntil) {
      // Cooldown expired — attempt recovery
      this.registry.delete(key);
      console.log(`[AI Health] Provider "${providerName}" cooldown expired. Marked HEALTHY.`);
      return true;
    }
    return false;
  }

  /**
   * Get remaining cooldown in seconds.
   */
  static getRemainingCooldown(providerName: string): number {
    const status = this.registry.get(providerName.toLowerCase());
    if (!status) return 0;
    return Math.max(0, Math.ceil((status.unhealthyUntil - Date.now()) / 1000));
  }

  /**
   * Get the failure count for a provider (for monitoring).
   */
  static getFailureCount(providerName: string): number {
    return this.registry.get(providerName.toLowerCase())?.failureCount ?? 0;
  }

  /**
   * Sprint 2.5: Force a provider back to healthy (e.g., on manual intervention
   * or successful health check probe).
   */
  static markHealthy(providerName: string) {
    const key = providerName.toLowerCase();
    const wasUnhealthy = this.registry.has(key);
    this.registry.delete(key);
    if (wasUnhealthy) {
      console.log(`[AI Health] Provider "${providerName}" manually marked HEALTHY.`);
    }
  }

  /**
   * Sprint 2.5: Try a health-check probe on a provider (lightweight ping).
   * If the probe succeeds, the provider is recovered.
   */
  static async probeHealth(
    providerName: string,
    pingFn: () => Promise<boolean>
  ): Promise<boolean> {
    const key = providerName.toLowerCase();
    const status = this.registry.get(key);
    if (!status) return true; // already healthy

    // Only probe if we're past a minimum retry interval
    const retryIntervalMs = MIN_COOLDOWN_SECONDS * 1000;
    if (Date.now() - status.lastCheckAt < retryIntervalMs) {
      return false; // not yet time to retry
    }

    // Update last check time
    status.lastCheckAt = Date.now();
    this.registry.set(key, status);

    try {
      const ok = await pingFn();
      if (ok) {
        this.markHealthy(providerName);
        return true;
      }
    } catch {
      // Ping failed — leave unhealthy, extend cooldown slightly
      status.unhealthyUntil = Date.now() + MIN_COOLDOWN_SECONDS * 1000;
      this.registry.set(key, status);
    }
    return false;
  }
}
