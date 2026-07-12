// lib/ranking/decision/DecisionThresholds.ts

export type ScoreDimension = 
  | 'titleFit' 
  | 'leadershipFit' 
  | 'functionalFit' 
  | 'industryFit' 
  | 'locationFit' 
  | 'careerProgressionFit';

export interface GuardrailDefinition {
  dimension: ScoreDimension;
  threshold: number;      // Trigger boundary out of 100
  maxComposite: number;   // Absolute score ceiling out of 100
  reason: string;
}

export const ScoringConfig = {
  metadata: {
    scoreVersion: "3.0",
    weightsVersion: "2026-07",
    ontologyVersion: "marketing-v5"
  },

  // Matrix weights sum to exactly 1.0 (100%)
  weights: {
    titleFit: 0.20,
    leadershipFit: 0.20,
    functionalFit: 0.30,
    industryFit: 0.15,
    locationFit: 0.10,
    careerProgressionFit: 0.05
  } as Record<ScoreDimension, number>,

  // Pure data-driven mathematical guardrail ceilings
  guardrails: [
    {
      dimension: 'functionalFit',
      threshold: 40,
      maxComposite: 70,
      reason: "Functional core alignment is below executive target threshold."
    },
    {
      dimension: 'titleFit',
      threshold: 50,
      maxComposite: 60,
      reason: "Target title authority match profile is weak."
    }
  ] as GuardrailDefinition[],

  thresholds: {
    applyImmediately: 95,
    apply: 85,
    networkFirst: 70,
    monitor: 55
  }
};