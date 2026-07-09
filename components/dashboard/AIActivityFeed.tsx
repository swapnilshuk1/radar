"use client";

import { useRef, useEffect } from "react";
import { 
  Sparkles, 
  Search, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  HelpCircle,
  Clock
} from "lucide-react";

interface AIActivityFeedProps {
  logs: string[];
}

interface ActivityItem {
  id: number;
  time: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error" | "discard";
  icon: any;
}

export function AIActivityFeed({ logs }: AIActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [logs]);

  // Parse raw console log dumps into clear human-readable AI activity descriptions
  const parseLogs = (rawLogs: string[]): ActivityItem[] => {
    return rawLogs.map((log, index) => {
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      if (log.includes("Initializing scraping engine")) {
        return {
          id: index,
          time,
          title: "Engine Startup",
          description: "Autonomous scraping context initialized in browser.",
          type: "info",
          icon: Sparkles
        };
      }
      if (log.includes("Searching for mandate")) {
        const match = log.match(/"([^"]+)"/);
        const term = match ? match[1] : "target executive roles";
        return {
          id: index,
          time,
          title: "Mandate Search",
          description: `Scanning index pages for "${term}".`,
          type: "info",
          icon: Search
        };
      }
      if (log.includes("Scraping Page")) {
        const pageNum = log.includes("1") ? "1" : "2";
        return {
          id: index,
          time,
          title: "Crawling Portal",
          description: `Extracting job elements from search list page ${pageNum}.`,
          type: "info",
          icon: Clock
        };
      }
      if (log.includes("CAPTCHA") || log.includes("verification")) {
        return {
          id: index,
          time,
          title: "Verification Triggered",
          description: "Anti-bot CAPTCHA wall detected. Please complete it in Chromium.",
          type: "warning",
          icon: AlertTriangle
        };
      }
      if (log.includes("Saved/Upserted")) {
        return {
          id: index,
          time,
          title: "Data Sync Complete",
          description: log.replace("[LinkedIn] ", "").replace("[Indeed] ", "").replace("[Naukri] ", ""),
          type: "success",
          icon: CheckCircle
        };
      }
      if (log.includes("Discarded") || log.includes("[Sanitization]")) {
        return {
          id: index,
          time,
          title: "Noise Dropped",
          description: "Filtered out listing with missing/Guest company fields.",
          type: "discard",
          icon: Trash2
        };
      }
      
      // Default fallback
      return {
        id: index,
        time,
        title: log.startsWith("[SYSTEM]") ? "System Alert" : "Agent Action",
        description: log.replace(/^\[SYSTEM\]\s*/, "").replace(/^\[Sanitization\]\s*/, ""),
        type: "info",
        icon: Database
      };
    });
  };

  const parsedActivities = parseLogs(logs);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm font-sans">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-650" />
          <span>AI Workspace Feed</span>
        </h3>
        <span className="text-[9px] bg-slate-200 text-slate-650 font-bold px-1.5 py-0.5 rounded font-mono">
          LIVE
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[360px] lg:max-h-[500px]"
      >
        {parsedActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 gap-1.5">
            <Clock className="w-6 h-6 opacity-30" />
            <p className="text-[11px] font-bold">No active workspace signals.</p>
          </div>
        ) : (
          parsedActivities.map((act) => {
            const Icon = act.icon;
            
            const badgeColors = {
              info: "bg-slate-50 border-slate-200 text-slate-500",
              success: "bg-emerald-50 border-emerald-200 text-emerald-600",
              warning: "bg-amber-50 border-amber-250 text-amber-600 animate-pulse",
              error: "bg-rose-50 border-rose-250 text-rose-600",
              discard: "bg-slate-50 border-slate-200 text-slate-400 line-through",
            };

            return (
              <div key={act.id} className="flex gap-3 text-xs leading-normal pb-3 border-b border-slate-100 last:border-0">
                <div className={`p-1.5 rounded-md border self-start ${badgeColors[act.type]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${act.type === 'discard' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                      {act.title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono font-semibold">
                      {act.time}
                    </span>
                  </div>
                  <p className={`text-[11px] ${act.type === 'discard' ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
