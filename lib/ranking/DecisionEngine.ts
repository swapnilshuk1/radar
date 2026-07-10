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

    // Hard requirement check override (must run BEFORE all other rules)
    if (fitVector.hardRequirementFit && fitVector.hardRequirementFit.score <= 30) {
      return {
        ruleId: "HARD_REQ_OVERRIDE",
        verdict: VerdictEnum.WORTH_REVIEWING,
        recommendation: RecommendationEnum.MONITOR,
        reasons: ["HARD_REQUIREMENT_MISMATCH"]
      };
    }

    // Rule 1: Premium Executive Target & Location Match (Apply Immediately)
    if (titleScore >= 90 && leadershipScore >= 70 && functionalScore >= 80 && locationScore >= 80) {
      return {
        ruleId: "EXEC_001_IMMEDIATE",
        verdict: VerdictEnum.STRONG_CANDIDATE,
        recommendation: RecommendationEnum.APPLY_IMMEDIATELY,
        reasons: ["HIGH_FUNCTIONAL_MATCH", "EXECUTIVE_SCOPE", "LOCATION_ALIGNMENT", "PROMOTIONAL_TRAJECTORY"]
      };
    }

    // Rule 2: Strong Executive Match (Apply This Week)
    if (titleScore >= 80 && leadershipScore >= 70 && functionalScore >= 70 && locationScore >= 80) {
      return {
        ruleId: "EXEC_002_STRONG_MATCH",
        verdict: VerdictEnum.STRONG_CANDIDATE,
        recommendation: RecommendationEnum.NETWORK_FIRST,
        reasons: ["SENIORITY_MATCH", "FUNCTIONAL_ALIGNMENT", "LOCATION_ALIGNMENT"]
      };
    }

    // Rule 3: High Match but Location Mismatch (Monitor Closely)
    if (titleScore >= 65 && functionalScore >= 70 && leadershipScore >= 70 && locationScore < 80) {
      return {
        ruleId: "EXEC_003_LOC_MISMATCH",
        verdict: VerdictEnum.WORTH_REVIEWING,
        recommendation: RecommendationEnum.MONITOR,
        reasons: ["SENIORITY_MATCH", "FUNCTIONAL_ALIGNMENT", "LOCATION_MISMATCH"]
      };
    }

    // Rule 4: General Functional Growth to Explore
    if (functionalScore >= 50 && careerScore >= 50) {
      const reasons = ["FUNCTIONAL_OVERLAP"];
      if (companyScore < 60) reasons.push("VERIFY_COMPANY_HEALTH");

      return {
        ruleId: "EXEC_004_EXPLORE_CONTEXT",
        verdict: VerdictEnum.WORTH_MONITORING,
        recommendation: RecommendationEnum.IGNORE,
        reasons
      };
    }

    // Baseline: Skip / Ignore
    return {
      ruleId: "EXEC_005_SKIP",
      verdict: VerdictEnum.LIMITED_ALIGNMENT,
      recommendation: RecommendationEnum.IGNORE,
      reasons: ["LIMITED_ALIGNMENT"]
    };
  }
}
