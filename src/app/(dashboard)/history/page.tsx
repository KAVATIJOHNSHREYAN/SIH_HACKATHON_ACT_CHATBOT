"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  History, FileText, Download, Trash2, Search, Calendar, Filter, ArrowUpDown, 
  ChevronLeft, ChevronRight, Share2, RefreshCw, Pin, Star, CheckCircle, AlertOctagon, 
  ExternalLink, FileSpreadsheet, FileDown
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

interface HistoryRecord {
  id: string;
  userId: string;
  userEmail: string;
  projectId?: string;
  projectName?: string;
  sourceFileName: string;
  fileType: string;
  transformationType: string;
  modelUsed: string;
  processingTime: number; // in ms
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  fileSize: number; // in bytes
  status: "Success" | "Failed" | "Processing";
  createdAt: string;
  downloadUrl?: string;
  previewUrl?: string;
  favorite: boolean;
}

export default function HistoryPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;
  const router = useRouter();

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected for bulk deletion
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Persistent user history records
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  // Load user specific history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history");
      if (historyStr) {
        try {
          const parsed = JSON.parse(historyStr);
          if (Array.isArray(parsed)) {
            setRecords(parsed);
          }
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }
    }
  }, []);

  const saveRecords = (updated: HistoryRecord[]) => {
    setRecords(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("act_transform_history", JSON.stringify(updated));
    }
  };

  // ─── Actions ──────────────────────────────────────────────────────────────

  const toggleFavorite = (id: string) => {
    const updated = records.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r);
    saveRecords(updated);
  };

  const deleteSingle = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    saveRecords(updated);
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  const deleteBulk = () => {
    if (selectedIds.length === 0) return;
    const updated = records.filter(r => !selectedIds.includes(r.id));
    saveRecords(updated);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredRecords();
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(r => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Re-run transformation (navigates to the workspace with presets loaded)
  const retryTransformation = (record: HistoryRecord) => {
    let route = "/transform/pdf";
    if (record.fileType.toLowerCase().includes("audio") || record.fileType.toLowerCase().includes("mp3")) {
      route = "/transform/audio";
    } else if (record.fileType.toLowerCase().includes("video") || record.fileType.toLowerCase().includes("mp4")) {
      route = "/transform/video";
    } else if (record.fileType.toLowerCase().includes("png") || record.fileType.toLowerCase().includes("jpg")) {
      route = "/transform/ocr";
    } else if (record.transformationType.toLowerCase().includes("code")) {
      route = "/transform/code";
    }

    router.push(`${route}?preset=${encodeURIComponent(record.transformationType)}&prompt=Retry&run=true`);
  };

  // Export history in CSV format
  const exportCSV = () => {
    const headers = [
      "ID", "Source File", "Transformation Type", "Model", 
      "Status", "Processing Time (ms)", "Total Tokens", "Created At"
    ];
    const rows = records.map(r => [
      r.id, r.sourceFileName, r.transformationType, r.modelUsed,
      r.status, r.processingTime, r.totalTokens, r.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `act_transformation_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper date calculators
  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isThisWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  const isThisMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Filter & Sort Pipeline
  const getFilteredRecords = () => {
    let result = [...records];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        r.sourceFileName.toLowerCase().includes(q) || 
        r.transformationType.toLowerCase().includes(q) ||
        r.modelUsed.toLowerCase().includes(q)
      );
    }

    // Date filters
    if (dateFilter === "today") {
      result = result.filter(r => isToday(r.createdAt));
    } else if (dateFilter === "week") {
      result = result.filter(r => isThisWeek(r.createdAt));
    } else if (dateFilter === "month") {
      result = result.filter(r => isThisMonth(r.createdAt));
    }

    // Type filters
    if (typeFilter !== "all") {
      result = result.filter(r => r.fileType === typeFilter);
    }

    // Project filters
    if (projectFilter !== "all") {
      result = result.filter(r => r.projectId === projectFilter);
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return result;
  };

  const filtered = getFilteredRecords();
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Categories list for filter dropdown
  const uniqueFileTypes = Array.from(new Set(records.map(r => r.fileType)));
  const uniqueProjects = Array.from(new Set(records.filter(r => r.projectId && r.projectName).map(r => JSON.stringify({ id: r.projectId, name: r.projectName }))));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: T.border }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <History className="h-6 w-6 text-purple-500" />
            Transformation History
          </h1>
          <p className="text-slate-500 text-xs mt-1">Audit log of completed transformations, metrics, and token usages.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline" 
            onClick={exportCSV}
            className="text-[10px] py-1.5 px-3 bg-slate-900 border-white/5 text-slate-300 hover:bg-white/5"
            disabled={records.length === 0}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>

          {selectedIds.length > 0 && (
            <Button 
              onClick={deleteBulk}
              className="text-[10px] py-1.5 px-3 bg-red-600 hover:bg-red-750 text-white"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Filter and search bar section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* Search */}
        <div className="relative md:col-span-4">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search by file name or action..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm bg-slate-900"
            style={{ borderColor: T.border, color: T.textPrimary }}
          />
        </div>

        {/* Date Filter */}
        <div className="md:col-span-2">
          <select
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value as any); setCurrentPage(1); }}
            className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm bg-slate-900 text-slate-200"
            style={{ borderColor: T.border }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* File Type Filter */}
        <div className="md:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm bg-slate-900 text-slate-200"
            style={{ borderColor: T.border }}
          >
            <option value="all">All File Types</option>
            {uniqueFileTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Project Filter */}
        <div className="md:col-span-2">
          <select
            value={projectFilter}
            onChange={(e) => { setProjectFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm bg-slate-900 text-slate-200"
            style={{ borderColor: T.border }}
          >
            <option value="all">All Projects</option>
            {uniqueProjects.map(projStr => {
              const proj = JSON.parse(projStr);
              return <option key={proj.id} value={proj.id}>{proj.name}</option>;
            })}
          </select>
        </div>

        {/* Sort Order */}
        <div className="md:col-span-2">
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs border bg-slate-900 text-slate-200 hover:border-purple-500/30 transition-all"
            style={{ borderColor: T.border }}
          >
            <span>Sort: {sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
            <ArrowUpDown className="h-3.5 w-3.5 text-purple-400" />
          </button>
        </div>

      </div>

      {/* History table list */}
      <GlassCard className="p-0 border-slate-200 bg-white shadow-sm overflow-hidden" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
        {paginated.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <History className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400">No transformation history logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold bg-slate-950/40" style={{ borderColor: T.border }}>
                  <th className="py-3 px-4 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </th>
                  <th className="py-3 px-4 w-10">Pin</th>
                  <th className="py-3.5 px-4">Source Item</th>
                  <th className="py-3.5 px-3">Pipeline Action</th>
                  <th className="py-3.5 px-3">AI Model</th>
                  <th className="py-3.5 px-3">Latency</th>
                  <th className="py-3.5 px-3">Tokens Used</th>
                  <th className="py-3.5 px-3">Created At</th>
                  <th className="py-3.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-300" style={{ borderColor: T.border }}>
                {paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelectOne(item.id)}
                        className="rounded border-slate-700 bg-slate-900"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => toggleFavorite(item.id)}>
                        <Star className={`h-4 w-4 ${item.favorite ? "text-amber-400 fill-amber-400" : "text-slate-500"}`} />
                      </button>
                    </td>
                    <td className="py-4 px-4 font-semibold text-white">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                        <span className="truncate max-w-xs">{item.sourceFileName}</span>
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-200">{item.transformationType}</td>
                    <td className="py-4 px-3 font-mono text-[10px] text-slate-400">{item.modelUsed}</td>
                    <td className="py-4 px-3 text-slate-400">{(item.processingTime / 1000).toFixed(2)}s</td>
                    <td className="py-4 px-3 text-cyan-400 font-mono font-bold">{item.totalTokens.toLocaleString()}</td>
                    <td className="py-4 px-3 text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right space-x-1.5">
                      <button 
                        onClick={() => retryTransformation(item)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all inline-flex"
                        title="Retry transformation preset"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteSingle(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all inline-flex"
                        title="Delete log"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Showing page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-xl bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-900 hover:bg-white/5 transition-all"
              style={{ borderColor: T.border }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-xl bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-900 hover:bg-white/5 transition-all"
              style={{ borderColor: T.border }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
