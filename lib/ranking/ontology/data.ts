// lib/ranking/ontology/data.ts
import { CompetencyDomain, ConceptDefinition, CompetencyStructure, Competency } from './types';

export const ONTOLOGY_VERSION = "1.1.0";

export const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'into', 'across', 'through', 'using', 'led', 'managed',
  'from', 'our', 'their', 'this', 'that', 'are', 'was', 'were', 'been', 'have', 'has', 'had'
]);

export const STEM_RULES: Record<string, string> = {
  'platforms': 'platform', 'campaigns': 'campaign', 'customers': 'customer',
  'strategies': 'strategy', 'models': 'model', 'capabilities': 'capability',
  'centers': 'center', 'channels': 'channel', 'analytics': 'analytic',
  'metrics': 'metric', 'transformations': 'transformation', 'blueprints': 'blueprint',
  'migrations': 'migration', 'ecosystems': 'ecosystem', 'architectures': 'architecture'
};

export const SharedAliases = {
  REVENUE_GROWTH: ['revenue growth', 'growth strategy', 'business growth', 'revenue acceleration', 'growth agenda', 'top-line growth'],
  PL_MANAGEMENT: ['p&l ownership', 'p&l accountability', 'financial performance', 'ebitda optimization', 'commercial p&l', 'p&l management'],
  UNIT_ECONOMICS: ['unit economics', 'profitability optimization', 'margin improvement', 'cac models'],
  PERFORMANCE_MARKETING: ['performance marketing', 'paid acquisition', 'paid media engine', 'growth marketing', 'customer acquisition'],
  DEMAND_GEN: ['demand generation', 'pipeline growth', 'demand creation', 'growth programs', 'lead generation'],
  COE: ['centre of excellence', 'center of excellence', 'coe setup', 'coe'],
  OPERATING_MODEL: ['operating model design', 'operating model restructuring', 'organizational alignment', 'operating model'],
  MARTECH_TRANSFORMATION: ['platform modernization', 'technology transformation', 'digital modernizing blueprint', 'salesforce migration', 'crm migration']
} as const;

Object.freeze(SharedAliases);

export function concept(props: Omit<ConceptDefinition, 'weight'> & { weight?: number }): ConceptDefinition {
  return {
    id: props.id,
    label: props.label,
    weight: props.weight ?? 1.0,
    aliases: props.aliases || [],
    resumeEvidence: props.resumeEvidence || [],
    jdEvidence: props.jdEvidence || [],
    relatedConcepts: props.relatedConcepts || []
  };
}

export const StructuredOntologyRegistry: CompetencyStructure[] = [
  {
    domain: 'COMMERCIAL_EXCELLENCE',
    version: '1.0.0',
    concepts: [
      concept({ id: 'COMM_001', label: 'Revenue Growth Strategy', aliases: [...SharedAliases.REVENUE_GROWTH], resumeEvidence: ['revenue maximization'], jdEvidence: ['revenue growth strategy models'] }),
      concept({ id: 'COMM_002', label: 'P&L Ownership & Governance', aliases: [...SharedAliases.PL_MANAGEMENT], resumeEvidence: ['commercial p&l management'], jdEvidence: ['full p&l accountability'] })
    ]
  },
  {
    domain: 'CUSTOMER_GROWTH_DEMAND',
    version: '1.0.0',
    concepts: [
      concept({ id: 'GROW_001', label: 'Demand Generation Engine', aliases: [...SharedAliases.DEMAND_GEN], resumeEvidence: ['lead generation infrastructure'], jdEvidence: ['demand generation frameworks'] }),
      concept({ id: 'GROW_002', label: 'Customer Acquisition Scaling', aliases: [...SharedAliases.PERFORMANCE_MARKETING], resumeEvidence: ['performance marketing execution'], jdEvidence: ['scale user acquisition'] })
    ]
  },
  {
    domain: 'DIGITAL_TRANSFORMATION',
    version: '1.0.0',
    concepts: [
      concept({ id: 'TRAN_001', label: 'Operating Model Design', aliases: [...SharedAliases.OPERATING_MODEL], resumeEvidence: ['operating blueprint design'], jdEvidence: ['operating model design governance'] }),
      concept({ id: 'TRAN_002', label: 'Centralized Center of Excellence Strategy', aliases: [...SharedAliases.COE], resumeEvidence: ['performance marketing coe'], jdEvidence: ['center of excellence governance'] })
    ]
  }
];

export function getStructuredOntologyRegistry(): CompetencyStructure[] {
  return StructuredOntologyRegistry;
}

export function getCoreMarketingOntology(): Competency[] {
  return StructuredOntologyRegistry.map(struct => ({
    domain: struct.domain,
    concepts: struct.concepts.map(c => c.label),
    aliases: struct.concepts.flatMap(c => c.aliases),
    resumeEvidence: struct.concepts.flatMap(c => c.resumeEvidence),
    jdEvidence: struct.concepts.flatMap(c => c.jdEvidence)
  }));
}