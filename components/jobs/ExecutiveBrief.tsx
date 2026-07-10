// components/jobs/ExecutiveBrief.tsx
"use client";

import React, { useState } from "react";
import { Job } from "./JobList";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Bookmark, 
  ExternalLink,
  Check,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import type { RankingExplanation, SemanticData } from "../../lib/ranking/types";

interface ExecutiveBriefProps {
  job: Job | null;
  briefingBundle: any;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

export function ExecutiveBrief({ job, briefingBundle, onUpdateStatus }: ExecutiveBriefProps) {
  const [activeTab, setActiveTab] = useState<string>("Executive Briefing");

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-[450px] text-slate-400 font-sans p-6 select-none animate-fadeIn">
        <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Executive Briefing</h4>
        <p className="text-[12px] text-slate-500 mt-2 max-w-[280px] leading-relaxed">
          Select an opportunity from the feed list to render full executive intelligence briefing.
        </p>
      </div>
    );
  }

  // Parse ranking explanation & semantic data
  const explanation: RankingExplanation | null = job.rankingData
    ? (() => { try { return JSON.parse(job.rankingData) as RankingExplanation; } catch { return null; } })()
    : null;

  const sem: SemanticData | null = job.semanticData
    ? (() => { try { return JSON.parse(job.semanticData) as SemanticData; } catch { return null; } })()
    : null;

  const isSaved = job.status === "Reviewed";
  const dateFormatted = new Date(job.scrapedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  // Resolve absolute URL
  let absoluteUrl = job.url;
  if (job.url && !job.url.startsWith("http")) {
    if (job.sourcePortal === "LinkedIn")  absoluteUrl = `https://www.linkedin.com${job.url}`;
    else if (job.sourcePortal === "Indeed") absoluteUrl = `https://in.indeed.com${job.url}`;
    else if (job.sourcePortal === "Naukri") absoluteUrl = `https://www.naukri.com${job.url}`;
  }

  // Resolve dynamic "Hidden Gem" status
  const titleScore = explanation?.evalResult?.fitVector?.titleFit?.score ?? 0;
  const functionalScore = explanation?.evalResult?.fitVector?.functionalFit?.score ?? 0;
  const isHiddenGem = titleScore < 60 && functionalScore >= 70;

  // Decide Triage Verdict pill details
  let verdictLabel = "WATCH";
  let verdictStyle = "bg-blue-50 text-blue-700 border-blue-100";
  if (job.matchScore >= 65) {
    verdictLabel = "APPLY";
    verdictStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
  } else if (job.matchScore >= 50 && job.matchScore < 65) {
    if (isHiddenGem) {
      verdictLabel = "HIDDEN GEM";
      verdictStyle = "bg-purple-50 text-purple-700 border-purple-100";
    } else {
      verdictLabel = "TAILOR";
      verdictStyle = "bg-amber-50 text-amber-700 border-amber-100";
    }
  }

  // Est. interview probability rating (4 dots)
  let probabilityText = "Moderate";
  let probabilityDots = 2;
  if (job.matchScore >= 80) {
    probabilityText = "High";
    probabilityDots = 4;
  } else if (job.matchScore >= 65) {
    probabilityText = "High";
    probabilityDots = 3;
  } else if (job.matchScore >= 50) {
    probabilityText = "Moderate";
    probabilityDots = 2;
  } else {
    probabilityText = "Low";
    probabilityDots = 1;
  }

  // Dynamic coaching recommendations ("Improve your odds")
  const improveOdds: { action: string; impact: string; pts: string }[] = [];
  if (job.sourcePortal === "LinkedIn") {
    improveOdds.push({
      action: "Warm intro before applying",
      impact: "HIGH IMPACT",
      pts: "+12 pts"
    });
  }
  const missingSkills = explanation?.insights?.missingKeywords || sem?.missingSkills || [];
  if (missingSkills.length > 0) {
    missingSkills.slice(0, 2).forEach((skill: string) => {
      improveOdds.push({
        action: `Add ${skill.toLowerCase()} project to resume`,
        impact: "HIGH IMPACT",
        pts: "+4 pts"
      });
    });
  } else {
    improveOdds.push({
      action: "Add executive scaling projects to resume",
      impact: "HIGH IMPACT",
      pts: "+6 pts"
    });
  }

  // Strengths and Gaps lists
  const strengths = sem?.strengths || explanation?.insights?.topStrengths || [
    "Executive alignment detected",
    "Strong functional match for growth transformation"
  ];
  const gaps = sem?.gaps || explanation?.insights?.potentialConcerns || [
    "Evaluate specific industry scale capability"
  ];

  const tabs = ["Executive Briefing", "Role Intelligence", "Your Fit Breakdown", "Signals"];

  return (
    <div className="flex flex-col font-sans select-text text-slate-800 animate-fadeIn h-full">
      {/* Primary Split Columns Container */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column (Triage / Details / Tabs) */}
        <div className="flex-1 w-full space-y-6">
          {/* Header block: Title, Company, Date, and Fit Score */}
          <div className="flex justify-between items-start gap-6 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900 leading-snug tracking-tight">
                {job.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {job.company}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {job.location || "India"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {dateFormatted}
                </span>
              </div>
            </div>
            
            {/* Fit Score circle anchor */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center shadow-sm select-none">
                <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                  {job.matchScore}
                </span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
                  FIT
                </span>
              </div>
              <span className="text-[9px] font-bold text-emerald-600 mt-1 select-none">
                ▲ +13 vs avg
              </span>
            </div>
          </div>

          {/* Verdict/Confidence Section card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl shadow-inner select-none">
            {/* Verdict block */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Verdict</span>
              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${verdictStyle}`}>
                {verdictLabel}
              </span>
              <p className="text-[11px] text-slate-500 leading-normal font-semibold mt-1">
                {verdictLabel === "APPLY" && "Exceptional match on function. Company hiring signal is strong."}
                {verdictLabel === "TAILOR" && "Strong opportunity. Align resume keywords to optimize match."}
                {verdictLabel === "HIDDEN GEM" && "High-fit opportunity despite an atypical job title."}
                {verdictLabel === "WATCH" && "Monitor closely. High role fit but lacks explicit confidence details."}
              </p>
            </div>

            {/* Confidence block */}
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200/80 pt-3.5 md:pt-0 md:pl-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Confidence</span>
              <span className="text-[13px] font-black text-slate-800 block">High</span>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "76%" }} />
              </div>
              <span className="text-[9px] font-bold text-slate-400 block mt-1">76% rating</span>
            </div>

            {/* Est. Interview Probability block */}
            <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200/80 pt-3.5 md:pt-0 md:pl-4">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Est. Interview Probability</span>
              <span className="text-[13px] font-black text-slate-800 block">{probabilityText}</span>
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((dot) => (
                  <div 
                    key={dot} 
                    className={`w-2.5 h-2.5 rounded-full ${
                      dot <= probabilityDots ? "bg-emerald-500 shadow-[0_0_4px_#10b981]" : "bg-slate-200"
                    }`} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-[#E2E8F0] flex gap-5 select-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                    isActive 
                      ? "border-slate-800 text-slate-900 font-extrabold" 
                      : "border-transparent text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab Content Display */}
          <div className="pt-2 min-h-[250px]">
            {activeTab === "Executive Briefing" && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Executive Summary</h4>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                    {sem ? sem.summary : (explanation?.insights?.summary || "Exceptional alignment based on candidate capability profile. Standard leadership role parameters apply.")}
                  </p>
                  <a 
                    href={absoluteUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline pt-1 select-none"
                  >
                    <span>Apply now — warm intro if possible</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Top reasons to apply */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Top Reasons to Apply</h4>
                  <div className="space-y-1.5">
                    {strengths.map((str, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[12px] font-semibold text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risks / Gaps */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Key Risks / Gaps</h4>
                  <div className="space-y-1.5">
                    {gaps.map((gap, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[12px] font-semibold text-slate-700">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What will improve your odds */}
                <div className="space-y-2.5 select-none">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">What Will Improve Your Odds</h4>
                  <div className="space-y-2">
                    {improveOdds.map((card, idx) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-3 rounded-lg flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                            <span className="text-[10px] font-bold">⚡</span>
                          </div>
                          <div>
                            <span className="text-[12px] font-bold text-slate-800 block leading-tight">{card.action}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-4">
                          <span className="text-[8px] font-black tracking-wider bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded leading-none">
                            {card.impact}
                          </span>
                          <span className="text-[9px] font-black text-purple-600 bg-purple-100/50 px-2 py-0.5 rounded font-mono leading-none">
                            {card.pts}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Role Intelligence" && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Required Skills Taxonomy</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(explanation?.insights?.matchedKeywords || sem?.matchedSkills || ["Digital Marketing", "CRM Transformation", "Category Management"]).map((skill: string, idx: number) => (
                      <span key={idx} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Extracted Functional Context</h4>
                  <p className="text-[12.5px] text-slate-600 leading-relaxed font-medium">
                    This opportunity falls under the growth/transformation cluster with direct P&L operations.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "Your Fit Breakdown" && (
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Evaluator Dimensional Breakdown</h4>
                {explanation?.breakdown ? (
                  explanation.breakdown.map((dim: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-[12px] font-bold text-slate-600">{dim.name}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                        dim.rawScore >= 0.8 ? "bg-emerald-50 text-emerald-700" :
                        dim.rawScore >= 0.6 ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-500"
                      }`}>
                        {dim.rawScore >= 0.8 ? "Excellent" : dim.rawScore >= 0.6 ? "Strong" : "Moderate"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11.5px] text-slate-500 italic">No breakdown details available for this job.</p>
                )}
              </div>
            )}

            {activeTab === "Signals" && (
              <div className="space-y-2.5 text-[11px] text-slate-500 font-mono">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Pipeline Version</span>
                  <span>v{job.rankingVersion || "2.1.2"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Source Platform</span>
                  <span>{job.sourcePortal}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Scraped Timestamp</span>
                  <span>{job.scrapedAt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>Enrichment Type</span>
                  <span>{sem ? "Gemini-Semantic (Enriched)" : "Rules Only"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Role Snapshot / Hires) */}
        <div className="w-full lg:w-[240px] shrink-0 space-y-6 lg:border-l lg:border-slate-100 lg:pl-6">
          {/* Role Snapshot Card */}
          <div className="space-y-3 select-none">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role Snapshot</h4>
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white text-[12px]">
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Seniority</span>
                  <span className="text-slate-800 font-bold">Executive</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Function</span>
                  <span className="text-slate-800 font-bold">Programs</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Industry</span>
                  <span className="text-slate-800 font-bold">D2C / Consumer</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Reporting</span>
                  <span className="text-slate-800 font-bold">Board / Exec</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Location</span>
                  <span className="text-slate-800 font-bold truncate max-w-[120px]">{job.location || "India"}</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Employment</span>
                  <span className="text-slate-800 font-bold">Full-time</span>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Hires Card */}
          <div className="space-y-2 select-none">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Similar Hires</h4>
            <div className="border border-[#E2E8F0] p-4 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.01)] bg-white flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100 shrink-0">
                <span>👥</span>
              </div>
              <p className="text-[11.5px] font-semibold text-slate-600 leading-snug">
                <span className="text-slate-900 font-bold">{Math.floor((job.matchScore / 20) + 1)} close matches</span> hired in last 12 months.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="border-t border-[#E2E8F0] mt-8 pt-4 flex flex-wrap gap-3 select-none">
        <a
          href={absoluteUrl}
          target="_blank"
          rel="noreferrer"
          className="h-[38px] px-5 bg-slate-950 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-wider rounded-md flex items-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open in {job.sourcePortal}</span>
        </a>
        
        <button
          onClick={() => onUpdateStatus(job.id, isSaved ? "New" : "Reviewed")}
          className={`h-[38px] px-5 border rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            isSaved 
              ? "bg-[#F8FAFC] border-slate-300 text-slate-800"
              : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-slate-800" : ""}`} />
          <span>{isSaved ? "Saved to Watchlist" : "Add to Watchlist"}</span>
        </button>
      </div>
    </div>
  );
}
