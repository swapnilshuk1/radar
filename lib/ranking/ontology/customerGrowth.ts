import { CompetencyStructure } from './types';
import { concept } from './builder';

export const CustomerGrowthOntology: CompetencyStructure = {
  domain: 'CUSTOMER_GROWTH_DEMAND',
  version: '1.0.0',
  concepts: [
    concept({
      id: 'GROW_001', label: 'Demand Generation Engine',
      aliases: ['demand generation', 'pipeline growth', 'demand creation', 'growth programs'],
      resumeEvidence: ['inbound demand strategy optimization', 'lead generation infrastructure scaling', 'pipeline acceleration paths'],
      jdEvidence: ['demand generation frameworks deployment', 'pipeline growth velocity models', 'demand creation engine blueprint']
    }),
    concept({
      id: 'GROW_002', label: 'Customer Acquisition Scaling',
      aliases: ['customer acquisition', 'acquisition strategy', 'performance marketing', 'paid media engine'],
      resumeEvidence: ['performance marketing coe scaling', 'paid acquisition engine optimization', 'roas management optimization'],
      jdEvidence: ['scale user acquisition parameters', 'growth engine ownership blueprints', 'acquisition investment strategy parameters']
    }),
    concept({
      id: 'GROW_003', label: 'Conversion Funnel Optimization',
      aliases: ['funnel acceleration', 'conversion rate optimization', 'cro tracks', 'acquisition execution'],
      resumeEvidence: ['conversion funnel optimization playbooks', 'conversion path testing structures', 'cro execution infrastructure'],
      jdEvidence: ['conversion rate optimization targets', 'funnel acceleration models', 'cro optimization maps']
    })
  ]
};