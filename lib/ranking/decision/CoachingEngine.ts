// lib/ranking/decision/CoachingEngine.ts
import { FitVector } from '../types';
import { OptimizationPlay } from './types';
import { CoachingCatalog } from './coachingCatalog';

export class CoachingEngine {
  public static generatePlays(fitVector: FitVector): OptimizationPlay[] {
    // 1. Isolate and sort active vector parameters by lowest performance values first
    const lowestDimensions = Object.entries(fitVector)
      .filter(([_, data]) => data && typeof data.score === 'number')
      .map(([dimension, data]) => ({ dimension, score: data.score }))
      .sort((a, b) => a.score - b.score); // Ascending: lowest scores surface first

    const activePlays: OptimizationPlay[] = [];

    // 2. Cross-reference top deficits against catalog rules
    for (const item of lowestDimensions) {
      if (activePlays.length >= 3) break; // Keep payload tightly focused

      const catalogRule = CoachingCatalog.find(rule => rule.dimension === item.dimension);
      if (catalogRule && item.score < catalogRule.threshold) {
        activePlays.push({
          dimension: catalogRule.dimension,
          title: catalogRule.title,
          play: catalogRule.play,
          impact: catalogRule.impact
        });
      }
    }

    // Default fallback asset strategy if all structural vector parameters clear baselines cleanly
    if (activePlays.length === 0) {
      activePlays.push({
        dimension: "general",
        title: "Fast-Track Leadership Network Loops",
        play: "Core structural fit parameters satisfied cleanly. Advance application profile via direct professional networking circles immediately.",
        impact: "HIGH IMPACT"
      });
    }

    return activePlays;
  }
}