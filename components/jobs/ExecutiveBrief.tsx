"use client";

import { Job } from "./JobList";
import { 
  Building2, 
  MapPin, 
  ExternalLink, 
  CheckCircle, 
  Sparkles, 
  Info,
  Calendar,
  Lock,
  LineChart,
  UserCheck,
  FileText
} from "lucide-react";
import type { RankingExplanation, PriorityTier, RankingDimension } from "../../lib/ranking/types";
import { SemanticData } from "../../lib/ranking/types";

interface ExecutiveBriefProps {
  job: Job | null;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

const RECOMMENDATION_LABELS: Record<PriorityTier, string> = {
  'Must Review':     'Apply Immediately',
  'Strong Match':    'Apply This Week',
  'Worth Reviewing': 'Monitor Closely',
  'Possible Match':  'Explore Context',
  'Low Priority':    'Skip/Archive',
};

const RECOMMENDATION_COLORS: Record<PriorityTier, string> = {
  'Must Review':     'text-emerald-450 font-extrabold',
  'Strong Match':    'text-emerald-450 font-extrabold',
  'Worth Reviewing': 'text-amber-400 font-extrabold',
  'Possible Match':  'text-slate-400 font-semibold',
  'Low Priority':    'text-slate-500 font-semibold',
};

function getQualitativeLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 0.8) return { text: 'Excellent', color: 'text-emerald-450 font-extrabold', bg: 'bg-emerald-950/20' };
  if (score >= 0.6) return { text: 'Strong',    color: 'text-blue-450 font-extrabold',    bg: 'bg-blue-950/20'    };
  if (score >= 0.4) return { text: 'Moderate',  color: 'text-amber-450 font-extrabold',   bg: 'bg-amber-950/20'   };
  if (score > 0)    return { text: 'Weak',      color: 'text-slate-405 font-medium',      bg: 'bg-slate-800/30'   };
  return { text: 'Missing',   color: 'text-slate-500 font-medium',      bg: 'bg-slate-800/10'    };
}

