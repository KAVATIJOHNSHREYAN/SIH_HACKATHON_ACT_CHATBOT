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
  ShieldCheck,
  Volume2
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

export default function DashboardHome() {
  const { user } = useUser();
  const { isDark } = useTheme();

  const T = isDark ? DARK : LIGHT;

  const stats = [
    { name: "Files Processed", value: "142", change: "+12.5%", icon: FileCheck },
    { name: "Words Processed", value: "284,500", change: "+8.2%", icon: FileText },
    { name: "Tokens Used", value: "1.24M", change: "+15.3%", icon: Layers },
    { name: "Remaining Credits", value: "480 / 1500", change: "Resets Sep 1", icon: Coins },
  ];

  const recentActivity = [
    { id: 1, action: "PDF to Markdown", target: "Quarterly_Statement_Q2.pdf", size: "2.4 MB", time: "10 mins ago", status: "Success" },
    { id: 2, action: "Audio to Transcript", target: "Client_Feedback_Call.mp3", size: "14.1 MB", time: "1 hour ago", status: "Success" },
    { id: 3, action: "Text to Social Media", target: "LinkedIn Post Generation", size: "124 words", time: "4 hours ago", status: "Success" },
    { id: 4, action: "OCR to Structured Data", target: "Invoice_Scan_9921.jpg", size: "840 KB", time: "1 day ago", status: "Success" },
  ];

  const quickActions = [
    { title: "Transform PDF", desc: "Convert PDF to summaries, flashcards, structured data, or FAQs.", href: "/transform/pdf", icon: FileText },
    { title: "Transcribe Audio", desc: "Upload MP3 or WAV briefs and extract notes, logs, or summaries.", href: "/transform/audio", icon: Volume2 },
    { title: "ACT Chat Workspace", desc: "Interact with transformed files and extract citations via RAG.", href: "/chat", icon: Sparkles },
  ];

  const displayName = user?.name || "Guest";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Welcome Banner */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 transition-all border"
        style={{
          background: isDark 
            ? 'linear-gradient(135deg, #0b1628 0%, #0f1e35 100%)' 
            : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
          borderColor: T.border,
          boxShadow: isDark 
            ? '0 4px 32px rgba(59,130,246,0.15)' 
            : '0 4px 32px rgba(34,197,94,0.10)',
        }}
      >
        {/* Decorative leaf illustration area */}
        <div className="absolute top-0 right-0 w-72 h-72 opacity-20 pointer-events-none select-none flex items-center justify-center">
          <svg viewBox="0 0 300 300" fill="none" className="w-full h-full">
            <ellipse cx="220" cy="80" rx="80" ry="40" fill={isDark ? "#3b82f6" : "#22c55e"} opacity="0.3" transform="rotate(-30 220 80)" />
            <ellipse cx="240" cy="150" rx="60" ry="28" fill={isDark ? "#2563eb" : "#16a34a"} opacity="0.25" transform="rotate(15 240 150)" />
            <ellipse cx="190" cy="200" rx="70" ry="30" fill={isDark ? "#60a5fa" : "#4ade80"} opacity="0.2" transform="rotate(-10 190 200)" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          {/* Status badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ 
              backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dcfce7', 
              borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#22c55e', 
              color: isDark ? '#60a5fa' : '#16a34a' 
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            ACT is fully operational
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: T.textPrimary }}>
            Hello, {displayName}. How can I{" "}
            <span style={{ color: isDark ? '#60a5fa' : '#16a34a' }}>transform</span>
            <br />your content today?
          </h1>

          <p className="text-sm md:text-base leading-relaxed" style={{ color: T.textSecondary }}>
            Welcome to your ACT dashboard. Transform enterprise files, query context bases using RAG vector indices, or build workflows with tailored templates.
          </p>

          <div className="pt-2">
            <Link href="/transform">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, #2563eb, #3b82f6)' 
                    : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(59,130,246,0.35)' 
                    : '0 4px 20px rgba(34,197,94,0.35)',
                }}
              >
                New Transformation
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02] border"
            style={{
              backgroundColor: T.bgCard,
              borderColor: T.border,
              boxShadow: isDark 
                ? '0 2px 12px rgba(59,130,246,0.05)' 
                : '0 2px 12px rgba(34,197,94,0.07)',
            }}
          >
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ 
                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dcfce7', 
                color: isDark ? '#60a5fa' : '#16a34a' 
              }}
            >
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isDark ? '#94a3b8' : '#86efac' }}>
                {stat.name}
              </p>
              <h3 className="text-xl font-extrabold mt-0.5 tracking-tight" style={{ color: T.textPrimary }}>
                {stat.value}
              </h3>
              <div className="flex items-center gap-1 mt-0.5 text-[10px]">
                <TrendingUp className="h-3 w-3" style={{ color: isDark ? '#60a5fa' : '#22c55e' }} />
                <span className="font-semibold" style={{ color: isDark ? '#60a5fa' : '#22c55e' }}>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launch Workspaces */}
      <div>
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: T.textPrimary }}>
          <Sparkles className="h-5 w-5" style={{ color: isDark ? '#60a5fa' : '#22c55e' }} />
          Quick Launch Workspaces
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {quickActions.map((act) => (
            <div
              key={act.title}
              className="flex flex-col justify-between p-6 rounded-2xl h-52 group transition-all hover:scale-[1.02] border"
              style={{
                backgroundColor: T.bgCard,
                borderColor: T.border,
                boxShadow: isDark 
                  ? '0 2px 12px rgba(59,130,246,0.05)' 
                  : '0 2px 12px rgba(34,197,94,0.06)',
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ 
                      backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dcfce7', 
                      color: isDark ? '#60a5fa' : '#16a34a' 
                    }}
                  >
                    <act.icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: isDark ? '#94a3b8' : '#86efac' }} />
                </div>
                <h3 className="text-base font-bold mb-1.5" style={{ color: T.textPrimary }}>{act.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>{act.desc}</p>
              </div>
              <Link
                href={act.href}
                className="inline-block mt-4 text-xs font-bold transition-colors"
                style={{ color: isDark ? '#60a5fa' : '#16a34a' }}
              >
                Open Workspace →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Transformation Ledger */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          backgroundColor: T.bgCard,
          borderColor: T.border,
          boxShadow: isDark 
            ? '0 2px 12px rgba(59,130,246,0.05)' 
            : '0 2px 12px rgba(34,197,94,0.07)',
        }}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b" style={{ borderColor: T.border }}>
          <div>
            <h2 className="text-base font-bold flex items-center gap-2" style={{ color: T.textPrimary }}>
              <Clock className="h-4.5 w-4.5" style={{ color: isDark ? '#60a5fa' : '#22c55e' }} />
              Transformation Ledger
            </h2>
            <p className="text-xs mt-0.5" style={{ color: isDark ? '#94a3b8' : '#86efac' }}>Audit log of your recent conversion jobs</p>
          </div>
          <Link href="/history">
            <button
              className="px-4 py-1.5 rounded-xl text-xs font-bold transition-colors border"
              style={{
                borderColor: isDark ? '#3b82f6' : '#22c55e',
                color: isDark ? '#60a5fa' : '#16a34a',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(59,130,246,0.1)' : '#dcfce7';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              View Full History
            </button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b" style={{ color: isDark ? '#94a3b8' : '#86efac', borderColor: T.border }}>
                <th className="py-3 px-2 uppercase tracking-wider font-semibold">File Name</th>
                <th className="py-3 px-2 uppercase tracking-wider font-semibold">Type</th>
                <th className="py-3 px-2 uppercase tracking-wider font-semibold">Size</th>
                <th className="py-3 px-2 uppercase tracking-wider font-semibold">Time</th>
                <th className="py-3 px-2 uppercase tracking-wider font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((activity) => (
                <tr
                  key={activity.id}
                  className="transition-colors border-b"
                  style={{ borderColor: T.border }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : '#f0fdf4';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <td className="py-3.5 px-2 font-semibold" style={{ color: T.textPrimary }}>{activity.target}</td>
                  <td className="py-3.5 px-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                      style={{ 
                        backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#dcfce7', 
                        color: isDark ? '#60a5fa' : '#16a34a', 
                        borderColor: isDark ? 'rgba(59,130,246,0.3)' : '#86efac' 
                      }}
                    >
                      {activity.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-2" style={{ color: T.textSecondary }}>{activity.size}</td>
                  <td className="py-3.5 px-2" style={{ color: T.textSecondary }}>{activity.time}</td>
                  <td className="py-3.5 px-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: isDark ? '#60a5fa' : '#16a34a' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#3b82f6' : '#22c55e' }} />
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
