// lib/ranking/decision/DecisionTraceBuilder.ts
import { FunctionalMatchSummary, DecisionTrace, RequirementAssessment, OpportunitySuggestion, BlindSpotMetrics } from '../ontology/types';
import { ConceptIndex } from '../ontology/index';

export class DecisionTraceBuilder {
  private static readonly ENGINE_VERSION = "6.6.0";

  public static build(summary: FunctionalMatchSummary, engineModel: any): DecisionTrace {
    const jobProfile = summary.jobProfile ?? [];
    const matchedConcepts = summary.matchedConcepts ?? [];

    const assessments: RequirementAssessment[] = jobProfile.map(jobCap => {
      const isMatched = matchedConcepts.includes(jobCap.conceptId);
      const candidateMatch = summary.candidateProfile.find(c => c.conceptId === jobCap.conceptId);
      const evidencePhrases = candidateMatch ? (candidateMatch.evidence?.map(e => e.phrase) ?? []) : [];

      // 🚀 Fix 2.2: O(1) Lookups replace nested registry array iterations
      const foundConcept = ConceptIndex.get(jobCap.conceptId);
      if (!foundConcept) {
        throw new Error(`[DecisionTraceBuilder] Data Integrity Violation: Requirement Node ${jobCap.conceptId} lacks defining ontology registry properties.`);
      }

      // 🚀 Fix 3: Leave a Todo tracker rather than mapping incorrect schema assumptions
      // TODO(PR10): derive match type cleanly from resolver context properties
      let matchType: 'DIRECT' | 'ALIAS' | 'RELATED' | 'NONE' = 'NONE';
      if (isMatched) {
        if (candidateMatch?.conceptId === jobCap.conceptId) {
          matchType = 'DIRECT';
        } else {
          matchType = 'ALIAS';
        }
      }

      const rawPriority = foundConcept.priority?.toUpperCase();
      const priorityLabel = rawPriority === 'CRITICAL' ? 'CRITICAL' : (rawPriority === 'IMPORTANT' ? 'IMPORTANT' : 'OPTIONAL');

      return {
        verified: isMatched,
        requirement: {
          id: jobCap.conceptId,
          label: jobCap.conceptLabel,
          domain: jobCap.domain,
          priorityLabel
        },
        match: {
          type: matchType,
          resumeEvidence: evidencePhrases,
          matchedConceptId: candidateMatch?.conceptId,
          matchedConceptLabel: candidateMatch?.conceptLabel
        },
        ontologyTrail: {
          resumeWording: evidencePhrases[0] ?? "",
          recognizedCapability: candidateMatch?.conceptLabel ?? "",
          employerRequirement: jobCap.conceptLabel
        }
      };
    });

    const unverifiedAssessments = assessments.filter(a => !a.verified);
    const opportunities: OpportunitySuggestion[] = unverifiedAssessments.map(gap => {
      const domainNeighbors = summary.candidateProfile.filter(c => c.domain === gap.requirement.domain);
      return {
        targetRequirementId: gap.requirement.id,
        targetRequirementLabel: gap.requirement.label,
        sourceConceptId: domainNeighbors[0]?.conceptId
      };
    });

    const blindSpots: BlindSpotMetrics[] = [];

    const totalRequirements = assessments.length;
    const verifiedRequirements = assessments.filter(a => a.verified).length;
    const missingCriticalRequirements = assessments.filter(a => !a.verified && a.requirement.priorityLabel === 'CRITICAL').length;

    const uniqueMatchedDomains = Array.from(new Set(assessments.filter(a => a.verified).map(a => a.requirement.domain)));
    const primaryGaps = Array.from(new Set(assessments.filter(a => !a.verified).map(a => a.requirement.label)));

    const resumeVocabulary = summary.candidateProfile.map(c => c.conceptLabel);
    const jdVocabulary = jobProfile.map(j => j.conceptLabel);

    return {
      metadata: { engineVersion: this.ENGINE_VERSION, generatedAt: new Date().toISOString() },
      summary: { 
        overallScore: engineModel.compositeScore, 
        verifiedRequirements, 
        totalRequirements, 
        confidence: engineModel.confidenceIndex, 
        missingCriticalRequirements,
        topMatchedDomains: uniqueMatchedDomains,
        primaryGaps: primaryGaps.slice(0, 2)
      },
      resumeVocabulary,
      jdVocabulary,
      assessments,
      opportunities,
      blindSpots
    };
  }
}