// lib/ranking/DimensionRegistry.ts
// Registry for all scoring dimension evaluators. Measures scorer execution timings for debug profiling.

import { Evaluator, EvaluationContext, FitVector } from './types';

export class DimensionRegistry {
  private static evaluators = new Map<string, Evaluator>();

  public static register(evaluator: Evaluator): void {
    this.evaluators.set(evaluator.dimensionName, evaluator);
  }

  public static get(dimensionName: string): Evaluator | undefined {
    return this.evaluators.get(dimensionName);
  }

  public static executeAll(context: EvaluationContext): FitVector {
    const fitVector: FitVector = {};
    for (const [name, evaluator] of this.evaluators.entries()) {
      const startTime = Date.now();
      try {
        const res = evaluator.score(context);
        const durationMs = Date.now() - startTime;
        fitVector[name] = { ...res, durationMs };
      } catch (err) {
        const durationMs = Date.now() - startTime;
        fitVector[name] = {
          score: 0,
          confidence: 0,
          matched: [],
          missing: [],
          explanation: `Evaluation failed: ${err instanceof Error ? err.message : String(err)}`,
          durationMs
        };
      }
    }
    return fitVector;
  }

  public static clear(): void {
    this.evaluators.clear();
  }
}
