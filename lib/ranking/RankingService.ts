// lib/ranking/RankingService.ts
// Pipeline orchestrator of the V3.1 Constraint-Solving Decision Engine (Auditable & Extensible).

import { 
  JobInput, 
  NormalizedJob,
  CandidateProfile, 
  RankingResult, 
  EvaluationContext, 
  FitVector, 
  EvaluationResult, 
  EvaluationStatus, 
  RecommendationEnum, 
  VerdictEnum
} from './types';

import crypto from 'crypto';
import { normalize } from './Normalizer';
import { getConfig, getCandidateProfile, getRankingConfig } from './config';
import { DimensionRegistry } from './DimensionRegistry';
import { DecisionEngine } from './DecisionEngine';
import { OpportunityEnrichmentService } from './OpportunityEnrichmentService';
import { IntelligenceEngine } from './IntelligenceEngine';
import { Telemetry } from './Telemetry';
import { VERSION_MANIFEST } from './VersionManifest';

// Import Evaluator Scorers
import { TitleFitScorer } from './dimensions/TitleFit';
import { SeniorityFitScorer } from './dimensions/SeniorityFit';
import { FunctionalFitScorer } from './dimensions/FunctionalFit';
import { ExecutiveSignalsScorer } from './dimensions/ExecutiveSignals';
import { IndustryFitScorer } from './dimensions/IndustryFit';
import { LocationScorer } from './dimensions/LocationScorer';
import { CompanyResolver } from './dimensions/CompanyResolver';

// Register V3.1 Evaluators in Registry
DimensionRegistry.clear();
DimensionRegistry.register(new TitleFitScorer());
DimensionRegistry.register(new SeniorityFitScorer());
DimensionRegistry.register(new FunctionalFitScorer());
DimensionRegistry.register(new ExecutiveSignalsScorer());
DimensionRegistry.register(new IndustryFitScorer());
DimensionRegistry.register(new LocationScorer());
DimensionRegistry.register(new CompanyResolver());

// --- Item 13: In-process Evaluation Cache ---
// Scoped to the Node.js process lifecycle. Invalidated on server restart or engine version bump.
// Key = SHA-256( jobHash + profileVersion + engineVersion )
const evalCache = new Map<string, RankingResult>();

function computeEvalCacheKey(jobHash: string, profileVersion: string, engineVersion: string): string {
  return crypto.createHash('sha256')
    .update(`${jobHash}|${profileVersion}|${engineVersion}`)
    .digest('hex');
}

