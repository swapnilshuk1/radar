// lib/ranking/briefings/InterviewBriefingPlugin.ts
// Intelligence plugin for Interview Readiness briefing (focus areas and assessment risks).

import { BriefingPlugin, Briefing, EvaluationContext, FitVector } from '../types';

export class InterviewBriefingPlugin implements BriefingPlugin {
  readonly pluginKey = 'interview';
  readonly title = 'Interview Readiness';

  build(context: EvaluationContext, fitVector: FitVector): Briefing {
    const candidate = context.candidate;
    const titleFit = fitVector.titleFit;
    const functional = fitVector.functionalFit;
    const leadership = fitVector.leadershipFit;

    // Inferred themes based on matching domain and experience achievements
    const evaluationThemes: string[] = ["Stakeholder Alignment", "Functional Domain Scale"];
    if (functional?.matched && functional.matched.length > 0) {
      evaluationThemes.push("CRM & Digital Transformation");
    }
    if (candidate.experience?.plOwnership) {
      evaluationThemes.push("Commercial P&L Leadership");
    }

    // Extract risks and preparation checkmarks
    const assessmentRisks: string[] = [];
    if (leadership?.missing && leadership.missing.length > 0) {
      assessmentRisks.push(`Limited board exposure or reporting scope (compared to target).`);
    }
    if (functional?.missing && functional.missing.length > 0) {
      assessmentRisks.push(`Verification of specialized domain tools: ${functional.missing.map(m => m.label).slice(0, 2).join(', ')}.`);
    }

    const prepChecklist = [
      "Prepare concrete examples detailing legacy migrations or platform conversions.",
      "Quantify team leadership stats, budget book scales, and direct impact.",
      "Review organizational reporting hierarchy and executive stakeholders."
    ];

    return {
      title: this.title,
      status: "unlocked",
      confidence: "MEDIUM",
      trustBasis: "Inferred from comparison of candidate strategy targets against opportunity functional requirements.",
      sources: [
        {
          name: "Structured Job Requirements",
          type: "job_listing",
          confidence: "HIGH",
          timestamp: new Date().toISOString()
        },
        {
          name: "Candidate Target Priorities",
          type: "candidate_profile",
          confidence: "HIGH",
          timestamp: new Date().toISOString()
        }
      ],
      lastEvaluated: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      sections: [
        {
          id: "evaluation_themes",
          title: "Likely Evaluation Themes",
          type: "tag_list",
          content: evaluationThemes
        },
        {
          id: "assessment_risks",
          title: "Potential Assessment Gaps",
          type: "risk",
          content: assessmentRisks.length > 0 
            ? assessmentRisks 
            : ["No major structural readiness warnings identified."]
        },
        {
          id: "prep_checklist",
          title: "Preparation Checklist",
          type: "checklist",
          content: prepChecklist
        }
      ]
    };
  }
}
