// tests/ranking/legacy/adapter.ts
import { DecisionOutput, RecommendationEnum } from '../../../lib/ranking/types'; 
import { DecisionCategory, DecisionReliability, DecisionModel, EvidencePiece } from '../../../lib/ranking/decision/types';
import { EvidenceCatalog } from '../../../lib/ranking/decision/catalog';

export class DecisionModelAdapter {
  
  public static toModelV2(legacy: DecisionOutput, clock: () => string): DecisionModel {
    const strengths = this.extractEvidence(legacy.reasons, "strength");
    const gaps = this.extractEvidence(legacy.reasons, "gap");

    return {
      schemaVersion: "1.0",
      engineVersion: "2.0-parity",
      generatedAt: clock(),
      category: legacy.recommendation === "APPLY_IMMEDIATELY" ? DecisionCategory.APPLY : DecisionCategory.WATCH,
      decisionReliability: DecisionReliability.UNKNOWN,
      strengths,
      gaps,
      coachingPlays: []
    };
  }

  private static extractEvidence(reasons: string[], targetKind: "strength" | "gap"): EvidencePiece[] {
    return reasons
      .filter(reason => EvidenceCatalog[reason]?.kind === targetKind) 
      .map((code, index, filteredArray) => ({
        code,
        decisionContribution: filteredArray.length - index, 
        signals: [] 
      }));
  }
}