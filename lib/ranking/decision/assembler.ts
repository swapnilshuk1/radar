import { DecisionModel } from './types';
import { EvidenceCatalog } from './catalog';
import { CoachingEngine } from './coaching';

export interface PresentationEvidence {
  title: string;
  description: string;
  icon: string;
  severity: "positive" | "negative";
}

export interface ExecutiveBrief {
  summary: { 
    badge: string; 
    headline: string; 
    subheadline: string; 
  };
  strengths: PresentationEvidence[];
  risks: PresentationEvidence[];
  recommendedActions: any[];
}

export class ExecutiveBriefBuilder {
  public static build(model: DecisionModel): ExecutiveBrief {
    return {
      summary: {
        badge: model.category === "APPLY" ? "Strong Match" : "Review Required",
        headline: model.category === "APPLY" ? "Excellent Opportunity" : "Candidate Evaluation",
        subheadline: "Based on your functional alignment and executive scope."
      },
      strengths: model.strengths.map(s => ({ 
        ...EvidenceCatalog[s.code], 
        severity: "positive" 
      })),
      risks: model.gaps.map(g => ({ 
        ...EvidenceCatalog[g.code], 
        severity: "negative" 
      })),
      recommendedActions: CoachingEngine.getPlays(model)
    };
  }
}