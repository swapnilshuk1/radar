"use client";

import { X, BarChart3, Sparkles } from "lucide-react";
import { ExecutiveBrief } from "../jobs/ExecutiveBrief";
import { WorkspaceInsights } from "./WorkspaceInsights";
import { Job } from "../jobs/JobList";

export type InspectorMode = "hidden" | "brief" | "insights";

interface InspectorPanelProps {
  mode: InspectorMode;
  activeJob: Job | null;
  jobs: Job[];
  logs: string[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
}

export function InspectorPanel({
  mode,
  activeJob,
  jobs,
  logs,
  onClose,
  onUpdateStatus,
}: InspectorPanelProps) {
  const isVisible = mode !== "hidden";

  return (
    <aside
      className={`
        flex flex-col bg-[#0B131E] text-slate-200 border-l border-slate-950
        transition-all duration-300 ease-out overflow-hidden shrink-0
        ${isVisible ? "w-[400px] xl:w-[440px] opacity-100" : "w-0 opacity-0"}
      `}
    >
      {/* Inner wrapper prevents content jumping during animation */}
      <div className="flex flex-col h-full w-[400px] xl:w-[440px] shrink-0">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            {mode === "brief" ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Executive Briefing
                </span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Workspace Insights
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === "brief" && activeJob && (() => {
            const explanation = activeJob.rankingData
              ? (() => { try { return JSON.parse(activeJob.rankingData); } catch { return null; } })()
              : null;
            const briefingBundle = explanation?.evalResult?.briefingBundle || null;
            return (
              <div className="p-6">
                <ExecutiveBrief 
                  job={activeJob} 
                  briefingBundle={briefingBundle} 
                  onUpdateStatus={onUpdateStatus} 
                />
              </div>
            );
          })()}
          {mode === "insights" && (
            <div className="p-6">
              <WorkspaceInsights jobs={jobs} logs={logs} />
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
