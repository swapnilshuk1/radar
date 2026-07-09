"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const baseStyle = "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide transition-colors font-sans";
  
  const variantStyles = {
    default: "bg-slate-50 border-slate-200 text-slate-700",
    success: "bg-emerald-50 border-emerald-250 text-emerald-700",
    warning: "bg-amber-50 border-amber-250 text-amber-800",
    error: "bg-rose-50 border-rose-250 text-rose-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <span className={`${baseStyle} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
