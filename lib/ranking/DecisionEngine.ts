// lib/ranking/DecisionEngine.ts
// Pure code Decision Engine to map Fit Vector values to enums, traceable reasons, and audit rule IDs.

import { FitVector, RecommendationEnum, VerdictEnum } from './types';

export interface DecisionOutput {
  ruleId: string;
  verdict: VerdictEnum;
  recommendation: RecommendationEnum;
  reasons: string[];
}

export class DecisionEngine {
  /**
   * Evaluate the FitVector and return the final recommendation and verdict.
   * Pure deterministic code: audit-trail ruleId and traceable reasons are outputted.
   */
  public static evaluate(fitVector: FitVector): DecisionOutput {
    const titleScore = fitVector.titleFit?.score ?? 0;
    const leadershipScore = fitVector.leadershipFit?.score ?? 0;
    const functionalScore = fitVector.functionalFit?.score ?? 0;
    const locationScore = fitVector.locationFit?.score ?? 0;
    const careerScore = fitVector.careerProgressionFit?.score ?? 0;
    const companyScore = fitVector.companyHealth?.score ?? 0;

    // Rule 1: High Seniority & Scale Match (Apply Immediately)
    if (titleScore >= 80 && leadershipScore >= 70 && functionalScore >= 80 && locationScore >= 80) {
      return {
        ruleId: "EXEC_001_IMMEDIATE",
        verdict: VerdictEnum.STRONG_CANDIDATE,
        recommendation: RecommendationEnum.APPLY_IMMEDIATELY,
        reasons: ["HIGH_FUNCTIONAL_MATCH", "EXECUTIVE_SCOPE", "LOCATION_ALIGNMENT", "PROMOTIONAL_TRAJECTORY"]
      };
    }

    // Rule 2: Strong Skills alignment but Location/Travel mismatch (Network First)
    if (titleScore >= 65 && functionalScore >= 70) {
      const reasons = ["SENIORITY_MATCH", "FUNCTIONAL_ALIGNMENT"];
      
      if (locationScore < 80) {
        reasons.push("LOCATION_MISMATCH");
        return {
          ruleId: "EXEC_002_NETWORK_LOC_MISMATCH",
          verdict: VerdictEnum.WORTH_REVIEWING,
          recommendation: RecommendationEnum.NETWORK_FIRST,
          reasons
        };
      }

      return {
        ruleId: "EXEC_003_NETWORK_ALIGNMENT",
        verdict: VerdictEnum.STRONG_CANDIDATE,
        recommendation: RecommendationEnum.NETWORK_FIRST,
        reasons
      };
    }

    // Rule 3: Growth opportunity to monitor
    if (functionalScore >= 50 && careerScore >= 50) {
      const reasons = ["FUNCTIONAL_OVERLAP"];
      if (companyScore < 60) reasons.push("VERIFY_COMPANY_HEALTH");

      return {
        ruleId: "EXEC_004_MONITOR_GROWTH",
        verdict: VerdictEnum.WORTH_MONITORING,
        recommendation: RecommendationEnum.MONITOR,
        reasons
      };
    }

    // Baseline: Ignore / Skip
    return {
      ruleId: "EXEC_005_SKIP",
      verdict: VerdictEnum.LIMITED_ALIGNMENT,
      recommendation: RecommendationEnum.IGNORE,
      reasons: ["LIMITED_ALIGNMENT"]
    };
  }
}
