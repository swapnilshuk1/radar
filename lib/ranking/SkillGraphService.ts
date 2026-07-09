// lib/ranking/SkillGraphService.ts
// Centralized taxonomy and cluster resolution helper.

import { getConfig } from './config';

export class SkillGraphService {
  private static clusters: string[][] = [];
  
  private static hierarchy: Record<string, string[]> = {
    "customer growth": ["crm", "cdp", "loyalty", "lifecycle", "retention", "automation", "salesforce", "braze", "hubspot", "adobe"],
    "crm": ["salesforce", "marketing cloud", "cdp", "journey builder", "oracle", "hubspot"],
    "digital transformation": ["martech", "digital acceleration", "digital strategy", "digital innovation", "gcc", "center of excellence"],
    "performance marketing": ["growth marketing", "demand generation", "paid marketing", "roas", "funnel", "attribution"],
    "brand strategy": ["brand positioning", "brand equity", "brand building"],
    "e-commerce": ["d2c", "online retail", "shopify", "magento"]
  };

  private static loadClusters() {
    if (this.clusters.length > 0) return;
    try {
      const config = getConfig();
      this.clusters = config.ranking_engine.functional_fit.semantic_clusters || [];
    } catch {
      this.clusters = [];
    }
  }

  /**
   * Resolves a term to its synonyms and related parent/child keywords
   */
  public static resolve(term: string): string[] {
    this.loadClusters();
    const normalized = term.toLowerCase().trim();
    const results = new Set<string>([normalized]);

    // Check pre-configured clusters from config
    for (const cluster of this.clusters) {
      const lowerCluster = cluster.map(c => c.toLowerCase());
      if (lowerCluster.includes(normalized)) {
        lowerCluster.forEach(item => results.add(item));
      }
    }

    // Check hierarchical rules (both parents and children)
    for (const [parent, children] of Object.entries(this.hierarchy)) {
      if (parent === normalized || children.includes(normalized)) {
        results.add(parent);
        children.forEach(child => results.add(child));
      }
    }

    return Array.from(results);
  }

  /**
   * Calculates similarity distance (0.0 to 1.0) between two terms in the graph.
   */
  public static calculateMatch(termA: string, termB: string): { matched: boolean; score: number } {
    const listA = this.resolve(termA);
    const listB = this.resolve(termB);

    // Exact matches
    if (termA.toLowerCase().trim() === termB.toLowerCase().trim()) {
      return { matched: true, score: 1.0 };
    }

    // Direct cluster overlap check
    const intersection = listA.filter(x => listB.includes(x));
    if (intersection.length > 0) {
      return { matched: true, score: 0.85 };
    }

    return { matched: false, score: 0.0 };
  }
}
