"use client";

import React, { useState, useEffect } from "react";
import { History, FileText, Download, Trash2, Search, Calendar } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface JobItem {
  id: number;
  file: string;
  action: string;
  date: string;
  tokens: string;
  status: string;
  model?: string;
  latency?: string;
  outputs?: string;
  downloads?: number;
  timestamp?: string;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<JobItem[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history");
      if (historyStr) {
        setJobs(JSON.parse(historyStr));
      } else {
        // Fallback to starter set if no history exists yet
        const defaultJobs = [
          { id: 1, file: "Quarterly_Statement_Q2.pdf", action: "PDF to Summary", date: "2026-08-20", tokens: "450", status: "Completed" },
          { id: 2, file: "Client_Feedback_Call.mp3", action: "Audio to Transcript", date: "2026-08-22", tokens: "1,200", status: "Completed" },
          { id: 3, file: "LinkedIn Post Generation", action: "Text to Social Media", date: "2026-08-18", tokens: "120", status: "Completed" },
          { id: 4, file: "Invoice_Scan_9921.jpg", action: "OCR to Structured Data", date: "2026-08-15", tokens: "280", status: "Completed" },
        ];
        setJobs(defaultJobs);
      }
    }
  }, []);

  const filteredJobs = jobs.filter(j => j.file.toLowerCase().includes(search.toLowerCase()) || j.action.toLowerCase().includes(search.toLowerCase()));

  const clearJob = (id: number) => {
    const updated = jobs.filter(j => j.id !== id);
    setJobs(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("act_transform_history", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-purple-600" />
            Transformation History
          </h1>
          <p className="text-slate-600 text-xs mt-1">Audit trail of completed transformations, outputs, and tokens consumed.</p>
        </div>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
          <Search className="h-4.5 w-4.5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search history by file name or action..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
        />
      </div>

      <GlassCard className="p-0 border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <History className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-600">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-600 font-bold bg-slate-50">
                  <th className="py-3.5 px-6">Source Item</th>
                  <th className="py-3.5 px-2">Pipeline Action</th>
                  <th className="py-3.5 px-2">Model</th>
                  <th className="py-3.5 px-2">Outputs</th>
                  <th className="py-3.5 px-2">Latency</th>
                  <th className="py-3.5 px-2">Downloads</th>
                  <th className="py-3.5 px-2">Tokens Used</th>
                  <th className="py-3.5 px-2">Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        {job.file}
                      </span>
                    </td>
                    <td className="py-4 px-2 truncate max-w-[150px]">{job.action}</td>
                    <td className="py-4 px-2">{job.model || "Gemini Pro"}</td>
                    <td className="py-4 px-2 truncate max-w-[120px]" title={job.outputs}>{job.outputs || "Single"}</td>
                    <td className="py-4 px-2 text-slate-500 font-mono">{job.latency || "N/A"}</td>
                    <td className="py-4 px-2 font-bold">{job.downloads || 0}</td>
                    <td className="py-4 px-2 text-cyan-700 font-mono font-bold">{job.tokens}</td>
                    <td className="py-4 px-2 text-slate-500">{job.date}</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all">
                        <Download className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => clearJob(job.id)}
                        className="p-1.5 text-slate-400 hover:text-red-650 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
