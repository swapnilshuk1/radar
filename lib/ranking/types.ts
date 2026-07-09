// lib/ranking/types.ts
// Core type definitions for the Explainable Decision Engine v3.1 (Auditable & Extensible).

export interface CandidateIdentity {
  name: string;
  currentTitle: string;
}

export interface CandidateExperience {
  yearsExperience: number;
  achievements: string[];
  teamSizeManaged: number;
  feeBookScale: string;
  plOwnership: boolean;
  boardInteraction: boolean;
}

export interface CandidatePreferences {
  locations: string[];
  remote: string;
  targetMinSalary: string;
  industries: string[];
}

export interface CandidateStrategy {
  targetTitles: string[];
  ceoPathway: boolean;
  boardReadiness: boolean;
}

export interface CandidateResume {
  rawText: string;
  sourceResumeVersion: string;
}

export interface CandidateProfile {
  identity: CandidateIdentity;
  experience: CandidateExperience;
  preferences: CandidatePreferences;
  strategy: CandidateStrategy;
  resume: CandidateResume;
  skills: string[];
}

export interface MatchEvidence {
  id: string;
  label: string;
  source: "resume" | "job";
  confidence: number;
  weight: number;
}

export interface EvaluationDimension {
  score: number;
  confidence: number;
  matched: MatchEvidence[];
  missing: MatchEvidence[];
  explanation: string;
  durationMs?: number; // Timing benchmark
  metadata?: Record<string, unknown>; // Extensible metadata bag (Glassdoor, Comp range, company health checks)
}

export type FitVector = Record<string, EvaluationDimension>;

export enum RecommendationEnum {
  APPLY_IMMEDIATELY = "APPLY_IMMEDIATELY",
  NETWORK_FIRST = "NETWORK_FIRST",
  MONITOR = "MONITOR",
  IGNORE = "IGNORE"
}

export enum VerdictEnum {
  STRONG_CANDIDATE = "STRONG_CANDIDATE",
  WORTH_REVIEWING = "WORTH_REVIEWING",
  WORTH_MONITORING = "WORTH_MONITORING",
  LIMITED_ALIGNMENT = "LIMITED_ALIGNMENT"
}

export enum EvaluationStatus {
  SUCCESS = "SUCCESS",
  PARTIAL = "PARTIAL",
  FAILED = "FAILED",
  PENDING = "PENDING"
}

/** 5-tier legacy priority labels for backwards compatibility */
export type PriorityTier =
  | 'Must Review'
  | 'Strong Match'
  | 'Worth Reviewing'
  | 'Possible Match'
  | 'Low Priority';

export interface NormalizedJob {
  title: string;
  snippet: string;
  location: string;
  company: string;
  titleTokens: string[];
  snippetTokens: string[];
  locationNorm: string;
  companyNorm: string;
  semanticData?: string | null;
  // Strongly-typed entities
  seniority: string;
  functions: string[];
  skills: string[];
  technologies: string[];
  industries: string[];
  leadershipSignals: string[];
  companyAttributes: string[];
  locations: string[];
  employmentType: string;
  travelRequirement: string;
}

export interface EvaluationContext {
  job: NormalizedJob;
  candidate: CandidateProfile;
  config: any;
}

export interface EvaluationResult {
  version: string; // e.g. "3.1.2"
  status: EvaluationStatus;
  fitVector: FitVector;
  verdict: VerdictEnum;
  recommendation: RecommendationEnum;
  recommendationReasons: string[];
  ruleId: string; // Fired Decision rule ID
  overallConfidence: number;
  scoreCoverage: number; // Coverage % of expected fields filled
  evidence: {
    summary: string;
    strengths: string[];
    gaps: string[];
    reasoning: string[];
  };
  metadata: {
    evaluatedAt: string;
  };
}

export interface JobInput {
  title: string;
  snippet: string;
  location: string;
  company: string;
  semanticData?: string | null;
}

export interface Evaluator {
  readonly dimensionName: string;
  score(context: EvaluationContext): EvaluationDimension;
}

export interface SemanticData {
  overallScore: number;
  confidence: "High" | "Medium" | "Low";
  summary: string;
  strengths: string[];
  gaps: string[];
  matchedSkills: string[];
  missingSkills: string[];
  recommendedAction: string;
  reasoning: string[];
  executiveVerdict: string;
  recommendedPriority: string;
  semanticVersion: string;
  sourceResumeVersion: string;
  evaluatedAt: string;
}

export interface RankingDimensionProvider {
  readonly dimensionName: string;
  score(job: NormalizedJob, profile: CandidateProfile): RankingDimension;
}

export interface ConfidenceResult {
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  basis: string;
}

export interface OpportunityInsights {
  summary: string;
  topStrengths: string[];
  potentialConcerns: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

export interface RankingDimension {
  name: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  matchedTerms: string[];
  missedTerms: string[];
}

export interface RankingExplanation {
  version: string;
  evaluatedAt: string;
  configVersion: string;
  matchScore: number;
  priority: PriorityTier;
  confidence: ConfidenceResult;
  breakdown: RankingDimension[];
  insights: OpportunityInsights;
  matchedSignals: string[];
  missingSignals: string[];
  evalResult?: EvaluationResult;
}

export interface RankingResult {
  rejected: boolean;
  rejectReason?: string;
  explanation?: RankingExplanation;
}
