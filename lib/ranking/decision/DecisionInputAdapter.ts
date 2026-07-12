// lib/ranking/decision/DecisionInputAdapter.ts
import { NormalizedDecisionInput } from './types';
import { DecisionEngine } from '../DecisionEngine';
import { DecisionRecommendationEngine } from './DecisionRecommendationEngine';

export class DecisionInputAdapter {
  public static normalize(rawPayload: any): NormalizedDecisionInput {
    const target = rawPayload?.evalResult ? rawPayload.evalResult : (rawPayload || {});
    const fitVector = target?.fitVector ? target.fitVector : (target || {});
    
    // Generate unified outcomes using our pristine V2 evaluate workflow directly
    const legacyMeta = DecisionEngine.generateLegacySignals(fitVector);
    const mockLegacyOutput = DecisionEngine.evaluate(fitVector);

    return {
      fitVector,
      ruleId: legacyMeta.ruleId || "SERVER_PRE_COMPUTED",
      verdict: mockLegacyOutput.verdict,
      recommendation: mockLegacyOutput.recommendation,
      reasons: mockLegacyOutput.reasons,
      dataSource: "SERVER"
    };
  }
}