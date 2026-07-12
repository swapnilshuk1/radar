import { CompetencyStructure } from './types';
import { concept } from './builder';

export const DigitalTransformationOntology: CompetencyStructure = {
  domain: 'DIGITAL_TRANSFORMATION',
  version: '1.0.0',
  concepts: [
    concept({
      id: 'TRAN_001', label: 'Operating Model Design',
      aliases: ['operating model design', 'operating model restructuring', 'organizational alignment'],
      resumeEvidence: ['operating model engineering playbooks', 'organizational alignment setup', 'operating blueprint design'],
      jdEvidence: ['operating model design governance', 'operating model restructuring parameters', 'organizational design tracking']
    }),
    concept({
      id: 'TRAN_002', label: 'Centralized Center of Excellence Strategy',
      aliases: ['centre of excellence', 'center of excellence operational design', 'coe setup'],
      resumeEvidence: ['built performance marketing coe operational tracks', 'global center of excellence setup architecture', 'coe functional execution'],
      jdEvidence: ['center of excellence governance models', 'coe scaling blueprints infrastructure', 'centralized coe designs']
    }),
    concept({
      id: 'TRAN_003', label: 'Platform Modernization Blueprint',
      aliases: ['platform modernization', 'technology transformation', 'digital modernizing blueprint', 'martech ecosystem orchestration'],
      resumeEvidence: ['vml architecture deployment framework', 'platform ownership tracking models', 'salesforce migration infrastructure'],
      jdEvidence: ['platform modernization tracking frameworks', 'martech ecosystem architecture design', 'technology transformation tracks']
    }),
    concept({
      id: 'TRAN_004', label: 'Global Capability Center Scaling',
      aliases: ['global capability center', 'gcc scaling tracks', 'shared service model'],
      resumeEvidence: ['shared service model deployment tracks', 'gcc operational integration modules', 'global capability center scale blueprints'],
      jdEvidence: ['global capability center blueprint infrastructure setup', 'shared services configuration models', 'gcc expansion tracks']
    })
  ]
};