function DimensionRow({ dimension }: { dimension: RankingDimension }) {
  const label = getQualitativeLabel(dimension.rawScore);
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-850">
      <span className="text-[11px] font-semibold text-slate-400">{dimension.name}</span>
      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${label.bg} ${label.color}`}>
        {label.text}
      </span>
    </div>
  );
}

export function ExecutiveBrief({ job, onUpdateStatus }: ExecutiveBriefProps) {
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[350px] text-slate-500 font-sans p-6 select-none">
        <Sparkles className="w-5 h-5 opacity-20 text-slate-400 animate-pulse" />
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-3">Executive Briefing</h4>
        <p className="text-[11px] text-slate-550 mt-1 max-w-[200px] leading-relaxed">
          Select an opportunity from the console feed to render intelligence briefing.
        </p>
      </div>
    );
  }

  // Resolve absolute URL
  let absoluteUrl = job.url;
  if (job.url && !job.url.startsWith("http")) {
    if (job.sourcePortal === "LinkedIn")  absoluteUrl = `https://www.linkedin.com${job.url}`;
    else if (job.sourcePortal === "Indeed") absoluteUrl = `https://in.indeed.com${job.url}`;
    else if (job.sourcePortal === "Naukri") absoluteUrl = `https://www.naukri.com${job.url}`;
  }

  // Parse ranking explanation
  const explanation: RankingExplanation | null = job.rankingData
    ? (() => { try { return JSON.parse(job.rankingData) as RankingExplanation; } catch { return null; } })()
    : null;

  // Parse cached semantic matching data
  const sem: SemanticData | null = job.semanticData
    ? (() => { try { return JSON.parse(job.semanticData) as SemanticData; } catch { return null; } })()
    : null;

  const priority = (sem?.recommendedPriority || explanation?.priority || 'Possible Match') as PriorityTier;
  const recommendationColor = RECOMMENDATION_COLORS[priority] ?? RECOMMENDATION_COLORS['Possible Match'];
  const recommendationText = RECOMMENDATION_LABELS[priority] ?? 'Explore Context';
  const confidenceLevel = sem?.confidence || explanation?.confidence?.level || 'MEDIUM';
  const relativeDate = new Date(job.scrapedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6 font-sans select-text text-slate-300 max-w-md mx-auto">

      {/* 1. Header context block */}
      <div className="space-y-2.5 pb-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-slate-800/80 ${recommendationColor} leading-tight`}>
            {recommendationText}
          </span>
          <div className="flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black text-white bg-slate-800">
            Fit Score: {job.matchScore}
          </div>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white leading-snug tracking-tight">
            {job.title}
          </h3>
          
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400 font-semibold mt-2">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              {job.company}
            </span>
            {job.location && job.location.trim() !== "" && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                {job.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-550 shrink-0" />
              {relativeDate}
            </span>
          </div>
        </div>
      </div>

      {explanation ? (
        <div className="space-y-6 divide-y divide-slate-850">

          {/* 2. Deep Reasoning Score Breakdown */}
          <div className="space-y-2 pt-4 first:pt-0 border-t-0">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Dimension Evaluation Breakdown
            </h4>
            <div className="space-y-0.5">
              {explanation.breakdown.map((dim, i) => (
                <DimensionRow key={i} dimension={dim} />
              ))}
            </div>
          </div>

          {/* 3. Planned Briefings Plugins */}
          <div className="space-y-3 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Planned Briefings</h4>
            
            <div className="space-y-2.5">
              {/* Plugin 1: Company Intelligence */}
              <div className="relative border border-slate-800/80 bg-slate-900/40 rounded p-3 select-none">
                <div className="absolute right-3 top-3 text-slate-650">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">Company Profile</p>
                    <p className="text-[11px] font-bold text-slate-350">"Should I join this company?"</p>
                    <p className="text-[9.5px] text-slate-550 leading-relaxed pt-0.5">
                      funding rounds, glassdoor intelligence, market trend, news indicators.
                    </p>
                  </div>
                </div>
              </div>

              {/* Plugin 2: Compensation Estimates */}
              <div className="relative border border-slate-800/80 bg-slate-900/40 rounded p-3 select-none">
                <div className="absolute right-3 top-3 text-slate-655">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex items-start gap-2.5">
                  <LineChart className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">Compensation Analytics</p>
                    <p className="text-[11px] font-bold text-slate-350">"Is this financially attractive?"</p>
                    <p className="text-[9.5px] text-slate-555 leading-relaxed pt-0.5">
                      base salary ranges, bonus structures, vesting estimates.
                    </p>
                  </div>
                </div>
              </div>

              {/* Plugin 3: Resume Optimizer */}
              <div className="relative border border-slate-800/80 bg-slate-900/40 rounded p-3 select-none">
                <div className="absolute right-3 top-3 text-slate-655">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">Resume Optimizer</p>
                    <p className="text-[11px] font-bold text-slate-350">"What should I improve to match?"</p>
                    <p className="text-[9.5px] text-slate-555 leading-relaxed pt-0.5">
                      missing achievements, keyword recommendations, action verbs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Plugin 4: Interview readiness */}
              <div className="relative border border-slate-800/80 bg-slate-900/40 rounded p-3 select-none">
                <div className="absolute right-3 top-3 text-slate-655">
                  <Lock className="w-3 h-3" />
                </div>
                <div className="flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">Interview Readiness</p>
                    <p className="text-[11px] font-bold text-slate-350">"What topics should I prepare?"</p>
                    <p className="text-[9.5px] text-slate-555 leading-relaxed pt-0.5">
                      CEO profiles, key prep topics, prep discussion guides.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. Confidence metadata details */}
          <div className="pt-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-550 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className={`text-[9.5px] font-extrabold tracking-wider ${
                confidenceLevel === 'HIGH' ? 'text-emerald-455' :
                confidenceLevel === 'MEDIUM' ? 'text-amber-455' : 'text-slate-500'
              }`}>
                {confidenceLevel} ASSESSMENT CONFIDENCE
              </span>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">{explanation.confidence.basis}</p>
              
              {/* Freshness details */}
              <div className="flex flex-wrap gap-x-2 text-[9px] text-slate-500 font-mono pt-1">
                <span>VER: {sem ? `Enriched (v${sem.semanticVersion})` : `Rules (${job.rankingVersion || 'v2.1'})`}</span>
                <span>•</span>
                <span>FRESHNESS: Analyzed today</span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="border-t border-slate-800 pt-4">
          <p className="text-[11px] text-slate-500 italic">
            Select a re-scored opportunity in the feed to load diagnostic briefing details.
          </p>
        </div>
      )}

      {/* 9. Core Actions panel */}
      <div className="border-t border-slate-850 pt-4 flex gap-2.5">
        <a
          href={absoluteUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-950 bg-white hover:bg-slate-100 px-3.5 py-2 rounded transition-colors shrink-0 shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Listing
        </a>
        
        {job.status === "New" && (
          <button
            onClick={() => onUpdateStatus(job.id, "Reviewed")}
            className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-300 border border-slate-800 hover:bg-slate-850 hover:text-white px-3.5 py-2 rounded transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Save Briefing
          </button>
        )}
      </div>

    </div>
  );
}
