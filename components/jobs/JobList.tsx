"use client";

import { OpportunityRow } from "./OpportunityRow";
import { CheckCircle, Scissors, Eye, Key, Search, ChevronDown } from "lucide-react";

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
  selectedTab: string;
  stats: {
    apply: number;
    tailor: number;
    watch: number;
    unlock: number;
  };
}

export function JobList({
  jobs,
  activeJobId,
  onSelectJob,
  onUpdateStatus,
  selectedTab,
  stats,
}: JobListProps) {
  const isOverview = selectedTab === 'OVERVIEW';

  return (
    <div className="flex flex-col font-sans select-none w-full">
      {/* 1. Header Greeting (Overview only) */}
      {isOverview && (
        <div className="mb-6 animate-fadeIn">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-0.5">
            GOOD MORNING, SWAPNIL
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Here's your snapshot for today.
          </h2>
        </div>
      )}

      {/* 2. Snapshot Stats Row (Overview only) */}
      {isOverview && (
        <div className="grid grid-cols-2 gap-3 mb-6 animate-fadeIn">
          {/* Card 1: Apply */}
          <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow transition-all duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-slate-800 block">Apply</span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">High fit, act now</span>
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 ml-2 shrink-0">{stats.apply}</span>
          </div>

          {/* Card 2: Tailor */}
          <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow transition-all duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-slate-800 block">Tailor</span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">Strong potential</span>
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 ml-2 shrink-0">{stats.tailor}</span>
          </div>

          {/* Card 3: Watch */}
          <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow transition-all duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-slate-800 block">Watch</span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">Keep on radar</span>
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 ml-2 shrink-0">{stats.watch}</span>
          </div>

          {/* Card 4: Unlock */}
          <div className="bg-white border border-[#E2E8F0] p-3 rounded-xl flex items-center justify-between shadow-sm hover:shadow transition-all duration-150">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-bold text-slate-800 block">Unlock</span>
                <span className="text-[10px] font-medium text-slate-400 block truncate">Improve odds</span>
              </div>
            </div>
            <span className="text-xl font-bold text-slate-900 ml-2 shrink-0">{stats.unlock}</span>
          </div>
        </div>
      )}

      {/* 3. Feed Section Header */}
      <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E2E8F0] animate-fadeIn">
        <h3 className="text-[14px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          {selectedTab === 'OVERVIEW' && `Top picks for you (${jobs.length})`}
          {selectedTab === 'OPPORTUNITIES' && `All Scraped Opportunities (${jobs.length})`}
          {selectedTab === 'WATCHLIST' && `My Watchlist (${jobs.length})`}
          {selectedTab === 'ARCHIVED' && `Archived Opportunity Log (${jobs.length})`}
        </h3>

        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer transition-colors">
          <span>Sorted by: <span className="text-slate-900 font-bold">Relevance</span></span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 4. Row Feed List */}
      <div className="flex-1 space-y-3">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none font-sans">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-400 mb-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] animate-pulse">
              <Search className="w-5 h-5 opacity-60" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">No Opportunities Found</h3>
            <p className="text-[11px] text-slate-400 max-w-[280px] mt-1 leading-relaxed">
              No jobs match your active filters or search query. Click live search to scrape some new listings.
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
