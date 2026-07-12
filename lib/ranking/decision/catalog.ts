// lib/ranking/decision/catalog.ts

export interface EvidenceTemplate {
  code: string;
  dimension: 'title' | 'leadership' | 'functional' | 'location' | 'career' | 'company';
  type: 'strength' | 'gap';
  threshold: (score: number) => boolean;
  priority: number;
  title: string;
  description: string;
}

export const EvidenceCatalog: Record<string, EvidenceTemplate> = {
  // Title Alignment Signatures
  EXCELLENT_TITLE_MATCH: {
    code: "EXCELLENT_TITLE_MATCH",
    dimension: "title",
    type: "strength",
    threshold: (score) => score >= 85,
    priority: 9,
    title: "Strong Title Target Alignment",
    description: "The opportunity directly matches your target corporate executive framework scope."
  },
  TITLE_VARIANCE_WARNING: {
    code: "TITLE_VARIANCE_WARNING",
    dimension: "title",
    type: "gap",
    threshold: (score) => score < 65,
    priority: 7,
    title: "Corporate Title Scope Variance",
    description: "The organizational title alignment bounds fall outside standard historical scope metrics."
  },

  // Leadership/Seniority Signatures
  EXECUTIVE_SCOPE_MATCH: {
    code: "EXECUTIVE_SCOPE_MATCH",
    dimension: "leadership",
    type: "strength",
    threshold: (score) => score >= 80,
    priority: 10,
    title: "Elite Seniority Mandate Fit",
    description: "Enterprise scale and clear command parameters verify an exact executive seniority scope match."
  },
  SENIORITY_DEFICIT_RISK: {
    code: "SENIORITY_DEFICIT_RISK",
    dimension: "leadership",
    type: "gap",
    threshold: (score) => score < 60,
    priority: 8,
    title: "Seniority Mandate Compression",
    description: "The leadership mandate or resource scope may sit slightly below your current trajectory target."
  },

  // Functional Signatures
  HIGH_FUNCTIONAL_OVERLAP: {
    code: "HIGH_FUNCTIONAL_OVERLAP",
    dimension: "functional",
    type: "strength",
    threshold: (score) => score >= 75,
    priority: 9,
    title: "Deep Functional Capability Match",
    description: "Core transformation and operational delivery parameters map cleanly to established capabilities."
  },
  FUNCTIONAL_GAP_RISK: {
    code: "FUNCTIONAL_GAP_RISK",
    dimension: "functional",
    type: "gap",
    threshold: (score) => score < 50,
    priority: 6,
    title: "Functional Vector Discrepancy",
    description: "The functional index reveals a variance that requires closer tactical alignment verification."
  },

  // Location/Geographic Signatures
  PREMIUM_LOCATION_FIT: {
    code: "PREMIUM_LOCATION_FIT",
    dimension: "location",
    type: "strength",
    threshold: (score) => score >= 85,
    priority: 8,
    title: "Optimal Geographic Hub Alignment",
    description: "The professional opportunity is perfectly situated within your local geographical operational market."
  },
  GEOGRAPHIC_LOCATION_MISMATCH: {
    code: "GEOGRAPHIC_LOCATION_MISMATCH",
    dimension: "location",
    type: "gap",
    threshold: (score) => score < 70,
    priority: 7,
    title: "Geographic Location Mismatch",
    description: "The operational location presents clear travel or structural placement variance metrics."
  }
};