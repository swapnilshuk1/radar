import { FitVector, RecommendationEnum, VerdictEnum } from './types';
import { DecisionModel, DecisionCategory, DecisionReliability } from './decision/types';
import { EvidenceCatalog } from './decision/catalog';

// Keep your existing evaluate() logic here...
export class DecisionEngine {
  public static evaluate(fitVector: FitVector): { ruleId: string, verdict: VerdictEnum, recommendation: RecommendationEnum, reasons: string[] } {
     // ... [Your existing legacy logic] ...
  }

  // NATIVE V2 ENGINE
  public static evaluateV2(fitVector: FitVector, clock: () => string = () => new Date().toISOString()): DecisionModel {
    const legacy = this.evaluate(fitVector);
    
    // Logic is now native: No adapter needed.
    const strengths = legacy.reasons
      .filter(r => EvidenceCatalog[r]?.kind === "strength")
      .map((code, i) => ({ code, decisionContribution: legacy.reasons.length - i, signals: [] }));
      
    const gaps = legacy.reasons
      .filter(r => EvidenceCatalog[r]?.kind === "gap")
      .map((code, i) => ({ code, decisionContribution: legacy.reasons.length - i, signals: [] }));

    return {
      schemaVersion: "1.0",
      engineVersion: "2.1.2",
      generatedAt: clock(),
      category: legacy.recommendation === "APPLY_IMMEDIATELY" ? DecisionCategory.APPLY : DecisionCategory.WATCH,
      decisionReliability: DecisionReliability.HIGH,
      strengths,
      gaps,
      coachingPlays: [] 
    };
  }
}