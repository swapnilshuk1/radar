// lib/ranking/decision/DecisionScorer.ts
import { FitVector } from '../types';
import { ScoringConfig, ScoreDimension, GuardrailDefinition } from './DecisionThresholds';

export interface AppliedGuardrailFact {
  dimension: ScoreDimension;
  threshold: number;
  actual: number;
  maxComposite: number;
  reason: string;
}

export interface ScoreCard {
  compositeScore: number;
  confidenceIndex: number;
  reliabilityIndex: number;
  dimensionBreakdown: Record<ScoreDimension, number>;
  appliedGuardrails: AppliedGuardrailFact[];
  metadata: {
    scoreVersion: string;
    weightsVersion: string;
    ontologyVersion: string;
  };
}

export class DecisionScorer {
  /**
   * Helper utility to safely scale and map input vectors from 0-100 down to 0.0-1.0
   */
  private static normalizeFitVector(fitVector: FitVector): Record<ScoreDimension, number> {
    return {
      titleFit: (fitVector.titleFit?.score ?? 0) / 100,
      leadershipFit: (fitVector.leadershipFit?.score ?? 0) / 100,
      functionalFit: (fitVector.functionalFit?.score ?? 0) / 100,
      industryFit: (fitVector.industryFit?.score ?? 0) / 100,
      locationFit: (fitVector.locationFit?.score ?? 0) / 100,
      careerProgressionFit: (fitVector.careerProgressionFit?.score ?? 0) / 100
    };
  }

  /**
   * Pure Multi-Dimensional Analytical Scorer
   */
  public static score(fitVector: FitVector): ScoreCard {
    const norm = this.normalizeFitVector(fitVector);
    const w = ScoringConfig.weights;

    // 1. Generate Dimension Contributions (scaled out of 100 points maximum)
    const breakdown: Record<ScoreDimension, number> = {
      titleFit: Math.round(norm.titleFit * w.titleFit * 100 * 10) / 10,
      leadershipFit: Math.round(norm.leadershipFit * w.leadershipFit * 100 * 10) / 10,
      functionalFit: Math.round(norm.functionalFit * w.functionalFit * 100 * 10) / 10,
      industryFit: Math.round(norm.industryFit * w.industryFit * 100 * 10) / 10,
      locationFit: Math.round(norm.locationFit * w.locationFit * 100 * 10) / 10,
      careerProgressionFit: Math.round(norm.careerProgressionFit * w.careerProgressionFit * 100 * 10) / 10
    };

    // 2. Accumulate Linear Base Composite Score
    let baseComposite = 
      (norm.titleFit * w.titleFit) +
      (norm.leadershipFit * w.leadershipFit) +
      (norm.functionalFit * w.functionalFit) +
      (norm.industryFit * w.industryFit) +
      (norm.locationFit * w.locationFit) +
      (norm.careerProgressionFit * w.careerProgressionFit);

    let compositeScaled = baseComposite * 100;

    // 3. Evaluate Data-Driven Guardrail Facts
    const appliedGuardrails: AppliedGuardrailFact[] = [];
    for (const guard of ScoringConfig.guardrails) {
      const actualScore = fitVector[guard.dimension]?.score ?? 0;
      
      if (actualScore < guard.threshold && compositeScaled > guard.maxComposite) {
        compositeScaled = guard.maxComposite;
        appliedGuardrails.push({
          dimension: guard.dimension,
          threshold: guard.threshold,
          actual: actualScore,
          maxComposite: guard.maxComposite,
          reason: guard.reason
        });
      }
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(compositeScaled)));

    // 4. Compute Extraction Confidence (Data Suficiency Metric)
    const totalConfidenceWeight = 
      ((fitVector.titleFit?.confidence ?? 0.85) * w.titleFit) +
      ((fitVector.leadershipFit?.confidence ?? 0.85) * w.leadershipFit) +
      ((fitVector.functionalFit?.confidence ?? 0.85) * w.functionalFit) +
      ((fitVector.industryFit?.confidence ?? 0.85) * w.industryFit) +
      ((fitVector.locationFit?.confidence ?? 0.85) * w.locationFit) +
      ((fitVector.careerProgressionFit?.confidence ?? 0.85) * w.careerProgressionFit);

    // 5. Compute Comprehensive Variance Across All Active Dimensions
    const scores = Object.values(norm);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    
    // Stability Index decays smoothly based on comprehensive multi-axis variance drops
    const reliabilityIndex = Math.max(0.1, Math.min(1.0, totalConfidenceWeight * (1 - variance * 0.5)));

    return {
      compositeScore: finalScore,
      confidenceIndex: Math.round(totalConfidenceWeight * 100) / 100,
      reliabilityIndex: Math.round(reliabilityIndex * 100) / 100,
      dimensionBreakdown: breakdown,
      appliedGuardrails,
      metadata: { ...ScoringConfig.metadata }
    };
  }
}