"use client";

import React from "react";
import { HelpCircle, BookOpen, KeyRound, Cpu, Layers } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function HelpPage() {
  const sections = [
    {
      title: "Getting Started with ACT",
      desc: "ACT integrates Generative AI models to convert files. Go to the Transform workspace, configure your inputs (like scanned PDFs or audio transcripts), select your target format, and execute.",
      icon: BookOpen
    },
    {
      title: "RAG Vector Architecture",
      desc: "Every document uploaded in My Files gets parsed, chunked, and embedded into Pinecone vector storage. You can then toggle RAG chats inside the AI Workspace, providing context-aware answers with inline citations.",
      icon: Layers
    },
    {
      title: "Model Switching and Switcher",
      desc: "ACT utilizes a custom multi-model switcher framework. You can toggle between Gemini Pro, GPT-4o, and Claude 3.5 Sonnet inside the top navbar or the chat configurations.",
      icon: Cpu
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-purple-400" />
          Documentation & Help
        </h1>
        <p className="text-slate-400 text-xs mt-1">Learn how to configure pipelines, build RAG indices, and prompt ACT.</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <GlassCard key={idx} className="flex gap-5 items-start">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <section.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white">{section.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{section.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
