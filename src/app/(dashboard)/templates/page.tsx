"use client";

import React, { useState } from "react";
import { Sparkles, FileText, Zap, BookOpen, HeartPulse, Scale, Code, Megaphone, Folder } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

const TEMPLATES = [
  { id: 1, category: "Business", title: "Executive Report Summarizer", desc: "Transforms long business decks and reports into action matrices.", icon: FileText },
  { id: 2, category: "Legal", title: "Plain English Contract Simplifier", desc: "Translates dense contractual clauses and legalese into bulleted risks.", icon: Scale },
  { id: 3, category: "Education", title: "Syllabus to Study Flashcards", desc: "Generates memory flashcard decks directly from syllabus PDFs.", icon: BookOpen },
  { id: 4, category: "Healthcare", title: "Medical Chart Digest", desc: "Creates a readable patient history summary from clinical logs.", icon: HeartPulse },
  { id: 5, category: "Software Development", title: "Code API Documenter", desc: "Reads source code files and generates API documentation schemas.", icon: Code },
  { id: 6, category: "Marketing", title: "Press Release to Twitter Threads", desc: "Compresses marketing announcements into styled social media threads.", icon: Megaphone },
];

const CATEGORIES = ["All", "Business", "Legal", "Education", "Healthcare", "Software Development", "Marketing"];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredTemplates = activeCategory === "All" 
    ? TEMPLATES 
    : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Transformation Templates</h1>
        <p className="text-slate-400 text-xs mt-1">Pre-configured transformation templates mapped by target industry needs.</p>
      </div>

      {/* Category selector row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              activeCategory === cat
                ? "bg-purple-600/15 border-purple-500/30 text-white shadow-lg shadow-purple-500/5"
                : "bg-slate-900/60 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredTemplates.map((tpl) => (
          <GlassCard key={tpl.id} className="flex flex-col justify-between h-56">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-400 text-[9px] uppercase tracking-wider font-semibold">
                  {tpl.category}
                </span>
                <tpl.icon className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{tpl.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{tpl.desc}</p>
            </div>
            
            <Button variant="outline" size="sm" className="w-full mt-4 text-[10px] py-2">
              Activate Template
              <Zap className="ml-1.5 h-3.5 w-3.5 fill-current" />
            </Button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
