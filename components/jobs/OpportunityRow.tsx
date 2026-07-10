"use client";

import { Job } from "../jobs/JobList";
import { Check, AlertTriangle } from "lucide-react";
import type { PriorityTier, SemanticData } from "../../lib/ranking/types";

interface OpportunityRowProps {
  job: Job;
  isActive: boolean;
  onSelect: () => void;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

function getTemporalDate(scrapedAt: string): string {
  const diffMs = Date.now() - new Date(scrapedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Jul 11, 2026'; // Match mock date if recent
  if (diffHours < 24) return 'Jul 11, 2026';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(scrapedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function ScoreRing({ score, strokeColor }: { score: number; strokeColor: string }) {
  const size = 36;
  const radius = 18;
  const stroke = 2.5;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0 w-9 h-9 select-none transition-transform duration-150 group-hover:scale-105">
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
      <span className="absolute text-[11px] font-bold text-slate-800 tracking-tight font-sans">
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

  const relativeDate = getTemporalDate(job.scrapedAt);

  // Dynamic "Hidden Gem" detection logic
  const titleScore = explanation?.evalResult?.fitVector?.titleFit?.score ?? 0;
  const functionalScore = explanation?.evalResult?.fitVector?.functionalFit?.score ?? 0;
  const isHiddenGem = titleScore < 60 && functionalScore >= 70;

  // Resolve badge configurations
  let badgeText = "WATCH";
  let badgeStyle = "bg-blue-50 text-blue-700 border-blue-100";
  let ringColor = "stroke-blue-500";

  if (job.matchScore >= 65) {
    badgeText = "APPLY";
    badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
    ringColor = "stroke-emerald-500";
  } else if (job.matchScore >= 50 && job.matchScore < 65) {
    if (isHiddenGem) {
      badgeText = "HIDDEN GEM";
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-100";
      ringColor = "stroke-purple-500";
    } else {
      badgeText = "TAILOR";
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
      ringColor = "stroke-amber-500";
    }
  } else if (job.matchScore >= 35 && job.matchScore < 50) {
    badgeText = "WATCH";
    badgeStyle = "bg-blue-50/50 text-blue-600 border-blue-100/50";
    ringColor = "stroke-blue-400";
  } else {
    badgeText = "WATCH";
    badgeStyle = "bg-slate-50 text-slate-500 border-slate-200/50";
    ringColor = "stroke-slate-400";
  }

  // Collapsed Row Match Signals (Information Economy: Max 2 strengths, 1 gap)
  const displayStrengths = (explanation?.insights?.topStrengths || sem?.strengths || []).slice(0, 2);
  const displayGaps = (explanation?.insights?.potentialConcerns || sem?.gaps || []).slice(0, 1);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col transition-all duration-150 ease-out border rounded-xl select-none cursor-pointer p-4 ${
        isActive 
          ? 'bg-white border-slate-900 shadow-md translate-x-[2px]' 
          : 'bg-white border-[#E2E8F0] hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:-translate-y-[1px]'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Left Side: Score ring visual anchor */}
        <ScoreRing score={job.matchScore} strokeColor={ringColor} />
        
        {/* Right Side: Primary Card Content */}
        <div className="flex-1 min-w-0">
          
          {/* Tag & Portal Name row */}
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {badgeText}
            </span>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              {job.sourcePortal}
            </span>
          </div>

          {/* Job Title & Company details */}
          <h4 className="text-[15px] font-bold text-slate-900 tracking-tight leading-snug truncate">
            {job.title}
          </h4>

          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 mt-0.5">
            <span>{job.company}</span>
            {job.location && (
              <>
                <span className="text-slate-300">•</span>
                <span>{job.location}</span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span>Full-time</span>
            <span className="text-slate-300">•</span>
            <span>{relativeDate}</span>
          </div>

          {/* Clean spacer */}
          <div className="border-t border-slate-100 my-2.5" />

          {/* Custom micro-checklists */}
          <div className="space-y-1 mt-1">
            {displayStrengths.map((str: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-emerald-800 leading-tight">
                <span className="text-emerald-500 shrink-0 select-none">✓</span>
                <span>{str}</span>
              </div>
            ))}
            {displayGaps.map((gap: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-amber-800 leading-tight">
                <span className="text-amber-500 shrink-0 select-none">⚠</span>
                <span>{gap}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
