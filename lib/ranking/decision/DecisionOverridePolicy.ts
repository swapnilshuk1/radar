// lib/ranking/decision/DecisionOverridePolicy.ts
import { FitVector } from '../types';
import { PolicyResult, PolicyViolation } from './types';

export class DecisionOverridePolicy {
  /**
   * Evaluates corporate and hard requirement policy conditions.
   * Collects violations dynamically without altering mathematical records.
   */
  public static evaluate(fitVector: FitVector): PolicyResult {
    const violations: PolicyViolation[] = [];
    const hardReqScore = fitVector.hardRequirementFit?.score;

    // Policy Gate 1: Mandatory Hard Requirements Blocker Check
    if (hardReqScore !== undefined && hardReqScore <= 30) {
      violations.push({
        code: 'HARD_REQUIREMENT_MISMATCH',
        severity: 'BLOCKER',
        explanation: 'Mandatory hard requirement match parameters are missing or unverified.'
      });
    }

    return {
      applied: violations.length > 0,
      violations
    };
  }
}