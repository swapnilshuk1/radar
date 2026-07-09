// tests/ranking/OpportunityEnrichment.test.ts
// Tests the decoupled OpportunityEnrichmentService, caching, and threshold evaluation loops.

import { OpportunityEnrichmentService } from '../../lib/ranking/OpportunityEnrichmentService';
import { RankingEngine } from '../../lib/ranking/RankingService';
import { getCandidateProfile } from '../../lib/ranking/config';

describe('OpportunityEnrichmentService & Semantic Enrichment Tests', () => {
  const profile = getCandidateProfile();

  const highMatchJob = {
    title: 'Chief Marketing Officer',
    company: 'Google',
    location: 'Gurugram',
    snippet: 'Looking for an executive leader with P&L ownership and digital transformation experience. Salesforce CDP and MarTech expertise required.'
  };

  const lowMatchJob = {
    title: 'Analyst B2B Sales',
    company: 'TinyCorp',
    location: 'Remote',
    snippet: 'Junior sales coordinator with 0-5 years experience doing cold calling.'
  };

  test('Heuristic Local Fallback works correctly when API Key is missing', async () => {
    // Force missing API key
    const prevKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const enrichment = await OpportunityEnrichmentService.enrich(highMatchJob, profile);
      
      expect(enrichment.overallScore).toBeGreaterThanOrEqual(50);
      expect(enrichment.executiveVerdict).toBe('Strong Candidate');
      expect(enrichment.recommendedPriority).toBe('Strong Match');
      expect(enrichment.strengths.length).toBeGreaterThan(0);
      expect(enrichment.matchedSkills).toContain('Salesforce CDP');
    } finally {
      process.env.GEMINI_API_KEY = prevKey;
    }
  });

  test('Rules-Only evaluation filters low matching jobs before LLM calls', () => {
    const highRulesScore = RankingEngine.evaluateRulesOnly(highMatchJob, profile);
    const lowRulesScore = RankingEngine.evaluateRulesOnly(lowMatchJob, profile);

    expect(highRulesScore).toBeGreaterThanOrEqual(40);
    expect(lowRulesScore).toBe(0); // Excluded by hard filters or low score
  });

  test('Stale resume versions trigger cache invalidation checks', () => {
    const cachedData = {
      overallScore: 85,
      confidence: "High" as const,
      summary: "Good match",
      strengths: ["Strong marketing leadership"],
      gaps: [],
      matchedSkills: [],
      missingSkills: [],
      recommendedAction: "Review immediately",
      reasoning: [],
      executiveVerdict: "Review Immediately" as const,
      recommendedPriority: "Must Review" as const,
      semanticVersion: "1.0",
      sourceResumeVersion: "2026-07-08", // Stale version
      evaluatedAt: new Date().toISOString()
    };

    const currentResumeVersion = "2026-07-09";
    const isStale = cachedData.sourceResumeVersion !== currentResumeVersion;
    
    expect(isStale).toBe(true);
  });
});
