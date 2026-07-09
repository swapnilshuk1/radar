// lib/ranking/Telemetry.ts
// Structured logging and latency profiling telemetry layer for RADAR.
// Emits standardized JSON and console markers for observability across all matching stages.

export interface TelemetryEvent {
  jobId?: string;
  stage: "ingest" | "normalization" | "registry" | "decision" | "evidence" | "briefing" | "overall";
  status: "SUCCESS" | "FAILED";
  durationMs: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export class Telemetry {
  private static stageTimers = new Map<string, number>();

  /**
   * Starts a timer for a specific job execution stage.
   */
  public static startTimer(key: string): void {
    this.stageTimers.set(key, performance.now());
  }

  /**
   * Stops a timer and logs the elapsed time for a specific stage.
   */
  public static stopTimer(
    key: string,
    stage: TelemetryEvent["stage"],
    status: TelemetryEvent["status"],
    metadata?: Record<string, unknown>,
    error?: string
  ): number {
    const startTime = this.stageTimers.get(key);
    const endTime = performance.now();
    const durationMs = startTime ? Math.round(endTime - startTime) : 0;
    this.stageTimers.delete(key);

    const event: TelemetryEvent = {
      stage,
      status,
      durationMs,
      metadata,
      error
    };

    this.emit(event);
    return durationMs;
  }

  /**
   * Formats and prints the telemetry event to stdout/logs.
   */
  private static emit(event: TelemetryEvent): void {
    const timestamp = new Date().toISOString();
    const logString = `[RADAR-TELEMETRY] [${timestamp}] [${event.stage.toUpperCase()}] [${event.status}] duration=${event.durationMs}ms${
      event.metadata ? ` metadata=${JSON.stringify(event.metadata)}` : ""
    }${event.error ? ` error="${event.error}"` : ""}`;

    // Standard console out
    console.log(logString);
  }
}
