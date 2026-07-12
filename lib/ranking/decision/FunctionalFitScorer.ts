// lib/ranking/decision/FunctionalFitScorer.ts
import { FunctionalMatcher } from '../ontology/FunctionalMatcher'; // 🔄 Point flatly to the correct file location
import { EvidenceTrace, DecisionTrace, CompetencyDomain } from '../ontology/types';
import { ONTOLOGY_VERSION, getStructuredOntologyRegistry } from '../ontology/data'; // 🔄 Standardized single data path
import { validateOntology } from '../ontology/builder';

export interface EvaluatorScoreCard {
  score: number;
  confidence: number;
  explanation: string;
  matched: string[]; 
  missing: string[];
  trace: DecisionTrace;
}

export class FunctionalFitScorer {
  private static readonly ENGINE_VERSION = "2.5.0";

  public static score(candidateSkills: string[], jobRequirements: string[]): EvaluatorScoreCard {
    const cleanSkills = candidateSkills || [];
    const cleanRequirements = jobRequirements || [];

    const defaultMetadata = {
      ontologyVersion: ONTOLOGY_VERSION, matchedConcepts: [], missingConcepts: [], matchedDomains: [],
      coverage: 0, evidenceTraces: []
    };

    // 🔒 CI Mandatory Data Integrity Verification
    const activeRegistry = getStructuredOntologyRegistry();
    const validation = validateOntology(activeRegistry);
    if (!validation.valid) {
      throw new Error(`[FunctionalFitScorer] Fatal: Data anomaly. ${validation.errors.join(' | ')}`);
    }

    const timestamp = new Date().toISOString();

    const buildEmptyTrace = (score: number): DecisionTrace => ({
      engineVersion: this.ENGINE_VERSION,
      ontologyVersion: ONTOLOGY_VERSION,
      timestamp,
      summary: { overallScore: score, overallConfidence: 0.50, totalDemandedConcepts: 0, totalMatchedConcepts: 0 },
      ontology: { requestedConcepts: [], matchedConcepts: [], unmatchedConcepts: [], matchedDomains: [], domainCoverage: { COMMERCIAL_EXCELLENCE: 0, CUSTOMER_GROWTH_DEMAND: 0, CRM_CUSTOMER_LIFECYCLE: 0, DIGITAL_TRANSFORMATION: 0 } },
      artifacts: { evidenceTraces: [] }
    });

    if (cleanRequirements.length === 0) {
      return {
        score: 45, confidence: 0.50, matched: [], missing: [],
        explanation: "Default baseline evaluation applied due to insufficient data vectors.",
        trace: buildEmptyTrace(45)
      };
    }

    const summary = FunctionalMatcher.compare(cleanSkills, cleanRequirements);
    
    const demandedConcepts = summary.demandedConcepts ?? [];
    const matchedConcepts = summary.matchedConcepts ?? [];
    const matchedDomains = summary.matchedDomains ?? [];
    const candidateProfile = summary.candidateProfile ?? [];
    const jobProfile = summary.jobProfile ?? [];

    if (demandedConcepts.length === 0) {
      return {
        score: 45, confidence: 0.50, matched: [], missing: [],
        explanation: "Capability resolver detected no active executive concepts within the target requirements.",
        trace: buildEmptyTrace(45)
      };
    }

    const coverageRatio = matchedConcepts.length / demandedConcepts.length;
    const finalCalculatedScore = Math.min(100, Math.max(0, Math.round(coverageRatio * 100)));
    const calculatedConfidence = matchedConcepts.length > 0 ? 0.90 : 0.50;

    const evidenceTraces: EvidenceTrace[] = candidateProfile.map(c => {
      const bestEvidence = c.evidence ? c.evidence[0] : null; 
      return {
        conceptId: c.conceptId,
        conceptLabel: c.conceptLabel,
        matchedBy: bestEvidence ? bestEvidence.phrase : c.conceptLabel,
        fromSource: bestEvidence ? bestEvidence.source : 'label'
      };
    });

    const demandedDomainNames = Array.from(new Set(jobProfile.map(j => j.domain)));
    const missingDomainNames = demandedDomainNames.filter(d => !matchedDomains.includes(d));
    const unmatchedConcepts = demandedConcepts.filter(c => !matchedConcepts.includes(c));

    const completeTrace: DecisionTrace = {
      engineVersion: this.ENGINE_VERSION,
      ontologyVersion: ONTOLOGY_VERSION,
      timestamp,
      summary: {
        overallScore: finalCalculatedScore,
        overallConfidence: calculatedConfidence,
        totalDemandedConcepts: demandedConcepts.length,
        totalMatchedConcepts: matchedConcepts.length
      },
      ontology: {
        requestedConcepts: demandedConcepts,
        matchedConcepts,
        unmatchedConcepts,
        matchedDomains,
        domainCoverage: summary.domainCoverage
      },
      artifacts: {
        evidenceTraces
      }
    };

    return {
      score: finalCalculatedScore,
      confidence: calculatedConfidence,
      explanation: `Resolved match across ${matchedConcepts.length} out of ${demandedConcepts.length} demanded executive concepts.`,
      matched: matchedDomains,
      missing: missingDomainNames,
      trace: completeTrace
    };
  }
}