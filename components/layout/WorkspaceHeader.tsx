"use client";

import { 
  RefreshCw, 
  Play, 
  StopCircle, 
  Layers,
  Zap,
  Loader2,
  BarChart3
} from "lucide-react";

interface WorkspaceHeaderProps {
  selectedPortal: string;
  setSelectedPortal: (portal: string) => void;
  isScraping: boolean;
  startScrape: () => void;
  stopScrape: () => void;
  fetchJobs: () => void;
  loadingJobs: boolean;
  totalCount: number;
  newCount: number;
  reviewedCount: number;
  maxScore: number;
  insightsModeActive: boolean;
  onInsightsToggle: () => void;
}

export function WorkspaceHeader({
  selectedPortal,
  setSelectedPortal,
  isScraping,
  startScrape,
  stopScrape,
  fetchJobs,
  loadingJobs,
  totalCount,
  newCount,
  reviewedCount,
  maxScore,
  insightsModeActive,
  onInsightsToggle,
}: WorkspaceHeaderProps) {
  const portals = ["All", "LinkedIn", "Naukri", "Indeed"];

  return (
    <header className="bg-[#091016] text-slate-200 border-b border-slate-900 px-6 h-[8vh] min-h-[50px] max-h-[65px] flex items-center justify-between gap-4 font-sans select-none shrink-0">
      
      {/* Left: Brand logo & inline metrics */}
      <div className="flex items-center gap-6 min-w-0">
        {/* Brand logo block */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Radar</span>
        </div>

        {/* Muted metrics dashboard */}
        <div className="hidden md:flex items-center gap-2.5 text-[10px] text-slate-500 font-semibold">
          <span>
            <span className="text-slate-350 font-bold">{totalCount}</span> feed
          </span>
          <span>•</span>
          <span>
            <span className="text-blue-400 font-bold">{newCount}</span> new
          </span>
          <span>•</span>
          <span>
            <span className="text-emerald-450 font-bold">{reviewedCount}</span> saved
          </span>
          {maxScore > 0 && (
            <>
              <span>•</span>
              <span className="text-emerald-450 font-bold">
                ▲ {maxScore} max signal
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center: Quiet navigation tabs */}
      <nav className="flex items-center gap-5">
        {portals.map((p) => {
          const isActive = selectedPortal === p;
          return (
            <button
              key={p}
              onClick={() => setSelectedPortal(p)}
              className={`pb-1 text-[10px] uppercase tracking-wider font-extrabold transition-colors cursor-pointer border-b ${
                isActive
                  ? "border-slate-300 text-white font-black"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {p}
            </button>
          );
        })}
      </nav>

      {/* Right: Console controls */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Workspace Insights toggle */}
        <button
          onClick={onInsightsToggle}
          className={`px-3 py-1.5 border rounded transition-all flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer ${
            insightsModeActive
              ? 'bg-slate-800 border-slate-700 text-white'
              : 'border-slate-800 bg-transparent text-slate-400 hover:bg-slate-850 hover:text-white'
          }`}
          title="Toggle Insights"
        >
          <BarChart3 className="w-3 h-3 shrink-0" />
          <span>Insights</span>
        </button>

        {/* Database Refresh Sync */}
        <button
          onClick={fetchJobs}
          disabled={loadingJobs}
          className="px-3 py-1.5 border border-slate-800 bg-transparent hover:bg-slate-850 text-slate-400 hover:text-white rounded transition-all flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider disabled:opacity-30 cursor-pointer"
          title="Sync Feed"
        >
          <RefreshCw className={`w-3 h-3 shrink-0 ${loadingJobs ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>

        {/* Live Scraper Switcher */}
        {isScraping ? (
          <button
            onClick={stopScrape}
            className="px-3.5 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={startScrape}
            className="px-3.5 py-1.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 bg-white hover:bg-slate-100 text-[#091016] transition-all cursor-pointer shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Live Search</span>
          </button>
        )}
      </div>
    </header>
  );
}
