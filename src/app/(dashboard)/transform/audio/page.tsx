"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { RefreshCw, ArrowLeft, Cpu } from "lucide-react";
import Link from "next/link";

export default function audioTransformPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white capitalize">audio Transformation</h1>
          <p className="text-slate-400 text-xs mt-0.5">Automated pipeline specifically for audio source parsing and output compiling.</p>
        </div>
      </div>

      <GlassCard className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">ACT Pipeline Parameters</h3>
            <p className="text-[10px] text-slate-500">Configure semantic models and target schemas</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            This module isolates specialized extraction scripts and LLM prompts tuned for audio operations. Choose a target template below to execute.
          </p>
          <div className="p-10 border border-dashed border-white/10 hover:border-purple-500/30 rounded-xl text-center bg-slate-950/40 cursor-pointer">
            <span className="text-xs text-slate-400 font-semibold">Drop audio files here or click to load</span>
          </div>
        </div>

        <Button className="w-full text-xs">
          Trigger transform
          <RefreshCw className="ml-2 h-4 w-4" />
        </Button>
      </GlassCard>
    </div>
  );
}
