// lib/ranking/dimensions/HardRequirementScorer.ts
// Evaluator checking for mandatory/must-have requirements candidate lacks.
// Employs a 15-second timed synchronous subprocess calling Gemini, backed by DB caching.

import { Evaluator, EvaluationContext, EvaluationDimension, MatchEvidence } from '../types';
import { execSync } from 'child_process';
import path from 'path';

export class HardRequirementScorer implements Evaluator {
  readonly dimensionName = 'hardRequirementFit';

  score(context: EvaluationContext): EvaluationDimension {
    const job = context.job;
    const profile = context.candidate;

    // 1. Check if semanticData is present (gating: only run on LLM-enriched tier)
    if (!job.semanticData) {
      return this.getLocalFallback();
    }

    try {
      const parsedSem = JSON.parse(job.semanticData);
      const currentResumeVersion = profile.resume?.sourceResumeVersion || "unknown";

      // 2. Cache Hit: Check if hardMismatches is present and resume version matches
      if (
        parsedSem.hardMismatches && 
        Array.isArray(parsedSem.hardMismatches) &&
        parsedSem.sourceResumeVersion === currentResumeVersion
      ) {
        return this.buildDimensionFromMismatches(parsedSem.hardMismatches);
      }

      // 3. Skip check if request options forbid network calls (e.g. weights rescore/preview)
      if (context.skipLlmCheck) {
        return this.getLocalFallback();
      }

      // 4. Cache Miss: Invoke synchronous Gemini helper script
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return this.getLocalFallback();
      }

      const inputPayload = JSON.stringify({
        title: job.title,
        snippet: job.snippet || "",
        profile: {
          resumeText: profile.resume?.rawText || "",
          skills: profile.skills || [],
          achievements: profile.experience?.achievements || []
        }
      });

      const scriptPath = path.join(process.cwd(), 'scripts/check-hard-requirements.js');
      
      const stdout = execSync(`node "${scriptPath}"`, {
        input: inputPayload,
        env: { 
          ...process.env, 
          GEMINI_API_KEY: apiKey,
          GEMINI_MODEL: "gemini-2.5-flash"
        },
        timeout: 15000,
        encoding: 'utf-8'
      });

      const response = JSON.parse(stdout);
      if (response.error) {
        console.warn("HardRequirementScorer: child script returned error:", response.error);
        return this.getLocalFallback();
      }

      const hardMismatches = response.hardMismatches || [];
      return this.buildDimensionFromMismatches(hardMismatches);

    } catch (err: any) {
      console.error("HardRequirementScorer: failed to execute check. Using fallback.", err.message);
      return this.getLocalFallback();
    }
  }

  private buildDimensionFromMismatches(hardMismatches: string[]): EvaluationDimension {
    const missing: MatchEvidence[] = [];

    if (hardMismatches.length === 0) {
      return {
        score: 100,
        confidence: 0.7,
        matched: [],
        missing: [],
        explanation: "No hard requirement mismatches detected.",
        metadata: { hardMismatches }
      };
    }

    for (const item of hardMismatches) {
      const sanitizedId = item.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 50);
      missing.push({
        id: `hard_miss_${sanitizedId}`,
        label: item,
        source: "job",
        confidence: 0.7,
        weight: 40
      });
    }

    return {
      score: 20,
      confidence: 0.7,
      matched: [],
      missing,
      explanation: `Candidate lacks mandatory requirements: ${hardMismatches.join('; ')}`,
      metadata: { hardMismatches }
    };
  }

  private getLocalFallback(): EvaluationDimension {
    return {
      score: 70,
      confidence: 0.3,
      matched: [],
      missing: [],
      explanation: "Hard requirement check unavailable — verify manually."
    };
  }
}
