import { DecisionModel, OptimizationPlay } from './types';

export const OptimizationCatalog: Record<string, { title: string; description: string; effort: "LOW" | "MEDIUM" | "HIGH"; impact: number }> = {
  "LOCATION_MISMATCH": { 
    title: "Clarify Location", 
    description: "If you are open to relocation or remote arrangements, ensure your profile reflects this.",
    effort: "LOW",
    impact: 8
  },
  "VERIFY_COMPANY_HEALTH": {
    title: "Research Company Stability",
    description: "Look for recent funding rounds or leadership changes to assess long-term viability.",
    effort: "MEDIUM",
    impact: 5
  },
  "LIMITED_ALIGNMENT": {
    title: "Refine Target Criteria",
    description: "Consider adjusting your search filters to better reflect your core functional strengths.",
    effort: "LOW",
    impact: 9
  }
};

export class CoachingEngine {
  public static getPlays(model: DecisionModel): OptimizationPlay[] {
    return model.gaps
      .filter(gap => OptimizationCatalog[gap.code])
      .map((gap, index) => {
        const meta = OptimizationCatalog[gap.code];
        return {
          code: gap.code,
          title: meta.title,
          description: meta.description,
          effort: meta.effort,
          estimatedUpside: meta.impact,
          priority: index + 1
        };
      });
  }
}