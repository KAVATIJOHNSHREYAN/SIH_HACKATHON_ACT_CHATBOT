"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Folder, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FilesfoldersPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/files" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white capitalize">folders Directory</h1>
          <p className="text-slate-400 text-xs mt-0.5">Specialized browser view filter for folders items.</p>
        </div>
      </div>

      <GlassCard className="flex items-center gap-4 p-8">
        <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
          <Folder className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Document Repository</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Welcome to the dedicated folders file hub. You can upload, star, search, or delete items inside this namespace.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
