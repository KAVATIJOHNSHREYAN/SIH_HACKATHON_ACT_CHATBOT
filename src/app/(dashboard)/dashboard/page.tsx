"use client";

import React from "react";
import Link from "next/link";
import { 
  FileText, 
  FileCheck, 
  Layers, 
  Coins, 
  TrendingUp, 
  ArrowUpRight, 
  Play, 
  Sparkles, 
  Clock, 
  Flame,
  Volume2
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function DashboardHome() {
  const stats = [
    { name: "Files Processed", value: "142", change: "+12.5%", icon: FileCheck, color: "text-purple-400" },
    { name: "Words Processed", value: "284,500", change: "+8.2%", icon: FileText, color: "text-blue-400" },
    { name: "Tokens Used", value: "1.24M", change: "+15.3%", icon: Layers, color: "text-cyan-400" },
    { name: "Remaining Credits", value: "480 / 1500", change: "Resets Sep 1", icon: Coins, color: "text-emerald-400" },
  ];

  const recentActivity = [
    { id: 1, action: "PDF to Markdown", target: "Quarterly_Statement_Q2.pdf", size: "2.4 MB", time: "10 mins ago", status: "Success" },
    { id: 2, action: "Audio to Transcript", target: "Client_Feedback_Call.mp3", size: "14.1 MB", time: "1 hour ago", status: "Success" },
    { id: 3, action: "Text to Social Media", target: "LinkedIn Post Generation", size: "124 words", time: "4 hours ago", status: "Success" },
    { id: 4, action: "OCR to Structured Data", target: "Invoice_Scan_9921.jpg", size: "840 KB", time: "1 day ago", status: "Success" },
  ];

  const quickActions = [
    { title: "Transform PDF", desc: "Convert PDF to summaries, flashcards, structured data, or FAQs.", href: "/transform", icon: FileText, color: "from-purple-500 to-indigo-600" },
    { title: "Transcribe Audio", desc: "Upload MP3 or WAV briefs and extract notes, logs, or summaries.", href: "/transform", icon: Volume2, color: "from-cyan-500 to-blue-600" },
    { title: "ACT Chat Workspace", desc: "Interact with transformed files and extract citations via RAG.", href: "/chat", icon: Sparkles, color: "from-violet-600 to-purple-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-slate-900/40 to-cyan-950/10 p-8 md:p-10">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-xs font-semibold text-purple-300">
            <Flame className="h-3.5 w-3.5" />
            ACT is fully operational
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Hello, John. How can I transform your content today?
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Welcome to your ACT dashboard. Transform enterprise files, query context bases using RAG vector indices, or build workflows with tailored templates.
          </p>
          <div className="pt-2">
            <Link href="/transform">
              <Button>
                New Transformation
                <Play className="ml-2 h-3.5 w-3.5 fill-current" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <GlassCard key={stat.name} className="flex items-center gap-5">
            <div className={`h-12 w-12 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center ${stat.color} shrink-0`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.name}</p>
              <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{stat.value}</h3>
              <div className="flex items-center gap-1 mt-1 text-[10px]">
                <TrendingUp className="h-3 w-3 text-purple-400" />
                <span className="font-semibold text-slate-300">{stat.change}</span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Action Tiles */}
      <div>
        <h2 className="text-xl font-bold text-white mb-5 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Quick Launch Workspaces
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {quickActions.map((act) => (
            <GlassCard key={act.title} className="p-0 border-white/10 overflow-hidden flex flex-col justify-between h-52 group">
              <div className={`h-2 bg-gradient-to-r ${act.color}`} />
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white">
                      <act.icon className="h-4.5 w-4.5" />
                    </div>
                    <ArrowUpRight className="h-4.5 w-4.5 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{act.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{act.desc}</p>
                </div>
                <Link href={act.href} className="inline-block mt-4 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                  Open Workspace &rarr;
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <GlassCard className="border-white/5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
              <Clock className="h-5 w-5 text-slate-400" />
              Transformation Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-1">Audit log of your recent conversion jobs</p>
          </div>
          <Link href="/history">
            <Button variant="outline" size="sm">View Full History</Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 font-medium">
                <th className="py-3 px-2 uppercase tracking-wider">File Name</th>
                <th className="py-3 px-2 uppercase tracking-wider">Type</th>
                <th className="py-3 px-2 uppercase tracking-wider">Size</th>
                <th className="py-3 px-2 uppercase tracking-wider">Time</th>
                <th className="py-3 px-2 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {recentActivity.map((activity) => (
                <tr key={activity.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-semibold text-slate-200">{activity.target}</td>
                  <td className="py-3.5 px-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/10 text-slate-300 font-medium">
                      {activity.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-slate-400">{activity.size}</td>
                  <td className="py-3.5 px-2 text-slate-400">{activity.time}</td>
                  <td className="py-3.5 px-2">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
