"use client";

import { Job } from "../jobs/JobList";
import { ExternalLink, Archive, CheckCircle } from "lucide-react";
import type { PriorityTier, SemanticData } from "../../lib/ranking/types";

interface OpportunityRowProps {
  job: Job;
  isActive: boolean;
  onSelect: () => void;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  'Must Review':     'Apply Immediately',
  'Strong Match':    'Apply This Week',
  'Worth Reviewing': 'Monitor Closely',
  'Possible Match':  'Explore Context',
  'Low Priority':    'Skip/Archive',
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  'Must Review':     'text-emerald-600',
  'Strong Match':    'text-emerald-500',
  'Worth Reviewing': 'text-amber-500',
  'Possible Match':  'text-slate-500',
  'Low Priority':    'text-slate-400',
};

function getTemporalDate(scrapedAt: string): string {
  const diffMs = Date.now() - new Date(scrapedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'New today';
  if (diffHours < 24) return 'New today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(scrapedAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ScoreRing({ score }: { score: number }) {
  const size = 36;
  const radius = 18;
  const stroke = 2.5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "stroke-slate-400";
  if (score >= 80) strokeColor = "stroke-emerald-500";
  else if (score >= 60) strokeColor = "stroke-blue-500";
  else if (score >= 40) strokeColor = "stroke-amber-500";

  return (
    <div className="relative flex items-center justify-center shrink-0 w-9 h-9 select-none">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="stroke-slate-100 fill-transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${strokeColor} fill-transparent transition-all duration-300`}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <span className="absolute text-[10px] font-mono font-black text-slate-800">
        {score}
      </span>
    </div>
  );
}

export function OpportunityRow({ job, isActive, onSelect, onUpdateStatus }: OpportunityRowProps) {
  const explanation = job.rankingData
    ? (() => { try { return JSON.parse(job.rankingData); } catch { return null; } })()
    : null;

  const sem: SemanticData | null = job.semanticData
    ? (() => { try { return JSON.parse(job.semanticData) as SemanticData; } catch { return null; } })()
    : null;

  const priority: PriorityTier = sem?.recommendedPriority || explanation?.priority || 'Possible Match';
  const recommendationText = RECOMMENDATION_LABELS[priority] ?? 'Explore Context';
  const recommendationColor = RECOMMENDATION_COLORS[priority] ?? 'text-slate-500';
  const relativeDate = getTemporalDate(job.scrapedAt);

  // Resolve absolute URL
  let absoluteUrl = job.url;
  if (job.url && !job.url.startsWith("http")) {
    if (job.sourcePortal === "LinkedIn")  absoluteUrl = `https://www.linkedin.com${job.url}`;
    else if (job.sourcePortal === "Indeed")  absoluteUrl = `https://in.indeed.com${job.url}`;
    else if (job.sourcePortal === "Naukri")  absoluteUrl = `https://www.naukri.com${job.url}`;
  }

  // Collapsed Row Match Signals (Information Economy: Max 5 facts collapsed)
  const displayStrengths = (explanation?.insights?.topStrengths || sem?.strengths || []).slice(0, 2);
  const displayGaps = (explanation?.insights?.potentialConcerns || sem?.gaps || []).slice(0, 1);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col transition-all duration-150 ease-out border-b border-slate-100/70 select-none cursor-pointer ${
        isActive 
          ? 'bg-slate-50/75 min-h-[190px]' 
          : 'bg-white hover:bg-slate-50/30 min-h-[80px]'
      }`}
    >
      {/* Active Left Border Accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-colors ${
        isActive ? 'bg-slate-900' : 'bg-transparent group-hover:bg-slate-200'
      }`} />

      {/* Primary Row Content Wrapper */}
      <div className="flex flex-col py-3.5 px-5 w-full min-w-0 font-sans">
        
        <div className="flex items-start gap-4">
          {/* Circular score rings visual anchor */}
          <ScoreRing score={job.matchScore} />
          
          <div className="flex-1 min-w-0">
            {/* Header info: Title (22px Slate 950) + Company name (15px Slate 700) */}
            <div className="flex items-baseline justify-between gap-4">
              <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-950 tracking-tight leading-snug truncate">
                {job.title}
              </h4>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 font-bold uppercase tracking-wider">
                {job.sourcePortal}
              </span>
            </div>

            <p className="text-[12px] font-medium text-slate-700 leading-normal mt-0.5">
              {job.company}
              {job.location && job.location.trim() !== "" && (
                <span className="text-slate-400 font-normal"> • {job.location}</span>
              )}
            </p>

            {/* Clean divider line inside collapsed row */}
            <div className="border-t border-slate-100/70 my-2" />

            {/* Recommendation (13px Semibold Emerald) & Evidence checklist */}
            <div className="flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400">
                <span className={`text-[12px] font-bold font-sans ${recommendationColor}`}>
                  {recommendationText}
                </span>
                
                {/* Evidence signals inline */}
                {(displayStrengths.length > 0 || displayGaps.length > 0) && (
                  <>
                    <span>•</span>
                    {displayStrengths.map((str: string, idx: number) => (
                      <span key={idx} className="text-emerald-600 font-semibold leading-none">
                        ✓ {str}
                      </span>
                    ))}
                    {displayGaps.map((gap: string, idx: number) => (
                      <span key={idx} className="text-amber-600 font-semibold leading-none">
                        ⚠ {gap}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Date relative metadata + hover action controls */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="shrink-0">{relativeDate}</span>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1 shrink-0 z-10">
                  <a
                    href={absoluteUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-800 rounded transition-all shadow-sm"
                    title="Open Listing"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(job.id, "Reviewed"); }}
                    className="p-1 border border-slate-200 bg-white text-slate-400 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 rounded transition-all cursor-pointer shadow-sm"
                    title="Save Opportunity"
                  >
                    <CheckCircle className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateStatus(job.id, "Archived"); }}
                    className="p-1 border border-slate-200 bg-white text-slate-400 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50 rounded transition-all cursor-pointer shadow-sm"
                    title="Archive"
                  >
                    <Archive className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Expanded Details Slide inline (Evidence layer details) */}
        {isActive && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-100 text-left space-y-2.5 animate-fadeIn">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                Recruiter Assessment Summary
              </span>
              <p className="text-[12px] text-slate-600 leading-relaxed font-semibold">
                {sem ? sem.summary : (explanation?.insights?.summary || 'No diagnostic summary generated.')}
              </p>
            </div>

            {/* Complete Signals checklist */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600 pt-0.5">
              {explanation?.insights?.topStrengths ? (
                <>
                  {explanation.insights.topStrengths.map((str: string, idx: number) => (
                    <span key={idx} className="flex items-center gap-1 font-semibold text-emerald-700">
                      ✓ {str}
                    </span>
                  ))}
                  {explanation.insights.potentialConcerns.map((gap: string, idx: number) => (
                    <span key={idx} className="flex items-center gap-1 font-semibold text-amber-700">
                      ⚠ {gap}
                    </span>
                  ))}
                </>
              ) : sem ? (
                <>
                  {sem.strengths.map((str: string, idx: number) => (
                    <span key={idx} className="flex items-center gap-1 font-semibold text-emerald-700">
                      ✓ {str}
                    </span>
                  ))}
                  {sem.gaps.map((gap: string, idx: number) => (
                    <span key={idx} className="flex items-center gap-1 font-semibold text-amber-700">
                      ⚠ {gap}
                    </span>
                  ))}
                </>
              ) : null}
            </div>

            {/* Technical Metadata info block */}
            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
              <span>LOC: {job.location || 'Not specified'}</span>
              <span>•</span>
              <span>VER: {sem ? `Enriched (v${sem.semanticVersion})` : `Rule Only (${job.rankingVersion || 'v2.1'})`}</span>
              <span>•</span>
              <span>FRESHNESS: Refreshed today</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
