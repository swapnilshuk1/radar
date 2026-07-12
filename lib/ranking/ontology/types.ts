// lib/ranking/ontology/types.ts

export type CompetencyDomain = 
  | 'COMMERCIAL_EXCELLENCE'
  | 'CUSTOMER_GROWTH_DEMAND'
  | 'CRM_CUSTOMER_LIFECYCLE'
  | 'DIGITAL_TRANSFORMATION';

export interface MatchEvidence {
  readonly phrase: string;
  readonly conceptId: string;
  readonly source: 'label' | 'aliases' | 'resumeEvidence' | 'jdEvidence';
}

export interface ConceptNode {
  readonly id: string;
  readonly label: string;
}

export interface BlindSpotMetrics {
  readonly keyword: string;
  readonly jdOccurrences: number;
  readonly resumeOccurrences: number;
  readonly exampleJD: string;
  readonly closestResumePhrase?: string;
}

export interface RequirementAssessment {
  readonly verified: boolean;
  readonly requirement: {
    readonly id: string;
    readonly label: string;
    readonly domain: CompetencyDomain;
    readonly priorityLabel: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  };
  readonly match: {
    readonly type: 'DIRECT' | 'ALIAS' | 'RELATED' | 'NONE';
    readonly resumeEvidence: string[];
    readonly matchedConceptId?: string;
    readonly matchedConceptLabel?: string;
  };
  readonly ontologyTrail: {
    readonly resumeWording: string;
    readonly recognizedCapability: string;
    readonly employerRequirement: string;
  };
}

export interface OpportunitySuggestion {
  readonly targetRequirementId: string;
  readonly targetRequirementLabel: string;
  readonly sourceConceptId?: string;
}

export interface DecisionTrace {
  readonly metadata: {
    readonly engineVersion: string;
    readonly generatedAt: string;
  };
  readonly summary: {
    readonly overallScore: number;
    readonly confidence: number;
    readonly verifiedRequirements: number;
    readonly totalRequirements: number;
    readonly missingCriticalRequirements: number;
    readonly topMatchedDomains: string[];
    readonly primaryGaps: string[];
  };
  readonly resumeVocabulary: string[];
  readonly jdVocabulary: string[];
  readonly assessments: readonly RequirementAssessment[];
  readonly opportunities: readonly OpportunitySuggestion[];
  readonly blindSpots: readonly BlindSpotMetrics[];
}