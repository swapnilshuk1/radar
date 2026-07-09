// lib/ranking/FeatureFlags.ts
// Configuration flags toggles for deploying and validating features dynamically in RADAR.

export class FeatureFlags {
  private static flags: Record<string, boolean> = {
    SEMANTIC_RESUME: true,
    COMPANY_INTELLIGENCE: true,
    INTERVIEW_READINESS: true,
    COMPENSATION_BENCHMARKS: false // Default off until high-confidence dataset linked
  };

  /**
   * Check if a feature flag is enabled. Respects process.env overrides (e.g. NEXT_PUBLIC_FF_SEMANTIC_RESUME).
   */
  public static isEnabled(flag: keyof typeof FeatureFlags.flags | string): boolean {
    const envKey = `NEXT_PUBLIC_FF_${flag}`;
    if (process.env[envKey] !== undefined) {
      return process.env[envKey] === 'true' || process.env[envKey] === '1';
    }
    return this.flags[flag] ?? false;
  }

  /**
   * Set flag override (useful for testing runtime behaviors).
   */
  public static setOverride(flag: string, val: boolean): void {
    this.flags[flag] = val;
  }

  /**
   * Get all active configurations.
   */
  public static getAllFlags(): Record<string, boolean> {
    const all: Record<string, boolean> = {};
    for (const key of Object.keys(this.flags)) {
      all[key] = this.isEnabled(key);
    }
    return all;
  }
}
