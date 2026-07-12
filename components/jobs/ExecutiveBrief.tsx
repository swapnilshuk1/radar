"use client";

import React, { useState } from "react";
import { Job } from "./JobList";
import { 
  Building2, MapPin, Calendar, Bookmark, ArrowUpRight 
} from "lucide-react";
import { DecisionInputAdapter } from "../../lib/ranking/decision/DecisionInputAdapter";
import { DecisionEngine } from "../../lib/ranking/DecisionEngine";

// 🔌 Explicitly import the active recruiter presentation child components
import { RecruiterVerdict } from "./RecruiterVerdict";
import { CapabilityMap } from "./CapabilityMap";
import { OpportunityPanel } from "./OpportunityPanel";
import { RequirementCard } from "./RequirementCard";

interface ExecutiveBriefProps {
  job: Job | null;
  briefingBundle: any;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

export function ExecutiveBrief({ job, briefingBundle, onUpdateStatus }: ExecutiveBriefProps) {
  const [activeTab, setActiveTab] = useState<string>("Executive Briefing");
  const [showLogic, setShowLogic] = useState<boolean>(false);

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

  // ---------------------------------------------------------------------
  // PRODUCTION DATA PIPELINE
  // ---------------------------------------------------------------------

  const rawPayload = job.rankingData ? JSON.parse(job.rankingData) : {};
  const normalizedInput = DecisionInputAdapter.normalize(rawPayload);
  const engineModel = DecisionEngine.evaluateV2(normalizedInput);

  // Fail immediately during development if the engine contract breaks.
  if (engineModel.compositeScore === undefined || engineModel.confidenceIndex === undefined) {
    throw new Error(`[ExecutiveBrief] Invalid engine output for job ${job.id}`);
  }

  // ---------------------------------------------------------------------
  // SOURCE OF TRUTH
  // ---------------------------------------------------------------------

  const breakdown = rawPayload.breakdown ?? [];
  const insights = rawPayload.insights ?? {};
  const evaluation = rawPayload.evalResult ?? {};
  const evidence = evaluation.evidence ?? {};
  const strengths = evidence.strengths ?? [];
  const gaps = evidence.gaps ?? [];
  const reasoning = evidence.reasoning ?? [];
  const summaryText = evidence.summary ?? insights.summary ?? "";
 const matchedKeywords =
  insights.matchedKeywords ??
  rawPayload.matchedSignals ??
  [];

const missingKeywords =
  insights.missingKeywords ??
  rawPayload.missingSignals ??
  [];

const topStrengths =
  insights.topStrengths ??
  strengths ??
  [];

const potentialConcerns =
  insights.potentialConcerns ??
  gaps ??
  [];
  const coachingPlays = engineModel.coachingPlays ?? [];
  
  // Safe Fallback Extractions for Embedded Table Loops
  const assessments = rawPayload.assessments ?? evaluation.assessments ?? [];
  const taxonomySkills = insights.taxonomySkills ?? rawPayload.skills ?? [];

  // ---------------------------------------------------------------------
  // PRESENTATION MODEL
  // ---------------------------------------------------------------------

  const summary = {
    overallScore: rawPayload.matchScore ?? engineModel.compositeScore,
    confidence: rawPayload.overallConfidence ?? engineModel.confidenceIndex,
    totalRequirements: breakdown.length,
    verifiedRequirements: breakdown.filter((b: any) => b.rawScore >= 0.70).length
  };

  const coveragePercentage = summary.totalRequirements === 0
    ? 0
    : Math.round((summary.verifiedRequirements / summary.totalRequirements) * 100);

  const isSaved = job.status === "Reviewed";

  const dateFormatted = new Date(job.scrapedAt).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  let absoluteUrl = job.url;
  if (job.url && !job.url.startsWith("http")) {
    if (job.sourcePortal === "LinkedIn") absoluteUrl = `https://www.linkedin.com${job.url}`;
    else if (job.sourcePortal === "Indeed") absoluteUrl = `https://in.indeed.com${job.url}`;
    else if (job.sourcePortal === "Naukri") absoluteUrl = `https://www.naukri.com${job.url}`;
  }

  const tabs = ["Executive Briefing", "Role Intelligence", "Your Fit Breakdown", "Signals"];

  return (
    <div className="flex flex-col font-sans select-text text-slate-800 animate-fadeIn h-full max-w-4xl mx-auto p-4 bg-white">
      
      {/* Top Identity Meta Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-6">
          <div className="flex justify-between items-start gap-6 border-b border-slate-100 pb-4">
            <div className="space-y-1.5">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900 leading-snug tracking-tight">{job.title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-400" />{job.company}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" />{job.location || "India"}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" />{dateFormatted}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-slate-900 flex flex-col items-center justify-center shadow-sm select-none">
                <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">{summary.overallScore}</span>
                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">COVERAGE</span>
              </div>
            </div>
          </div>

          {/* Factual Operational Panel Matrix Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono text-xs font-bold shadow-sm">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Priorities</span>
              <span className="text-lg font-black text-slate-800">{summary.totalRequirements}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <span className="text-[9px] uppercase font-bold text-emerald-600 block tracking-wider">Verified</span>
              <span className="text-lg font-black text-emerald-700">{summary.verifiedRequirements}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <span className="text-[9px] uppercase font-bold text-blue-600 block tracking-wider">Coverage</span>
              <span className="text-lg font-black text-blue-700">{coveragePercentage}%</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-1">
              <span className="text-[9px] uppercase font-bold text-indigo-600 block tracking-wider">Confidence</span>
              <span className="text-lg font-black text-indigo-700">{Math.round(summary.confidence * 100)}%</span>
            </div>
          </div>

          {/* Tab Layout Elements */}
          <div className="border-b border-[#E2E8F0] flex gap-5 select-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab ? "border-slate-800 text-slate-900 font-extrabold" : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Rendering Core Window */}
          <div className="space-y-6">
            {activeTab === "Executive Briefing" && (
              <>
                <RecruiterVerdict
                  verdict={rawPayload.verdict}
                  priority={rawPayload.priority}
                  matchScore={summary.overallScore}
                  summary={summaryText}
                  reasoning={reasoning}
                  strengths={topStrengths}
                  concerns={potentialConcerns}
                />
                
                <CapabilityMap
                  breakdown={
                            [...breakdown].sort(
                            (a, b) => b.weightedScore - a.weightedScore
                                  )
                              }
                          />

                <OpportunityPanel opportunities={coachingPlays} />

                {strengths.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Strong Evidence</h4>
                    <div className="grid gap-3">
                      {strengths.map((item: any, index: number) => (
                        <RequirementCard key={index} engineCode={item} variant="strength" />
                      ))}
                    </div>
                  </div>
                )}

                {gaps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Watch Items</h4>
                    <div className="grid gap-3">
                      {gaps.map((item: any, index: number) => (
                        <RequirementCard key={index} engineCode={item} variant="gap" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Strategy Evaluation Logs Registry */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 shadow-sm">
                  <button 
                    onClick={() => setShowLogic(!showLogic)}
                    className="w-full flex justify-between items-center p-4 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none uppercase tracking-wide"
                  >
                    <span>See how this was evaluated</span>
                    <span>{showLogic ? '▼ Close Evaluation Logs' : '▶ Expand Evaluation Logs'}</span>
                  </button>

                  {showLogic && (
                    <div className="p-4 border-t border-slate-200 bg-white text-xs font-mono overflow-x-auto">
                      <div className="min-w-[700px] space-y-6">
                        
                        {/* Dimension Breakdown Table */}
                        <div className="border border-slate-200 rounded overflow-hidden">
                          <div className="grid grid-cols-4 gap-3 p-3 rounded-t bg-slate-900 text-slate-300 font-bold">
                            <div>Evaluation Dimension</div>
                            <div>Weight</div>
                            <div>Raw Score</div>
                            <div>Status</div>
                          </div>
                          {breakdown.map((item: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-4 gap-3 p-3 border-b border-slate-100 items-center bg-white">
                              <div className="font-semibold">{item.name}</div>
                              <div>{item.weight}%</div>
                              <div className="font-bold text-indigo-700">{Math.round(item.rawScore * 100)}%</div>
                              <div className={item.rawScore >= 0.7 ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                                {item.rawScore >= 0.7 ? "Verified" : "Weak"}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mandate Verification Table */}
                        {assessments.length > 0 && (
                          <div className="border border-slate-200 rounded overflow-hidden">
                            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900 font-bold text-slate-300">
                              <div>Employer Target Mandate</div>
                              <div>Matched As</div>
                              <div>Match Type</div>
                              <div>Verification Status</div>
                            </div>
                            {assessments.map((a: any, idx: number) => (
                              <div key={a.requirement?.id || idx} className="grid grid-cols-4 gap-2 p-3 border-b border-slate-100 items-center bg-white">
                                <div className="text-slate-900 font-semibold truncate">{a.requirement?.label || "N/A"}</div>
                                <div className="text-blue-600 truncate">{a.match?.matchedConceptLabel || 'None'}</div>
                                <div className="text-indigo-600 font-bold">{a.match?.type || "N/A"}</div>
                                <div className={a.verified ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                                  {a.verified ? 'VERIFIED' : 'NOT VERIFIED'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "Role Intelligence" && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Matched Keywords</h4>
                  {matchedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {matchedKeywords.map((item: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 rounded bg-slate-100 text-xs font-mono">{item}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No matched keywords extracted.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Missing Signals</h4>
                  {missingKeywords.length > 0 ? (
                    <ul className="space-y-2">
                      {missingKeywords.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-600">• {item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-400">No missing keywords identified.</p>
                  )}
                </div>

                <div className="space-y-4 font-sans border-t border-slate-100 pt-4">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Required Skills Taxonomy</h4>
                    {taxonomySkills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {taxonomySkills.map((vocab: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
                            {vocab}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-slate-400 italic">No explicit vocabulary tokens identified for this mandate.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Extracted Functional Context</h4>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed font-medium">
                      This opportunity tracks under enterprise operations clusters with explicit domain capability dependencies mapped out in your master overview.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Your Fit Breakdown" && (
              <div className="space-y-6 font-sans animate-fadeIn">
                <div className="space-y-3">
                  {breakdown.map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center border rounded-lg p-3 bg-white shadow-sm">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-slate-500">Weight {item.weight}%</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{Math.round(item.rawScore * 100)}%</div>
                        <div className="text-xs text-slate-500">{item.weightedScore?.toFixed(1) || 0} pts</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Evaluator Dimensional Breakdown</h4>
                  {assessments.length > 0 ? (
                    <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      {assessments.map((a: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 px-2 first:pt-1 last:pb-1 border-b last:border-none border-slate-200/60">
                          <span className="text-[12px] font-bold text-slate-700">{a.requirement?.label || "Requirement Reference"}</span>
                          <span className={`text-[10px] font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            a.verified 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}>
                            {a.verified ? "VERIFIED FIT" : "UNVERIFIED"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-slate-400 italic">No dimensional metrics available for processing.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Signals" && (
              <div className="space-y-2.5 text-[11px] text-slate-500 font-mono animate-fadeIn bg-slate-50 p-4 border border-slate-200 rounded-xl">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Engine Blueprint Tracking Version</span>
                  <span className="font-bold text-slate-700">{rawPayload.version || "v2.0.0"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span>Target Source Portal</span>
                  <span className="font-bold text-slate-700">{job.sourcePortal}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Generated Processing Timestamp</span>
                  <span className="font-bold text-slate-700">{rawPayload.evaluatedAt || "Recent Snapshot"}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Snapshot Column */}
        <div className="w-full lg:w-[240px] shrink-0 space-y-6 lg:border-l lg:border-slate-100 lg:pl-6">
          <div className="space-y-3 select-none">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role Snapshot</h4>
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white text-[12px]">
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Seniority Range</span>
                  <span className="text-slate-800 font-bold">Executive Mandate</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Active Targets</span>
                  <span className="text-slate-800 font-bold">{summary.totalRequirements} Focus Nodes</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-slate-400 font-semibold">Location Track</span>
                  <span className="text-slate-800 font-bold truncate max-w-[120px]">{job.location || "India"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Triage Controls */}
      <div className="border-t border-[#E2E8F0] mt-8 pt-4 flex flex-wrap gap-3 select-none">
        <a href={absoluteUrl} target="_blank" rel="noreferrer" className="h-[38px] px-5 bg-slate-950 hover:bg-slate-800 text-white text-[12px] font-bold uppercase tracking-wider rounded-md flex items-center gap-2 transition-colors cursor-pointer shadow-sm">
          Open Target Link
        </a>
        <button onClick={() => onUpdateStatus(job.id, isSaved ? "New" : "Reviewed")} className={`h-[38px] px-5 border rounded-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
          isSaved ? "bg-[#F8FAFC] border-slate-300 text-slate-800" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
        }`}>
          <span>{isSaved ? "Saved to Watchlist" : "Add to Watchlist"}</span>
        </button>
      </div>

    </div>
  );
}