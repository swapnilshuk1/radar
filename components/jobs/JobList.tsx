"use client";

import { OpportunityRow } from "./OpportunityRow";
import { Search } from "lucide-react";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  sourcePortal: string;
  url: string;
  snippet: string;
  matchScore: number;
  rankingData?: string;          // JSON-serialised RankingExplanation
  rankingVersion?: string;
  rankingConfigVersion?: string;
  semanticData?: string | null;  // JSON-serialised SemanticData cache
  status: 'New' | 'Reviewed' | 'Archived';
  scrapedAt: string;
}

interface JobListProps {
  jobs: Job[];
  activeJobId: string | null;
  onSelectJob: (job: Job) => void;
  onUpdateStatus: (id: string, status: "New" | "Reviewed" | "Archived") => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

export function JobList({
  jobs,
  activeJobId,
  onSelectJob,
  onUpdateStatus,
  selectedStatus,
  setSelectedStatus,
}: JobListProps) {
  const statusTabs = ["New", "Reviewed", "Archived"];

  return (
    <div className="flex flex-col font-sans select-none">
      {/* Minimal status tab links */}
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
        <div className="flex gap-5 text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`pb-1.5 -mb-3 transition-colors cursor-pointer border-b border-slate-900 font-extrabold tracking-widest ${
                  isActive
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab === "Reviewed" ? "Saved" : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row List */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)] min-h-[350px] mt-3 px-0.5 py-1">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none font-sans">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
              <Search className="w-5 h-5 opacity-60" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">No Opportunities Found</h3>
            <p className="text-[11px] text-slate-400 max-w-[280px] mt-1 leading-relaxed">
              No jobs match your active status filters or search query. Try typing another keyword or click Search to trigger a scraping session.
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <OpportunityRow
              key={job.id}
              job={job}
              isActive={activeJobId === job.id}
              onSelect={() => onSelectJob(job)}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
