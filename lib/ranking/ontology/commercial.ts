import { CompetencyStructure } from './types';
import { concept } from './builder';

export const CommercialOntology: CompetencyStructure = {
  domain: 'COMMERCIAL_EXCELLENCE',
  version: '1.0.0',
  concepts: [
    concept({
      id: 'COMM_001', label: 'Revenue Growth Strategy',
      aliases: ['revenue growth', 'growth strategy', 'business growth', 'revenue acceleration', 'growth agenda'],
      resumeEvidence: ['growth marketing', 'business growth tracks', 'revenue maximization', 'revenue acceleration engine'],
      jdEvidence: ['revenue growth strategy models', 'top-line acceleration objectives', 'growth velocity targets']
    }),
    concept({
      id: 'COMM_002', label: 'P&L Ownership & Governance',
      aliases: ['p&l ownership', 'p&l accountability', 'financial performance', 'ebitda optimization'],
      resumeEvidence: ['commercial p&l management', 'p&l optimization tracks', 'budget orchestration management'],
      jdEvidence: ['full p&l accountability', 'ebitda contribution oversight', 'financial governance strategy']
    }),
    concept({
      id: 'COMM_003', label: 'Unit Economics Optimization',
      aliases: ['unit economics', 'profitability optimization', 'margin improvement', 'cac models'],
      resumeEvidence: ['cac reduction playbooks', 'margin expansion optimization', 'unit economic engineering'],
      jdEvidence: ['gross margin oversight parameters', 'unit economics engineering frameworks', 'profitability preservation goals']
    }),
    concept({
      id: 'COMM_004', label: 'Pricing Architecture Strategy',
      aliases: ['pricing strategy', 'pricing optimization', 'pricing elasticity', 'monetization strategy'],
      resumeEvidence: ['monetization blueprints', 'pricing flexibility optimizations', 'dynamic pricing models'],
      jdEvidence: ['pricing architecture strategy design', 'monetization framework deployments', 'elasticity models optimization']
    }),
    concept({
      id: 'COMM_005', label: 'Market Footprint Expansion',
      aliases: ['market expansion', 'market penetration', 'category growth', 'share growth', 'market share'],
      resumeEvidence: ['market expansion blueprint infrastructure', 'market penetration metrics scale', 'share growth generation'],
      jdEvidence: ['market footprint expansion directives', 'category growth tracking parameters', 'market share acquisition blueprints']
    })
  ]
};