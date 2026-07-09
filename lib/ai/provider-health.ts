export interface HealthStatus {
  unhealthyUntil: number; // timestamp ms
  reason: string;
}

export class AIProviderHealthRegistry {
  private static registry = new Map<string, HealthStatus>();

  static markUnhealthy(providerName: string, durationSeconds: number, reason: string) {
    const until = Date.now() + durationSeconds * 1000;
    this.registry.set(providerName.toLowerCase(), { unhealthyUntil: until, reason });
    console.warn(`[AI Health] Provider "${providerName}" marked UNHEALTHY until ${new Date(until).toLocaleTimeString()} (Reason: ${reason})`);
  }

  static isAvailable(providerName: string): boolean {
    const status = this.registry.get(providerName.toLowerCase());
    if (!status) return true;
    if (Date.now() > status.unhealthyUntil) {
      this.registry.delete(providerName.toLowerCase()); // cooldown expired
      console.log(`[AI Health] Provider "${providerName}" cooldown expired. Marked back to HEALTHY.`);
      return true;
    }
    return false;
  }

  static getRemainingCooldown(providerName: string): number {
    const status = this.registry.get(providerName.toLowerCase());
    if (!status) return 0;
    return Math.max(0, Math.ceil((status.unhealthyUntil - Date.now()) / 1000));
  }
}
