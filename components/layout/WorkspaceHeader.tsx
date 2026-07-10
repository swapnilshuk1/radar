"use client";

import { 
  RefreshCw, 
  Sliders,
  Search
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

interface WorkspaceHeaderProps {
  searchText: string;
  setSearchText: (text: string) => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  isScraping: boolean;
  startScrape: () => void;
  stopScrape: () => void;
  fetchJobs: () => void;
  loadingJobs: boolean;
}

export function WorkspaceHeader({
  searchText,
  setSearchText,
  selectedTab,
  setSelectedTab,
  isScraping,
  startScrape,
  stopScrape,
  fetchJobs,
  loadingJobs,
}: WorkspaceHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when "/" is pressed (avoiding active inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tabs = ["OVERVIEW", "OPPORTUNITIES", "WATCHLIST", "ARCHIVED"];

  return (
    <div className="flex flex-col shrink-0 font-sans select-none z-30">
      {/* Primary Top Header */}
      <header className="bg-[#090B0D] text-slate-100 border-b border-[#1A1F26] px-6 h-[56px] flex items-center justify-between gap-4">
        
        {/* Left: Brand logo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            {/* Green glowing indicator */}
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-[12px] font-bold tracking-[0.25em] uppercase text-white font-mono">Radar</span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-lg relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Ask RADAR anything..."
            className="w-full bg-[#12161A] text-slate-100 text-[13px] font-medium pl-9 pr-12 py-1.5 rounded-md border border-[#222B35] focus:outline-none focus:border-slate-500 placeholder-slate-500 transition-all shadow-inner"
          />
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <span className="text-[9px] font-bold text-slate-500 bg-[#1C232A] px-1.5 py-0.5 rounded border border-[#2A3440] font-mono leading-none">
              /
            </span>
          </div>
        </div>

        {/* Right: Action controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Weights Config */}
          <Link
            href="/weights"
            className="h-[32px] px-3.5 border border-[#222B35] bg-transparent hover:bg-[#1C232A] text-slate-300 hover:text-white rounded-md transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
            title="Configure Weights (W)"
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>Weights</span>
          </Link>

          {/* Sync Feed */}
          <button
            onClick={fetchJobs}
            disabled={loadingJobs}
            className="h-[32px] px-3.5 border border-[#222B35] bg-transparent hover:bg-[#1C232A] text-slate-300 hover:text-white rounded-md transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider disabled:opacity-30 cursor-pointer"
            title="Sync Feed (R)"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loadingJobs ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          {/* Live Scraper Stop/Search */}
          {isScraping ? (
            <button
              onClick={stopScrape}
              className="h-[32px] px-4 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 bg-[#E11D48] hover:bg-[#BE123C] text-white transition-all cursor-pointer shadow-[0_1px_4px_rgba(225,29,72,0.4)]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 animate-ping" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={startScrape}
              className="h-[32px] px-4 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 bg-white hover:bg-slate-100 text-[#090B0D] transition-all cursor-pointer shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Live Search</span>
            </button>
          )}

        </div>
      </header>

      {/* Secondary Navigation Row */}
      <div className="bg-white text-slate-800 border-b border-[#E2E8F0] px-6 h-[40px] flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = selectedTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`h-full text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer border-b-2 flex items-center ${
                isActive
                  ? "border-emerald-500 text-slate-900 font-bold"
                  : "border-transparent text-[#64748B] hover:text-slate-800"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
