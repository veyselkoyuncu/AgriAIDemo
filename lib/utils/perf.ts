export class PerformanceTracker {
  private startTime: number;
  private milestones: { label: string; offset: number; stepDuration: number }[] = [];
  private prevTime: number;

  constructor() {
    this.startTime = Date.now();
    this.prevTime = this.startTime;
  }

  milestone(label: string) {
    const now = Date.now();
    const offset = now - this.startTime;
    const stepDuration = now - this.prevTime;
    this.milestones.push({ label, offset, stepDuration });
    this.prevTime = now;
  }

  getSummary(): string {
    const total = Date.now() - this.startTime;
    let summary = `\n┌── PERFORMANCE TIMINGS ───────────────────\n`;
    summary += `│ Webhook received        +0 ms\n`;
    for (const m of this.milestones) {
      summary += `│ ${m.label.padEnd(20)} +${String(m.offset).padStart(4)} ms (step: ${m.stepDuration} ms)\n`;
    }
    summary += `│\n`;
    summary += `│ TOTAL                 ${total} ms\n`;
    summary += `└─── ──────────────────────────────────────`;
    return summary;
  }
}
