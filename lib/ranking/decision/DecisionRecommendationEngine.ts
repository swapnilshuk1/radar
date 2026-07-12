// lib/ranking/decision/DecisionRecommendationEngine.ts
import { RecommendationEnum, VerdictEnum } from '../types';
import { DecisionCategory, RecommendationOutcome } from './types';
import { ScoringConfig } from './DecisionThresholds';

export class DecisionRecommendationEngine {
  /**
   * Pure Strategic Mapping: Translates raw mathematical scores into operational brackets.
   * Decoupled from policy violations or raw extraction data.
   */
  public static recommend(compositeScore: number): RecommendationOutcome {
    const t = ScoringConfig.thresholds;
    
    let category = DecisionCategory.WATCH;
    let recommendation = RecommendationEnum.IGNORE;
    let verdict = VerdictEnum.LIMITED_ALIGNMENT;

    if (compositeScore >= t.applyImmediately) {
      category = DecisionCategory.APPLY;
      recommendation = RecommendationEnum.APPLY_IMMEDIATELY;
      verdict = VerdictEnum.STRONG_CANDIDATE;
    } else if (compositeScore >= t.apply) {
      category = DecisionCategory.APPLY;
      recommendation = RecommendationEnum.APPLY;
      verdict = VerdictEnum.STRONG_CANDIDATE;
    } else if (compositeScore >= t.networkFirst) {
      category = DecisionCategory.APPLY;
      recommendation = RecommendationEnum.NETWORK_FIRST;
      verdict = VerdictEnum.STRONG_CANDIDATE;
    } else if (compositeScore >= t.monitor) {
      category = DecisionCategory.WATCH;
      recommendation = RecommendationEnum.MONITOR;
      verdict = VerdictEnum.WORTH_REVIEWING;
    }

    return { category, recommendation, verdict };
  }
}