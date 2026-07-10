"use client";

import { X, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
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

  // Calculate current index for pagination controls
  const currentIndex = activeJob 
    ? jobs.findIndex(j => j.id === activeJob.id) 
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0) {
      onClose(); // Reset brief selection momentarily for smooth transition
      setTimeout(() => {
        const prevJob = jobs[currentIndex - 1];
        if (prevJob) {
          // Trigger select (this will be handled by parent state machine)
          const selectBtn = document.querySelector(`[onClick*="${prevJob.id}"]`) as HTMLElement;
          if (selectBtn) selectBtn.click();
        }
      }, 50);
    }
  };

  const handleNext = () => {
    if (currentIndex < jobs.length - 1) {
      onClose();
      setTimeout(() => {
        const nextJob = jobs[currentIndex + 1];
        if (nextJob) {
          const selectBtn = document.querySelector(`[onClick*="${nextJob.id}"]`) as HTMLElement;
          if (selectBtn) selectBtn.click();
        }
      }, 50);
    }
  };

  const isSaved = activeJob?.status === "Reviewed";

  return (
    <aside
      className={`
        flex flex-col bg-white border-l border-[#E2E8F0]
        transition-all duration-200 ease-out overflow-hidden shrink-0 z-20 shadow-[-4px_0_16px_rgba(0,0,0,0.02)]
        ${isVisible ? "flex-1 opacity-100" : "w-0 opacity-0 pointer-events-none"}
      `}
    >
      {/* Inner wrapper prevents layout resizing bugs */}
      <div className="flex flex-col h-full w-full overflow-hidden">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] shrink-0 bg-white">
          {mode === "brief" && activeJob ? (
            <div className="flex items-center gap-3">
              {/* Pagination controls */}
              <button 
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[12px] font-bold text-slate-500 font-mono">
                {currentIndex + 1} of {jobs.length}
              </span>
              <button 
                onClick={handleNext}
                disabled={currentIndex >= jobs.length - 1 || currentIndex === -1}
                className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Workspace Insights
            </span>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {mode === "brief" && activeJob && (
              <button
                onClick={() => onUpdateStatus(activeJob.id, isSaved ? "New" : "Reviewed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isSaved 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
                title={isSaved ? "Saved to Watchlist" : "Save to Watchlist (S)"}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <span className="sr-only">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Content */}
        <div className="flex-1 overflow-y-auto bg-white">
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
            <div className="p-6 bg-[#0B131E] text-slate-200 h-full">
              <WorkspaceInsights jobs={jobs} logs={logs} />
            </div>
          )}
        </div>

      </div>
    </aside>
  );
}
