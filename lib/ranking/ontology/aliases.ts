// lib/ranking/ontology/data/aliases.ts

export const SharedAliases = {
  REVENUE_GROWTH: [
    'revenue growth', 'growth strategy', 'business growth', 'revenue acceleration', 
    'growth agenda', 'top-line growth', 'commercial growth'
  ],
  PL_MANAGEMENT: [
    'p&l ownership', 'p&l accountability', 'financial performance', 'ebitda optimization', 
    'commercial p&l', 'margin management', 'p&l management'
  ],
  UNIT_ECONOMICS: [
    'unit economics', 'profitability optimization', 'margin improvement', 'cac models', 'unit economic engineering'
  ],
  PERFORMANCE_MARKETING: [
    'performance marketing', 'paid acquisition', 'paid media engine', 'growth marketing', 
    'acquisition strategy', 'customer acquisition', 'roas management'
  ],
  DEMAND_GEN: [
    'demand generation', 'pipeline growth', 'demand creation', 'growth programs', 'lead generation'
  ],
  CRM_LIFECYCLE: [
    'customer lifecycle', 'lifecycle marketing', 'lifecycle growth', 'retention optimization', 'crm transformation'
  ],
  JOURNEY_ORCHESTRATION: [
    'journey orchestration', 'customer experience strategy', 'customer journey mapping', 'omni channel engagement'
  ],
  COE: [
    'centre of excellence', 'center of excellence operational design', 'coe setup', 'center of excellence', 'coe'
  ],
  OPERATING_MODEL: [
    'operating model design', 'operating model restructuring', 'organizational alignment', 'operating model'
  ],
  MARTECH_TRANSFORMATION: [
    'platform modernization', 'technology transformation', 'digital modernizing blueprint', 
    'martech ecosystem orchestration', 'salesforce migration', 'crm migration'
  ]
} as const;

// Ensure runtime freezing protection against modifications
Object.freeze(SharedAliases);
for (const key of Object.keys(SharedAliases)) {
  Object.freeze((SharedAliases as any)[key]);
}