// lib/ranking/OpportunityEnrichmentService.ts
// Decoupled LLM Evidence Engine. Extracts qualitative context and reasoning (no scoring).
// Adheres to strict Recruiter copy guidelines: under 45 words summary, 1 sentence recommendations.

import { EvaluationContext, FitVector, CandidateProfile } from './types';
import { termMatchesTokens, normalize } from './Normalizer';
import { DimensionRegistry } from './DimensionRegistry';

export class OpportunityEnrichmentService {
  /**
   * Compares the EvaluationContext and pre-computed FitVector to generate qualitative evidence tags and summaries.
   */
  static async extractEvidence(
    context: EvaluationContext,
    fitVector: FitVector
  ): Promise<{
    summary: string;
    strengths: string[];
    gaps: string[];
    reasoning: string[];
  }> {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = "gemini-2.5-flash";

    if (!apiKey) {
      console.warn("OpportunityEnrichmentService: GEMINI_API_KEY is not defined. Using local fallback.");
      return this.getLocalFallback(context, fitVector);
    }

    const prompt = this.buildPrompt(context, fitVector);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                strengths: { type: "ARRAY", items: { type: "STRING" } },
                gaps: { type: "ARRAY", items: { type: "STRING" } },
                reasoning: { type: "ARRAY", items: { type: "STRING" } }
              },
              required: ["summary", "strengths", "gaps", "reasoning"]
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const resBody = await response.json();
      const text = resBody.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Empty response text from Gemini API");
      }

      const parsed = JSON.parse(text);
      return {
        summary: parsed.summary || "No summary provided.",
        strengths: parsed.strengths || [],
        gaps: parsed.gaps || [],
        reasoning: parsed.reasoning || []
      };

    } catch (err: any) {
      console.error("OpportunityEnrichmentService: LLM failed. Using local fallback.", err.message);
      return this.getLocalFallback(context, fitVector);
    }
  }

  /**
   * Backward compatibility adapter for legacy .enrich signature.
   */
  static async enrich(
    job: { title: string; company: string; location: string; snippet: string },
    profile: CandidateProfile
  ): Promise<any> {
    const normalizedJob = normalize({ ...job, semanticData: null });

    const context: EvaluationContext = {
      job: normalizedJob,
      candidate: profile,
      config: {}
    };

    const fitVector = DimensionRegistry.executeAll(context);
    const evidence = await this.extractEvidence(context, fitVector);

    return {
      overallScore: 70, // legacy fallback score
      confidence: "High",
      summary: evidence.summary,
      strengths: evidence.strengths,
      gaps: evidence.gaps,
      matchedSkills: [],
      missingSkills: [],
      recommendedAction: "Review opportunity details.",
      reasoning: evidence.reasoning,
      executiveVerdict: "Worth Monitoring",
      recommendedPriority: "Possible Match",
      semanticVersion: "1.0",
      sourceResumeVersion: profile.resume?.sourceResumeVersion || "3.1.2",
      evaluatedAt: new Date().toISOString()
    };
  }

  private static buildPrompt(context: EvaluationContext, fitVector: FitVector): string {
    const job = context.job;
    const profile = context.candidate;

    // Build simplified Fit Vector summary to avoid token waste
    const fitSummary = Object.entries(fitVector).map(([name, dim]) => {
      return `- ${name}: score=${dim.score}, matched=${dim.matched.map(m => m.label).join(', ')}, missing=${dim.missing.map(m => m.label).join(', ')}`;
    }).join('\n');

    return `
You are an elite executive search consultant evaluating senior leadership candidates.

Candidate Profile Identity:
${JSON.stringify(profile.identity, null, 2)}

Candidate Experience:
${JSON.stringify(profile.experience, null, 2)}

Candidate Strategy Target:
${JSON.stringify(profile.strategy, null, 2)}

Pre-computed Deterministic Fit Vector:
${fitSummary}

Job Opportunity Details:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.snippet}

Conduct a high-fidelity qualitative analysis. Return ONLY a JSON block matching the requested schema. Do not generate scores.

Strict Writing Standards:
- Do NOT use filler phrases (e.g. "This role appears to be", "Based on the description", "It seems that").
- Write with absolute confidence, authority, and brevity. Use concise fragments (e.g. "Strong commercial alignment", "CDP scaling expertise matches").
- Summary constraint: MUST be under 45 words total.
- Gaps and Strengths: Limit to 3 specific items maximum.
- Zero emojis. Zero marketing buzzwords. Keep the tone calm and analytical.
`;
  }

  public static getLocalFallback(
    context: EvaluationContext,
    fitVector: FitVector
  ): {
    summary: string;
    strengths: string[];
    gaps: string[];
    reasoning: string[];
  } {
    const job = context.job;
    const titleLower = job.title.toLowerCase();
    const snippetLower = job.snippet.toLowerCase();

    const strengths: string[] = [];
    const gaps: string[] = [];

    const titleScore = fitVector.titleFit?.score || 0;
    const functionalScore = fitVector.functionalFit?.score || 0;
    const leadershipScore = fitVector.leadershipFit?.score || 0;

    if (titleScore >= 80) {
      strengths.push("Direct alignment with target executive roles.");
    } else {
      gaps.push("Job title does not match target executive list.");
    }

    if (functionalScore >= 60) {
      strengths.push("Matches digital marketing and growth transformation competencies.");
    } else {
      gaps.push("Missing core Salesforce CDP or CRM transformation signals.");
    }

    if (leadershipScore >= 70) {
      strengths.push("Matches structural P&L and board reporting requirements.");
    }

    return {
      summary: `Local offline check. ${
        titleScore >= 60 
          ? "Potential alignment detected based on title, seniority, and skill overlaps."
          : "Limited alignment detected; candidate background shows some functional differences."
      }`,
      strengths: strengths.length > 0 ? strengths : ["Candidate has relevant executive experience."],
      gaps: gaps.length > 0 ? gaps : ["Evaluate specific functional capability vs profile."],
      reasoning: [
        `Deterministic title score: ${titleScore}/100`,
        `Deterministic functional score: ${functionalScore}/100`,
        `Deterministic leadership score: ${leadershipScore}/100`
      ]
    };
  }
}
