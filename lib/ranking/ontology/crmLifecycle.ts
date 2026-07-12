import { CompetencyStructure } from './types';
import { concept } from './builder';

export const CrmLifecycleOntology: CompetencyStructure = {
  domain: 'CRM_CUSTOMER_LIFECYCLE',
  version: '1.0.0',
  concepts: [
    concept({
      id: 'CRM_001', label: 'Customer Lifecycle Optimization',
      aliases: ['customer lifecycle', 'lifecycle marketing', 'lifecycle growth', 'retention optimization'],
      resumeEvidence: ['retention optimization programs execution', 'lifecycle growth framework optimizations', 'lifecycle engineering pathways'],
      jdEvidence: ['lifecycle optimization tracks deployment', 'customer retention architecture blueprints', 'churn reduction tracking blueprints']
    }),
    concept({
      id: 'CRM_002', label: 'Journey Orchestration Systems',
      aliases: ['journey orchestration', 'customer experience strategy', 'customer journey mapping', 'omni channel engagement'],
      resumeEvidence: ['journey orchestration deployment models', 'omni channel engagement systems setup', 'customer experience engineering'],
      jdEvidence: ['journey orchestration platform governance', 'omni-channel personalization frameworks', 'omni channel tracking systems']
    }),
    concept({
      id: 'CRM_003', label: 'Enterprise Marketing Automation',
      aliases: ['marketing automation', 'automation scaling', 'crm platform', 'salesforce marketing cloud'],
      resumeEvidence: ['salesforce marketing cloud suite configuration', 'crm migration orchestration', 'sfmc engine customization', 'sap crm engineering'],
      jdEvidence: ['enterprise marketing automation tracking', 'crm platform integration architecture', 'automation scaling governance']
    }),
    concept({
      id: 'CRM_004', label: 'Customer Data Platform Architecture',
      aliases: ['customer data platform', 'cdp deployment', 'data cloud', 'first party data', 'profile unification'],
      resumeEvidence: ['data cloud configuration deployment', 'cdp connection maps mapping', '1st party data playbook deployment', 'profile unification infrastructure'],
      jdEvidence: ['cdp deployment architecture governance', 'first party data monetization frameworks', 'unified profile orchestration models']
    })
  ]
};