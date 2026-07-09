"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Briefcase, 
  RefreshCw, 
  Play, 
  StopCircle, 
  Globe, 
  Layers, 
  MapPin,
  Sliders,
  Home
} from "lucide-react";

interface SidebarProps {
  selectedPortal: string;
  setSelectedPortal: (portal: string) => void;
  isScraping: boolean;
  startScrape: () => void;
  stopScrape: () => void;
  fetchJobs: () => void;
  loadingJobs: boolean;
  totalCount: number;
}

export function Sidebar({
  selectedPortal,
  setSelectedPortal,
  isScraping,
  startScrape,
  stopScrape,
  fetchJobs,
  loadingJobs,
  totalCount,
}: SidebarProps) {
  const portals = [
    { name: "All", icon: Layers },
    { name: "LinkedIn", icon: Globe },
    { name: "Naukri", icon: Briefcase },
    { name: "Indeed", icon: MapPin },
  ];

  const pathname = usePathname();

  const navPages = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/weights', label: 'Weight Config', icon: Sliders },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 font-sans">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse shadow-[0_0_8px_rgba(15,23,42,0.4)]"></div>
        <div>
          <h2 className="text-xs font-black tracking-tight text-slate-900 leading-none">RADAR EXECUTIVE</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Intelligence Workspace</p>
        </div>
      </div>

      {/* Global Navigation */}
      <div className="px-3 py-3 border-b border-slate-100">
        <span className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Navigate</span>
        <nav className="mt-1.5 space-y-0.5">
          {navPages.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Navigation Filter Section */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div className="space-y-1.5">
          <span className="px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Portals</span>
          <nav className="space-y-0.5">
            {portals.map((p) => {
              const Icon = p.icon;
              const isActive = selectedPortal === p.name;
              return (
                <button
                  key={p.name}
                  onClick={() => setSelectedPortal(p.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 opacity-80" />
                    <span>{p.name}</span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold font-mono px-1.5 py-0.5 rounded leading-none">
                      {totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync control block */}
        <div className="space-y-2 px-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Controls</span>
          <button
            onClick={fetchJobs}
            disabled={loadingJobs}
            className="w-full px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-md transition-all flex items-center justify-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loadingJobs ? "animate-spin" : ""}`} />
            <span>Sync Listings</span>
          </button>
        </div>
      </div>

      {/* Action Footbar - Executing scraping searches */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {isScraping ? (
          <button
            onClick={stopScrape}
            className="w-full px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Engine</span>
          </button>
        ) : (
          <button
            onClick={startScrape}
            className="w-full px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            <span>Execute Search</span>
          </button>
        )}
      </div>
    </aside>
  );
}
