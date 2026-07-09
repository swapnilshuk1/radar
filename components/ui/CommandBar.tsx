"use client";

import { useRef, useEffect } from "react";
import { Search } from "lucide-react";

interface CommandBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function CommandBar({ value, onChange, placeholder = "Search opportunities... (Press '/' to focus)" }: CommandBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on '/' if not in an input/textarea
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex items-center w-full bg-white border border-slate-100 rounded-md focus-within:border-slate-400 transition-colors">
      <div className="flex items-center pl-3 text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 pl-2.5 pr-12 text-sm text-slate-900 placeholder-slate-400 bg-transparent outline-none font-sans"
      />
      <div className="absolute right-3 flex items-center pointer-events-none bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] text-slate-500 font-bold font-mono">
        /
      </div>
    </div>
  );
}
