// components/jobs/ExecutiveBrief.tsx
// Presentation-only renderer for V3.2 Intelligence Briefing Bundle.
// Fully interactive accordion interface showing Company, Resume, Interview, and Compensation data points.

"use client";

import React, { useState } from "react";
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
  FileText,
  ChevronDown,
  ShieldCheck,
  Zap
} from "lucide-react";
import type { 
  RankingExplanation, 
  PriorityTier, 
  RankingDimension, 
  BriefingBundle, 
  Briefing, 
  BriefingSection 
} from "../../lib/ranking/types";

interface ExecutiveBriefProps {
  job: Job | null;
  briefingBundle: BriefingBundle | null;
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
      <span className="text-[11px] font-semibold text-slate-450">{dimension.name}</span>
      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded ${label.bg} ${label.color}`}>
        {label.text}
      </span>
    </div>
  );
}

/** Renders individual sections based on type */
function BriefingSectionRenderer({ section }: { section: BriefingSection }) {
  if (section.type === "narrative") {
    return (
      <div className="space-y-1">
        <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">{section.title}</p>
        <p className="text-[11.5px] text-slate-350 leading-relaxed font-semibold">{section.content as string}</p>
      </div>
    );
  }

  if (section.type === "checklist") {
    const list = section.content as string[];
    return (
      <div className="space-y-1.5">
        <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">{section.title}</p>
        <ul className="space-y-1 text-[11px] text-slate-350 font-semibold">
          {list.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-emerald-500 font-extrabold shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (section.type === "risk") {
    const list = section.content as string[];
    return (
      <div className="space-y-1.5">
        <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-550">{section.title}</p>
        <ul className="space-y-1 text-[11px] text-slate-400 font-semibold">
          {list.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-amber-500 font-extrabold shrink-0">⚠</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (section.type === "tag_list") {
    const list = section.content as string[];
    return (
      <div className="space-y-1.5">
        <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-500">{section.title}</p>
        <div className="flex flex-wrap gap-1.5">
          {list.map((tag, idx) => (
            <span key={idx} className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-350 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "metric_grid") {
    const grid = section.content as Record<string, string | number>;
    return (
      <div className="space-y-2">
        <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-550">{section.title}</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {Object.entries(grid).map(([label, val], idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-850 p-2 rounded">
              <span className="text-slate-500 font-semibold block mb-0.5">{label}</span>
              <span className="text-slate-205 font-extrabold font-mono">{val}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "recommendation") {
    return (
      <div className="relative border border-emerald-900/40 bg-emerald-950/10 rounded p-3 text-left">
        <div className="absolute right-3 top-3 text-emerald-500">
          <Zap className="w-3.5 h-3.5" />
        </div>
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500">{section.title}</p>
        <p className="text-[11px] font-semibold text-slate-300 mt-1 leading-relaxed">{section.content as string}</p>
      </div>
    );
  }

  return null;
}

export function ExecutiveBrief({ job, briefingBundle, onUpdateStatus }: ExecutiveBriefProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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

  const priority = (explanation?.priority || 'Possible Match') as PriorityTier;
  const recommendationColor = RECOMMENDATION_COLORS[priority] ?? RECOMMENDATION_COLORS['Possible Match'];
  const recommendationText = RECOMMENDATION_LABELS[priority] ?? 'Explore Context';
  const confidenceLevel = explanation?.confidence?.level || 'MEDIUM';
  const relativeDate = new Date(job.scrapedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Fallback structures if briefings don't exist yet
  const defaults = [
    { key: 'company',      title: 'Company Profile',        icon: Building2 },
    { key: 'compensation', title: 'Compensation Analytics', icon: LineChart },
    { key: 'resume',       title: 'Resume Optimizer',       icon: FileText },
    { key: 'interview',    title: 'Interview Readiness',    icon: UserCheck }
  ];

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
              <Building2 className="w-3.5 h-3.5 text-slate-550 shrink-0" />
              {job.company}
            </span>
            {job.location && job.location.trim() !== "" && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-550 shrink-0" />
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

          {/* 3. Unlocked Accordion Intelligence Briefings */}
          <div className="space-y-3 pt-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Intelligence Briefings
            </h4>
            
            <div className="space-y-2.5">
              {defaults.map((card) => {
                const brief: Briefing | undefined = briefingBundle?.[card.key];
                const isExpanded = expandedCard === card.key;
                const IconComponent = card.icon;

                if (!brief) {
                  // Fallback locked preview if brief not compiled
                  return (
                    <div key={card.key} className="relative border border-slate-800 bg-slate-900/10 rounded p-3 select-none opacity-40">
                      <div className="absolute right-3 top-3 text-slate-600">
                        <Lock className="w-3 h-3" />
                      </div>
                      <div className="flex items-start gap-2.5">
                        <IconComponent className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{card.title}</p>
                          <p className="text-[9.5px] text-slate-600 leading-relaxed pt-0.5">Offline estimation locked.</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={card.key} 
                    className={`border transition-all duration-150 rounded ${
                      isExpanded 
                        ? 'border-slate-800 bg-slate-900/30' 
                        : 'border-slate-900/80 bg-slate-900/10 hover:border-slate-800 hover:bg-slate-900/20'
                    }`}
                  >
                    {/* Header trigger button */}
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : card.key)}
                      className="w-full text-left p-3.5 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <IconComponent className="w-4 h-4 text-slate-405 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 leading-tight">
                            {brief.title}
                          </p>
                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Confidence: <span className={brief.confidence === 'HIGH' ? 'text-emerald-500' : 'text-slate-400'}>{brief.confidence}</span>
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanding Panel content details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-900 pt-3.5 space-y-4 animate-fadeIn">
                        {/* 1. Dynamic Section renders */}
                        {brief.sections.map((sec) => (
                          <BriefingSectionRenderer key={sec.id} section={sec} />
                        ))}

                        {/* 2. Trust Basis & Explainability panel */}
                        <div className="border-t border-slate-900 pt-3 space-y-2">
                          <div className="flex gap-2 text-[9.5px] text-slate-500">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <div>
                              <span className="font-extrabold uppercase tracking-wider">Assessment Trust Basis</span>
                              <p className="leading-relaxed mt-0.5">{brief.trustBasis}</p>
                            </div>
                          </div>

                          {/* 3. Freshness metadata details */}
                          <div className="flex flex-wrap gap-x-2.5 text-[8.5px] text-slate-550 font-mono pt-1">
                            <span>SOURCES: {brief.sources.map(s => s.name).join(', ')}</span>
                            <span>•</span>
                            <span>REFRESHED: {new Date(brief.lastEvaluated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. Confidence metadata details */}
          <div className="pt-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-slate-550 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className={`text-[9.5px] font-extrabold tracking-wider ${
                confidenceLevel === 'HIGH' ? 'text-emerald-450' :
                confidenceLevel === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {confidenceLevel} ASSESSMENT CONFIDENCE
              </span>
              <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">{explanation.confidence.basis}</p>
              
              {/* Freshness details */}
              <div className="flex flex-wrap gap-x-2 text-[9px] text-slate-500 font-mono pt-1">
                <span>VER: Rules (v3.1.2)</span>
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
