// lib/ranking/ontology/index.ts
import { getStructuredOntologyRegistry } from './data';
import { CompetencyDomain } from './types';

export interface ConceptDefinition {
  readonly id: string;
  readonly label: string;
  readonly domain: CompetencyDomain;
  readonly weight: number;
  readonly priority: 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
}

// 🚀 Fix 2: Build an index once to completely remove O(n²) runtime lookups
export const ConceptIndex = new Map<string, any>();

for (const structure of getStructuredOntologyRegistry()) {
  for (const concept of structure.concepts) {
    ConceptIndex.set(concept.id, {
      ...concept,
      domain: structure.domain
    });
  }
}