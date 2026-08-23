"use client";

import React from "react";
import { BarChart3, TrendingUp, Cpu, HardDrive, FileCheck } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AnalyticsPage() {
  const chartData = [
    { day: "Mon", words: 42000, files: 8 },
    { day: "Tue", words: 58000, files: 12 },
    { day: "Wed", words: 31000, files: 6 },
    { day: "Thu", words: 89000, files: 19 },
    { day: "Fri", words: 72000, files: 15 },
    { day: "Sat", words: 12000, files: 3 },
    { day: "Sun", words: 9000, files: 2 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-purple-400" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 text-xs mt-1">Usage statistics and processing distribution logs.</p>
      </div>

      {/* Numerical Stats overview */}
      <div className="grid sm:grid-cols-3 gap-6">
        <GlassCard className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">LLM Tokens Processed</p>
            <h3 className="text-xl font-bold text-white mt-0.5">1.24M</h3>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Vector Index Storage</p>
            <h3 className="text-xl font-bold text-white mt-0.5">42.8 MB / 500 MB</h3>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Overall Success Rate</p>
            <h3 className="text-xl font-bold text-white mt-0.5">99.8%</h3>
          </div>
        </GlassCard>
      </div>

      {/* Styled Mock Chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-white mb-6">Words Transformed (Weekly Analysis)</h3>
        <div className="h-64 flex items-end gap-3.5 pt-6 border-b border-white/10 pb-2">
          {chartData.map((data) => {
            const heightPct = (data.words / 100000) * 100;
            return (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t-lg transition-all duration-500 hover:brightness-110 relative"
                  style={{ height: `${heightPct}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 border border-white/10 text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.words.toLocaleString()} words
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{data.day}</span>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
