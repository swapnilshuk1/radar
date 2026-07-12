// lib/ranking/decision/types.ts

export enum DecisionCategory {
  APPLY = "APPLY",
  TAILOR = "TAILOR",
  NETWORK = "NETWORK",
  WATCH = "WATCH",
  HIDDEN_GEM = "HIDDEN_GEM",
  IGNORE = "IGNORE"
}

export enum DecisionReliability {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
  UNKNOWN = "UNKNOWN"
}

export enum InterviewProbabilityTier {
  VERY_HIGH = "VERY_HIGH",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

export interface EvidencePiece {
  code: string;
  priority: number;       // Intrinsic importance weight (from catalog)
  satisfaction: number;   // Mapped raw FitVector score fulfillment (0 to 100)
  contribution: number;   // Calculated analytical weight matrix contribution: (priority * satisfaction) / 100
}

export interface OptimizationPlay {
  dimension: string;
  title: string;
  play: string;
  impact: "HIGH IMPACT" | "MEDIUM IMPACT";
}

/** Pure mathematical internal contract for scoring stages */
export interface ScoreCard {
  weightedStrength: number;
  weightedGap: number;
  compositeScore: number;     // Normalized weighted satisfaction: Σ(priority × satisfaction) / Σ(priority)
  confidenceIndex: number;    // Normalized vector confidence index (0.0 to 1.0)
  interviewIndex: number;     // Weighted recruiter behavioral index (0.0 to 1.0)
  reliabilityIndex: number;   // Normalized strength/gap ratio distribution (0.0 to 1.0)
}

export interface DecisionModel {
  readonly schemaVersion: "1.0";
  readonly engineVersion: string;
  readonly generatedAt: string;
  
  category: DecisionCategory;
  decisionReliability: DecisionReliability;
  interviewProbability: InterviewProbabilityTier;
  
  // Numerical analytics exposed to presentation without UI calculations
  compositeScore: number;
  confidenceIndex: number;
  interviewIndex: number;
  
  strengths: EvidencePiece[];
  gaps: EvidencePiece[];
  coachingPlays: OptimizationPlay[];
}

// lib/ranking/decision/types.ts

export type PolicyViolationCode = 'HARD_REQUIREMENT_MISMATCH' | 'VISA_REQUIRED' | 'LOCATION_RELOCATION';

export interface PolicyViolation {
  code: PolicyViolationCode;
  severity: 'BLOCKER' | 'WARNING';
  explanation: string;
}

export interface PolicyResult {
  applied: boolean;
  violations: PolicyViolation[];
}

// Add to lib/ranking/decision/types.ts or appropriate utility block

export const ENGINE_ERRORS = {
  INVALID_INPUT: "[DecisionEngine] evaluateV2 expects a structured NormalizedDecisionInput envelope containing fitVector."
};

/**
 * Universal safe pipeline logger for non-production instrumentation.
 */
export function debugLog(...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

// Add to the bottom of lib/ranking/decision/types.ts

/** Normalized payload structure ready for the scoring engine pipeline */
export interface NormalizedDecisionInput {
  fitVector: any;
  ruleId: string;
  verdict: any;
  recommendation: any;
  reasons: string[];
  dataSource: "SERVER" | "LOCAL_FALLBACK";
}