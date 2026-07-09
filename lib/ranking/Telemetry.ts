// lib/ranking/Telemetry.ts
// Structured logging, latency profiling, and Trace ID tracking layer for RADAR.
// Emits standardized trace logs across Scraper, Normalizer, Scoring, Decision, Evidence, Briefings, and Database stages.

export interface TelemetryEvent {
  traceId: string;
  stage: "scraper" | "normalizer" | "scoring" | "decision" | "evidence" | "briefings" | "database" | "overall";
  status: "SUCCESS" | "FAILED" | "INFO";
  durationMs?: number;
  message: string;
  metadata?: Record<string, unknown>;
  error?: string;
}

export class Telemetry {
  private static stageTimers = new Map<string, number>();

  /**
   * Generates a unique, traceable ID for an end-to-end pipeline run.
   */
  public static generateTraceId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `tr-${timestamp}-${randomSuffix}`;
  }

  /**
   * Starts a timing profile for a specific trace and stage key.
   */
  public static startTimer(traceId: string, stage: TelemetryEvent["stage"]): void {
    const timerKey = `${traceId}-${stage}`;
    this.stageTimers.set(timerKey, performance.now());
  }

  /**
   * Stops a timing profile and logs the event with its duration in milliseconds.
   */
  public static stopTimer(
    traceId: string,
    stage: TelemetryEvent["stage"],
    status: TelemetryEvent["status"],
    message: string,
    metadata?: Record<string, unknown>,
    error?: string
  ): number {
    const timerKey = `${traceId}-${stage}`;
    const startTime = this.stageTimers.get(timerKey);
    const endTime = performance.now();
    const durationMs = startTime ? Math.round(endTime - startTime) : 0;
    this.stageTimers.delete(timerKey);

    const event: TelemetryEvent = {
      traceId,
      stage,
      status,
      durationMs,
      message,
      metadata,
      error
    };

    this.emit(event);
    return durationMs;
  }

  /**
   * Emits a standard structured log line with context markers.
   */
  public static log(
    traceId: string,
    stage: TelemetryEvent["stage"],
    status: TelemetryEvent["status"],
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const event: TelemetryEvent = {
      traceId,
      stage,
      status,
      message,
      metadata
    };
    this.emit(event);
  }

  /**
   * Prints the telemetry trace event.
   */
  private static emit(event: TelemetryEvent): void {
    const timestamp = new Date().toISOString();
    const logString = `[RADAR-TRACE] [${timestamp}] [${event.traceId}] [${event.stage.toUpperCase()}] [${event.status}] ${event.message}${
      event.durationMs !== undefined ? ` duration=${event.durationMs}ms` : ""
    }${event.metadata ? ` metadata=${JSON.stringify(event.metadata)}` : ""}${
      event.error ? ` error="${event.error}"` : ""
    }`;

    console.log(logString);
  }
}
