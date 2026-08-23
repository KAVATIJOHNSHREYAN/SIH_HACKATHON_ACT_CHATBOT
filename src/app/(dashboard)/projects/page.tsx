"use client";

import React, { useState } from "react";
import { FolderGit2, Calendar, FileCheck, Layers, Plus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([
    { id: 1, name: "Acme Compliance Audit", files: 12, tokens: "420K", date: "2026-08-20", desc: "Compliance and clause validation audit for standard SLA agreements." },
    { id: 2, name: "Market Feedback Briefings", files: 5, tokens: "150K", date: "2026-08-18", desc: "Transcription and tone conversion for recorded client feedback calls." },
    { id: 3, name: "Medical Research Paper Index", files: 8, tokens: "980K", date: "2026-08-12", desc: "Research summaries and structured database outputs from medical journals." },
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-slate-400 text-xs mt-1">Group files and transformations into workspaces with unified RAG contexts.</p>
        </div>
        <Button size="sm" className="flex items-center gap-1.5" onClick={() => {
          const newProj = {
            id: Math.random(),
            name: "New Workspace Project " + Math.floor(Math.random() * 10),
            files: 0,
            tokens: "0K",
            date: new Date().toISOString().split('T')[0],
            desc: "New content transformation project folder."
          };
          setProjects(prev => [...prev, newProj]);
        }}>
          <Plus className="h-4.5 w-4.5" />
          Create Project
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {projects.map((project) => (
          <GlassCard key={project.id} className="flex flex-col justify-between h-60">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FolderGit2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{project.name}</h3>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">{project.desc}</p>
            </div>

            <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><FileCheck className="h-3.5 w-3.5 text-purple-400" /> {project.files} Files</span>
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5 text-cyan-400" /> {project.tokens} Tokens</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {project.date}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
