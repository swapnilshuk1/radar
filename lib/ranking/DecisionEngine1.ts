// lib/ranking/DecisionEngine.ts
import { FitVector, RecommendationEnum, VerdictEnum } from './types';
import { 
  DecisionModel, 
  DecisionCategory, 
  DecisionReliability, 
  InterviewProbabilityTier,
  NormalizedDecisionInput
} from './decision/types';
import { EvidenceAssembler } from './decision/EvidenceAssembler';
import { CoachingEngine } from './decision/CoachingEngine';
import { DecisionScorer } from './decision/DecisionScorer';

export interface DecisionOutput {
  ruleId: string;
  verdict: VerdictEnum;
  recommendation: RecommendationEnum;
  reasons: string[];
}

export class DecisionEngine {
  /**
   * Core legacy/local rules evaluator engine
   */
  public static evaluate(fitVector: FitVector): DecisionOutput {
    const titleScore = fitVector.titleFit?.score ?? 0;
    const leadershipScore = fitVector.leadershipFit?.score ?? 0;
    const functionalScore = fitVector.functionalFit?.score ?? 0;
    const locationScore = fitVector.locationFit?.score ?? 0;
    const careerScore = fitVector.careerProgressionFit?.score ?? 0;
    const companyScore = fitVector.companyHealth?.score ?? 0;

    // Hard requirement constraint check
    if (fitVector.hardRequirementFit && fitVector.hardRequirementFit.score <= 30) {
      return { 
        ruleId: "HARD_REQ_OVERRIDE", 
        verdict: VerdictEnum.WORTH_REVIEWING, 
        recommendation: RecommendationEnum.MONITOR, 
        reasons: ["HARD_REQUIREMENT_MISMATCH"] 
      };
    }

    // Rule 1: EXEC_001_IMMEDIATE
    if (titleScore >= 90 && leadershipScore >= 70 && functionalScore >= 80 && locationScore >= 80) {
      return { 
        ruleId: "EXEC_001_IMMEDIATE", 
        verdict: VerdictEnum.STRONG_CANDIDATE, 
        recommendation: RecommendationEnum.APPLY_IMMEDIATELY, 
        reasons: ["HIGH_FUNCTIONAL_MATCH", "EXECUTIVE_SCOPE", "LOCATION_ALIGNMENT", "PROMOTIONAL_TRAJECTORY"] 
      };
    }

    // Rule 2: EXEC_002_STRONG_MATCH
    if (titleScore >= 80 && leadershipScore >= 70 && functionalScore >= 70 && locationScore >= 80) {
      return { 
        ruleId: "EXEC_002_STRONG_MATCH", 
        verdict: VerdictEnum.STRONG_CANDIDATE, 
        recommendation: RecommendationEnum.NETWORK_FIRST, 
        reasons: ["SENIORITY_MATCH", "FUNCTIONAL_ALIGNMENT", "LOCATION_ALIGNMENT"] 
      };
    }

    // Rule 3: EXEC_003_LOC_MISMATCH
    if (titleScore >= 65 && functionalScore >= 70 && leadershipScore >= 70 && locationScore < 80) {
      return { 
        ruleId: "EXEC_003_LOC_MISMATCH", 
        verdict: VerdictEnum.WORTH_REVIEWING, 
        recommendation: RecommendationEnum.MONITOR, 
        reasons: ["SENIORITY_MATCH", "FUNCTIONAL_ALIGNMENT", "LOCATION_MISMATCH"] 
      };
    }

    // Rule 4: EXEC_004_EXPLORE_CONTEXT
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

    // Default Fallback: EXEC_005_SKIP
    return { 
      ruleId: "EXEC_005_SKIP", 
      verdict: VerdictEnum.LIMITED_ALIGNMENT, 
      recommendation: RecommendationEnum.IGNORE, 
      reasons: ["LIMITED_ALIGNMENT"] 
    };
  }

  /**
   * ADVANCED ANALYTICAL ENGINE (V2.3.5 - High Definition Clean Orchestrator)
   * Consumes only perfectly sanitized, normalized input data structures.
   */
  public static evaluateV2(
    input: NormalizedDecisionInput, 
    clock: () => string = () => new Date().toISOString()
  ): DecisionModel {
    
    // 1. Evidence Assembly Stage
    const strengths = EvidenceAssembler.assemble(input.reasons, input.fitVector, "strength");
    const gaps = EvidenceAssembler.assemble(input.reasons, input.fitVector, "gap");

    // 2. Pure Mathematical Scoring Stage (Produces ScoreCard)
    const scoreCard = DecisionScorer.score(strengths, gaps, input.fitVector);
    
    // 3. Coaching Synthesis Stage
    const coachingPlays = CoachingEngine.generatePlays(input.fitVector);

    // 4. Domain Translation: Map numerical indices back to business enums
    let decisionReliability = DecisionReliability.LOW;
    if (scoreCard.reliabilityIndex > 0.80) decisionReliability = DecisionReliability.HIGH;
    else if (scoreCard.reliabilityIndex > 0.60) decisionReliability = DecisionReliability.MEDIUM;

    let interviewProbability = InterviewProbabilityTier.LOW;
    if (scoreCard.interviewIndex > 0.80) interviewProbability = InterviewProbabilityTier.VERY_HIGH;
    else if (scoreCard.interviewIndex > 0.65) interviewProbability = InterviewProbabilityTier.HIGH;
    else if (scoreCard.interviewIndex > 0.50) interviewProbability = InterviewProbabilityTier.MEDIUM;

    const isApply = input.recommendation === "APPLY_IMMEDIATELY" || 
                    input.recommendation === RecommendationEnum.APPLY_IMMEDIATELY;

    return {
      schemaVersion: "1.0",
      engineVersion: "2.3.5",
      generatedAt: clock(),
      category: isApply ? DecisionCategory.APPLY : DecisionCategory.WATCH,
      decisionReliability,
      interviewProbability,
      compositeScore: scoreCard.compositeScore,
      confidenceIndex: scoreCard.confidenceIndex,
      interviewIndex: scoreCard.interviewIndex,
      strengths,
      gaps,
      coachingPlays
    };
  }
}