export class RankingEngine {
  /**
   * Helper to check if a job matches title or content exclusions.
   */
  public static isExcluded(job: NormalizedJob, config: any): boolean {
    const titleLower = job.title.toLowerCase();
    const snippetLower = job.snippet.toLowerCase();

    // Check title exclusions
    const excludeTitles = config?.hard_filters?.exclude_titles || [];
    for (const term of excludeTitles) {
      if (titleLower.includes(term.toLowerCase())) {
        return true;
      }
    }

    // Check content exclusions
    const excludeContent = config?.hard_filters?.exclude_content || [];
    for (const term of excludeContent) {
      if (snippetLower.includes(term.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Compute a secure SHA-256 hash of the normalized job parameters (Title + Snippet + Company).
   */
  public static computeHash(job: NormalizedJob): string {
    const rawString = `${job.title}||${job.snippet}||${job.company}`.toLowerCase().trim();
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Helper to calculate expected fields coverage score.
   */
  private static calculateCoverage(job: any): number {
    let filled = 0;
    if (job.title && job.title.trim() !== '') filled++;
    if (job.snippet && job.snippet.trim() !== '') filled++;
    if (job.locationNorm && job.locationNorm.trim() !== '') filled++;
    if (job.companyNorm && job.companyNorm.trim() !== '') filled++;
    return Number((filled / 4).toFixed(2));
  }

  /**
   * Evaluate only local rules to return a base score (0-100) for Scraper gating.
   * Uses configurable weights from config or local defaults.
   */
  public static evaluateRulesOnly(job: Omit<JobInput, 'semanticData'>, profile?: CandidateProfile, traceId?: string): number {
    const activeTraceId = traceId ?? Telemetry.generateTraceId();
    Telemetry.startTimer(activeTraceId, "normalizer");

    const resolvedProfile = profile ?? getCandidateProfile();
    const normalizedJob = normalize({ ...job, semanticData: null });

    const context: EvaluationContext = {
      job: normalizedJob,
      candidate: resolvedProfile,
      config: getRankingConfig()
    };

    if (this.isExcluded(normalizedJob, context.config)) {
      Telemetry.stopTimer(activeTraceId, "normalizer", "FAILED", `Exclusion matched for title: ${job.title}`);
      return 0;
    }

    Telemetry.stopTimer(activeTraceId, "normalizer", "SUCCESS", `Normalization complete: ${job.title}`);

    Telemetry.startTimer(activeTraceId, "scoring");
    const fitVector = DimensionRegistry.executeAll(context);
    const score = this.computeWeightedScore(fitVector);
    Telemetry.stopTimer(activeTraceId, "scoring", "SUCCESS", `Local scoring complete: ${score}`, { score });

    return score;
  }

  /**
   * Computes the combined weighted score based on weights registry config.
   */
  private static computeWeightedScore(fitVector: FitVector): number {
    // Target Weights config
    const weights: Record<string, number> = {
      titleFit: 0.25,
      leadershipFit: 0.20,
      functionalFit: 0.30,
      industryFit: 0.10,
      locationFit: 0.05,
      careerProgressionFit: 0.10,
      companyHealth: 0.0
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [name, dim] of Object.entries(fitVector)) {
      const weight = weights[name] ?? 0;
      totalWeightedScore += dim.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  }

  /**
   * Evaluates a job against a profile, triggering external LLM enrichment if qualified.
   * Consumes cached semanticData from SQLite if available.
   */
  public static evaluate(job: JobInput, profile?: CandidateProfile, traceId?: string): RankingResult {
    const activeTraceId = traceId ?? Telemetry.generateTraceId();
    Telemetry.startTimer(activeTraceId, "normalizer");

    const resolvedProfile = profile ?? getCandidateProfile();
    const normalizedJob = normalize(job);

    const context: EvaluationContext = {
      job: normalizedJob,
      candidate: resolvedProfile,
      config: getRankingConfig()
    };

    // Check hard filters
    if (this.isExcluded(normalizedJob, context.config)) {
      Telemetry.stopTimer(activeTraceId, "normalizer", "FAILED", `Exclusion matched for title: ${job.title}`);
      return {
        rejected: true,
        rejectReason: "Exclusions matched"
      };
    }

    Telemetry.stopTimer(activeTraceId, "normalizer", "SUCCESS", `Normalization complete: ${job.title}`);

    // --- Evaluation Cache check (item 13) ---
    const jobHashForCache = this.computeHash(normalizedJob);
    const evalCacheKey = computeEvalCacheKey(
      jobHashForCache,
      resolvedProfile.resume?.sourceResumeVersion ?? 'unknown',
      VERSION_MANIFEST.ruleEngine
    );
    if (evalCache.has(evalCacheKey)) {
      Telemetry.log(activeTraceId, "eval_cache", "INFO", `Cache HIT: ${job.title}`, { cacheKey: evalCacheKey.slice(0, 12) });
      return evalCache.get(evalCacheKey)!;
    }

    Telemetry.startTimer(activeTraceId, "scoring");
    // 1. Compute Deterministic Fit Vector (measures timings automatically)
    const fitVector = DimensionRegistry.executeAll(context);
    Telemetry.stopTimer(activeTraceId, "scoring", "SUCCESS", `Evaluators scoring pipeline executed`);

    // 2. Decision Engine mapping (ruleId audit & traceable reasons)
    Telemetry.startTimer(activeTraceId, "decision");
    const decision = DecisionEngine.evaluate(fitVector);
    Telemetry.stopTimer(activeTraceId, "decision", "SUCCESS",
      `Rule fired: ${decision.ruleId} → ${decision.recommendation}`,
      { ruleId: decision.ruleId, verdict: decision.verdict, reasons: decision.reasons });

    // 3. Score Coverage & Algorithmic Confidence
    const scoreCoverage = this.calculateCoverage(normalizedJob);
    const confScores = Object.values(fitVector).map(d => d.confidence);
    const overallConfidence = confScores.length > 0 
      ? Number((confScores.reduce((sum, c) => sum + c, 0) / confScores.length).toFixed(2))
      : 0.5;

    // 4. Ingest qualitative evidence (Gemini / cache)
    Telemetry.startTimer(activeTraceId, "evidence");
    let parsedEvidence = {
      summary: 'Deterministic match complete. Ingesting opportunity.',
      strengths: fitVector.functionalFit?.matched.map(m => m.label) || [],
      gaps: fitVector.functionalFit?.missing.map(m => m.label) || [],
      reasoning: [fitVector.titleFit?.explanation, fitVector.leadershipFit?.explanation].filter(Boolean) as string[]
    };

    let status = EvaluationStatus.SUCCESS;

    if (job.semanticData) {
      try {
        const cachedSem = JSON.parse(job.semanticData);
        if (cachedSem.summary && cachedSem.summary.startsWith("Local offline check")) {
          parsedEvidence = OpportunityEnrichmentService.getLocalFallback(context, fitVector);
        } else {
          parsedEvidence = {
            summary: cachedSem.summary || parsedEvidence.summary,
            strengths: cachedSem.strengths || parsedEvidence.strengths,
            gaps: cachedSem.gaps || parsedEvidence.gaps,
            reasoning: cachedSem.reasoning || parsedEvidence.reasoning
          };
        }
      } catch {
        status = EvaluationStatus.PARTIAL;
      }
    }
    Telemetry.stopTimer(activeTraceId, "evidence", status === EvaluationStatus.PARTIAL ? "FAILED" : "SUCCESS",
      `Evidence ingested: ${parsedEvidence.strengths.length} strengths, ${parsedEvidence.gaps.length} gaps`);

    const overallScore = this.computeWeightedScore(fitVector);

    // 5. Compile the BriefingBundle via IntelligenceEngine
    Telemetry.startTimer(activeTraceId, "briefings");
    const briefingBundle = IntelligenceEngine.getBriefings(context, fitVector);
    const jobHash = this.computeHash(normalizedJob);
    Telemetry.stopTimer(activeTraceId, "briefings", "SUCCESS",
      `Briefings compiled: ${Object.keys(briefingBundle || {}).length} sections`, { jobHash });

    // Build the consolidated V3.1 EvaluationResult payload
    const evalResult: EvaluationResult = {
      version: "3.1.2",
      status,
      fitVector,
      verdict: decision.verdict,
      recommendation: decision.recommendation,
      recommendationReasons: decision.reasons,
      ruleId: decision.ruleId,
      overallConfidence,
      scoreCoverage,
      jobHash,
      briefingBundle,
      evidence: parsedEvidence,
      metadata: {
        evaluatedAt: new Date().toISOString(),
        versions: { ...VERSION_MANIFEST }
      }
    };

    // Backward compatible bridge structure matching V2 interface expectations
    const legacyExplanation: any = {
      version: evalResult.version,
      evaluatedAt: evalResult.metadata.evaluatedAt,
      configVersion: "agg-v2.1",
      matchScore: overallScore,
      priority: this.mapRecommendationToLegacyPriority(decision.recommendation),
      jobHash,
      versions: { ...VERSION_MANIFEST },
      confidence: {
        level: overallConfidence >= 0.8 ? "HIGH" : overallConfidence >= 0.5 ? "MEDIUM" : "LOW",
        score: overallConfidence,
        basis: "Computed from localized fit vector parameters coverage."
      },
      breakdown: Object.entries(fitVector).map(([name, dim]) => ({
        name: this.mapDimensionKeyToLabel(name),
        weight: 15,
        rawScore: dim.score / 100,
        weightedScore: (dim.score / 100) * 15,
        matchedTerms: dim.matched.map(m => m.label),
        missedTerms: dim.missing.map(m => m.label)
      })),
      insights: {
        summary: evalResult.evidence.summary,
        topStrengths: evalResult.evidence.strengths,
        potentialConcerns: evalResult.evidence.gaps,
        matchedKeywords: fitVector.functionalFit?.matched.map(m => m.label) || [],
        missingKeywords: fitVector.functionalFit?.missing.map(m => m.label) || []
      },
      matchedSignals: fitVector.functionalFit?.matched.map(m => m.label) || [],
      missingSignals: fitVector.functionalFit?.missing.map(m => m.label) || [],
      evalResult
    };

    Telemetry.stopTimer(activeTraceId, "overall", "SUCCESS",
      `Evaluation complete for: ${job.title}`,
      { score: overallScore, verdict: decision.verdict, ruleId: decision.ruleId });

    const rankingResult: RankingResult = {
      rejected: false,
      explanation: legacyExplanation
    };

    // Store in eval cache (item 13)
    evalCache.set(evalCacheKey, rankingResult);
    return rankingResult;
  }

  private static mapDimensionKeyToLabel(key: string): string {
    const mappings: Record<string, string> = {
      titleFit: "Executive Seniority",
      functionalFit: "Functional Expertise",
      leadershipFit: "Leadership Scale",
      industryFit: "Industry Experience",
      locationFit: "Location Preference",
      careerProgressionFit: "Career Trajectory",
      companyHealth: "Company Health"
    };
    return mappings[key] || key;
  }

  private static mapRecommendationToLegacyPriority(rec: RecommendationEnum): string {
    const mappings: Record<RecommendationEnum, string> = {
      [RecommendationEnum.APPLY_IMMEDIATELY]: "Must Review",
      [RecommendationEnum.NETWORK_FIRST]: "Strong Match",
      [RecommendationEnum.MONITOR]: "Worth Reviewing",
      [RecommendationEnum.IGNORE]: "Possible Match"
    };
    return mappings[rec] || "Possible Match";
  }
}
