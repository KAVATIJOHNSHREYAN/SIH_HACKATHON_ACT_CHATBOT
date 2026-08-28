"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Folder, FileText, Search, Star, Plus, Trash2, Copy, Download, 
  MoreVertical, FolderPlus, Upload, ArrowLeft, Tag, MessageSquare, 
  Zap, Brain, HardDrive, Cpu, X, Check, Edit2, Play, Eye, Grid, List, Pin
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import Link from "next/link";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  project: string;
  starred: boolean;
  tag: string;
  date: string;
  aiSummary: string;
  metadata: {
    resolution?: string;
    duration?: string;
    lines?: number;
    author?: string;
  };
  processingHistory: Array<{
    date: string;
    action: string;
    model: string;
    tokens: number;
    time: string;
  }>;
}

interface ProjectFolder {
  name: string;
  color: string;
  pinned: boolean;
}

const DEFAULT_PROJECTS: ProjectFolder[] = [
  { name: "AI Research", color: "#a855f7", pinned: true },
  { name: "College Notes", color: "#3b82f6", pinned: true },
  { name: "Hackathon", color: "#10b981", pinned: false },
  { name: "Finance", color: "#f59e0b", pinned: false },
  { name: "Legal", color: "#ef4444", pinned: false },
  { name: "Healthcare", color: "#ec4899", pinned: false },
  { name: "Marketing", color: "#06b6d4", pinned: false },
  { name: "Personal", color: "#64748b", pinned: false }
];

export default function AIKnowledgeHub() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [searchQuery, setSearchQuery] = useState("");
  const [semanticSearchActive, setSemanticSearchActive] = useState(false);
  const [filterStarred, setFilterStarred] = useState(false);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [projects, setProjects] = useState<ProjectFolder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Selected files for batch operations and chat
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [batchChatOpen, setBatchChatOpen] = useState(false);
  const [batchChatQuery, setBatchChatQuery] = useState("");
  const [batchChatResponse, setBatchChatResponse] = useState("");
  const [batchChatLoading, setBatchChatLoading] = useState(false);

  // File Details Drawer
  const [activeFileDetails, setActiveFileDetails] = useState<FileItem | null>(null);
  const [activeFileDetailsEditSummary, setActiveFileDetailsEditSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState("");
  const [customTagInput, setCustomTagInput] = useState("");

  // Upload indicator
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedFiles = localStorage.getItem("act_user_files");
      if (storedFiles) {
        setFiles(JSON.parse(storedFiles));
      } else {
        setFiles([]);
      }

      const storedProjects = localStorage.getItem("act_user_projects");
      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      } else {
        setProjects(DEFAULT_PROJECTS);
      }
    }
  }, []);

  const saveFilesState = (newFiles: FileItem[]) => {
    setFiles(newFiles);
    localStorage.setItem("act_user_files", JSON.stringify(newFiles));
  };

  const saveProjectsState = (newProjects: ProjectFolder[]) => {
    setProjects(newProjects);
    localStorage.setItem("act_user_projects", JSON.stringify(newProjects));
  };

  // Star & delete utilities
  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = files.map(f => f.id === id ? { ...f, starred: !f.starred } : f);
    saveFilesState(updated);
    if (activeFileDetails?.id === id) {
      setActiveFileDetails({ ...activeFileDetails, starred: !activeFileDetails.starred });
    }
  };

  const deleteFile = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = files.filter(f => f.id !== id);
    saveFilesState(updated);
    setActiveMenuId(null);
    if (activeFileDetails?.id === id) {
      setActiveFileDetails(null);
    }
    setSelectedFileIds(prev => prev.filter(fId => fId !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    processFiles(Array.from(uploaded));
  };

  const processFiles = async (fileList: File[]) => {
    setIsUploading(true);
    setUploadProgress(10);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadStage(`Parsing file format: ${file.name}`);
      setUploadProgress(Math.round(((i + 0.2) / fileList.length) * 100));
      await new Promise(r => setTimeout(r, 600));

      setUploadStage(`Generating semantic embeddings & AI summary: ${file.name}`);
      setUploadProgress(Math.round(((i + 0.7) / fileList.length) * 100));
      await new Promise(r => setTimeout(r, 600));

      const fileExtension = file.name.split('.').pop()?.toUpperCase() || "TXT";
      let autoTag = "General";
      if (["PDF", "DOCX", "TXT"].includes(fileExtension)) autoTag = "Research";
      else if (["PNG", "JPG", "JPEG", "WEBP"].includes(fileExtension)) autoTag = "Image";
      else if (["MP3", "WAV", "M4A"].includes(fileExtension)) autoTag = "Audio";
      else if (["MP4", "MOV", "AVI"].includes(fileExtension)) autoTag = "Video";
      else if (["JS", "TS", "PY", "GO", "CPP", "HTML", "CSS"].includes(fileExtension)) autoTag = "Programming";
      else if (["CSV", "XLSX"].includes(fileExtension)) autoTag = "Finance";

      const mockFile: FileItem = {
        id: Math.random().toString(),
        name: file.name,
        type: fileExtension,
        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
        project: currentProject || "AI Research",
        starred: false,
        tag: autoTag,
        date: new Date().toISOString().split('T')[0],
        aiSummary: `AI generated semantic outline of the document content. Contains indexed entities and references to support platform RAG queries.`,
        metadata: {
          author: "ACT Engine Pipeline",
          lines: fileExtension === "PDF" ? 45 : 120
        },
        processingHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            action: "Ingested & Indexed",
            model: "Gemini Pro",
            tokens: 380,
            time: "0.8s"
          }
        ]
      };

      setFiles(prev => {
        const updated = [mockFile, ...prev];
        localStorage.setItem("act_user_files", JSON.stringify(updated));
        return updated;
      });
    }

    setUploadProgress(100);
    setUploadStage("Completed successfully");
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 800);
  };

  // Folder / Project Actions
  const createProject = () => {
    const name = prompt("Enter project name:");
    if (name && !projects.some(p => p.name === name)) {
      const colors = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];
      const randColor = colors[Math.floor(Math.random() * colors.length)];
      const updated = [...projects, { name, color: randColor, pinned: false }];
      saveProjectsState(updated);
    }
  };

  const togglePinProject = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.map(p => p.name === name ? { ...p, pinned: !p.pinned } : p);
    saveProjectsState(updated);
  };

  const deleteProject = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete project: ${name}?`)) {
      const updated = projects.filter(p => p.name !== name);
      saveProjectsState(updated);
      if (currentProject === name) setCurrentProject(null);
    }
  };

  // Smart Search logic
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.aiSummary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStar = filterStarred ? file.starred : true;
    const matchesFolder = currentProject ? file.project === currentProject : true;
    const matchesTag = selectedTag ? file.tag === selectedTag : true;
    return matchesSearch && matchesStar && matchesFolder && matchesTag;
  });

  // Batch action executions
  const handleBatchStar = () => {
    const updated = files.map(f => selectedFileIds.includes(f.id) ? { ...f, starred: true } : f);
    saveFilesState(updated);
    setSelectedFileIds([]);
  };

  const handleBatchDelete = () => {
    if (confirm(`Delete ${selectedFileIds.length} selected files?`)) {
      const updated = files.filter(f => !selectedFileIds.includes(f.id));
      saveFilesState(updated);
      setSelectedFileIds([]);
    }
  };

  const handleBatchChat = async () => {
    if (!batchChatQuery.trim()) return;
    setBatchChatLoading(true);
    setBatchChatResponse("");

    const selectedFileObjects = files.filter(f => selectedFileIds.includes(f.id));
    const combinedTexts = selectedFileObjects.map(f => `[File: ${f.name}]\n${f.aiSummary}`).join("\n\n");

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const response = await ApiClient.postChat({
        messages: [{ role: "user", content: `${batchChatQuery}\n\nContext files summary:\n${combinedTexts}` }],
        files: [],
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
        useRAG: true
      });

      setBatchChatResponse(response.content);
    } catch (err: any) {
      console.error(err);
      setBatchChatResponse(err.message || "Failed to retrieve compiled RAG response.");
    } finally {
      setBatchChatLoading(false);
    }
  };

  // One-click file Action Pipeline Trigger
  const runFileAction = async (file: FileItem, actionLabel: string, systemPrompt: string) => {
    setActiveFileDetails(null);
    setIsUploading(true);
    setUploadStage(`Running quick action: ${actionLabel}...`);
    setUploadProgress(40);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const payload = {
        text: `[File Context] Name: ${file.name}\n${file.aiSummary}`,
        format: systemPrompt,
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      const result = await ApiClient.postTransform(payload);
      setUploadProgress(100);
      setUploadStage("Completed quick action");

      // Save output log history
      const historyItem = {
        date: new Date().toISOString().split('T')[0],
        action: actionLabel,
        model: "Gemini Pro",
        tokens: 300,
        time: "1.2s"
      };

      const updatedFiles = files.map(f => {
        if (f.id === file.id) {
          return {
            ...f,
            processingHistory: [historyItem, ...f.processingHistory],
            aiSummary: result.output || f.aiSummary
          };
        }
        return f;
      });
      saveFilesState(updatedFiles);

      alert(`Action '${actionLabel}' completed successfully! View transformed details in the file drawer.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to trigger AI workflow.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add custom tags
  const handleAddCustomTag = (fileId: string) => {
    if (!customTagInput.trim()) return;
    const updated = files.map(f => {
      if (f.id === fileId) {
        return { ...f, tag: customTagInput.trim() };
      }
      return f;
    });
    saveFilesState(updated);
    if (activeFileDetails) {
      setActiveFileDetails({ ...activeFileDetails, tag: customTagInput.trim() });
    }
    setCustomTagInput("");
  };

  // Move file to project
  const handleMoveFile = (fileId: string, projectName: string) => {
    const updated = files.map(f => {
      if (f.id === fileId) {
        return { ...f, project: projectName };
      }
      return f;
    });
    saveFilesState(updated);
    if (activeFileDetails) {
      setActiveFileDetails({ ...activeFileDetails, project: projectName });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* File input click handler */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            {currentProject && (
              <button 
                onClick={() => setCurrentProject(null)}
                className="p-1 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-white transition-all mr-1"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            {currentProject ? `Project: ${currentProject}` : "AI Knowledge Hub"}
          </h1>
          <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
            Store, organize, search and chat with every document, image, audio, video and code file using AI.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 shadow-sm rounded-xl" onClick={createProject}>
            <FolderPlus className="h-4 w-4 text-purple-400" />
            New Project
          </Button>
          <Button size="sm" className="flex items-center gap-1.5 shadow-sm rounded-xl bg-purple-600 hover:bg-purple-700" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 text-white" />
            Upload File
          </Button>
        </div>
      </div>

      {/* Upload progress notifier bar */}
      {isUploading && (
        <GlassCard className="p-4 border-purple-500/30 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>{uploadStage}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </GlassCard>
      )}

      {/* Layout Grid columns */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Stats & Projects Column */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Storage Capacity Widget */}
          <GlassCard className="border-slate-200 bg-white shadow-sm p-4 space-y-3.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4.5 w-4.5 text-purple-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textPrimary }}>Storage & Embeddings</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>Knowledge Base Size</span>
                <span>{files.length * 12} Embeddings</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full" style={{ width: `${Math.min(files.length * 5, 100)}%` }} />
              </div>
              <p className="text-[9px] text-slate-500">Includes semantic indexing for ChatGPT and Gemini RAG transformations.</p>
            </div>
          </GlassCard>

          {/* Tag filters */}
          <GlassCard className="border-slate-200 bg-white shadow-sm p-4 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">File Tag Filters</h2>
              {selectedTag && (
                <button onClick={() => setSelectedTag(null)} className="text-[9px] text-purple-400 font-semibold">Clear</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Finance", "Marketing", "Legal", "Research", "Healthcare", "Programming", "Image", "Audio", "Video"].map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-medium border transition-all ${
                    selectedTag === t 
                      ? "bg-purple-500/10 border-purple-500/40 text-purple-400 font-bold"
                      : "bg-white/5 border-slate-200/40 text-slate-400 hover:text-slate-200"
                  }`}
                  style={selectedTag === t ? { borderColor: T.primaryBright } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </GlassCard>

        </div>

        {/* Right workspace listings */}
        <div className="md:col-span-9 space-y-6">
          
          {/* Search bar + Semantic toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={semanticSearchActive ? "Enter concept, e.g., 'contracts mentioning liability'..." : "Search by file name or metadata..."}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              />
            </div>
            
            <button
              onClick={() => setSemanticSearchActive(!semanticSearchActive)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                semanticSearchActive 
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-400" 
                  : "bg-white/5 border-slate-200/40 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Brain className="h-4 w-4" />
              Semantic Search
            </button>
          </div>

          {/* Project Folders Listing */}
          {!currentProject && (
            <div className="space-y-3">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Folders</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {projects.map(p => (
                  <div
                    key={p.name}
                    onClick={() => setCurrentProject(p.name)}
                    className="p-4 rounded-2xl border text-left cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between h-28 relative group bg-white/20 dark:bg-slate-900/10"
                    style={{ borderColor: T.border }}
                  >
                    <div className="flex items-start justify-between">
                      <Folder className="h-8 w-8" style={{ color: p.color }} />
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => togglePinProject(p.name, e)}>
                          <Pin className={`h-3.5 w-3.5 ${p.pinned ? "text-yellow-500 fill-current" : "text-slate-400"}`} />
                        </button>
                        <button onClick={(e) => deleteProject(p.name, e)}>
                          <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{p.name}</h4>
                      <span className="text-[9px] text-slate-500">{files.filter(f => f.project === p.name).length} indexed files</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batch operations menu when items checked */}
          {selectedFileIds.length > 0 && (
            <GlassCard className="p-3 border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="text-[11px] font-bold text-purple-400">
                {selectedFileIds.length} files selected
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setBatchChatOpen(true)} className="text-[10px] py-1 bg-purple-600 hover:bg-purple-700">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat With Selected
                </Button>
                <Button size="sm" variant="outline" onClick={handleBatchStar} className="text-[10px] py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Star Selected
                </Button>
                <Button size="sm" variant="outline" onClick={handleBatchDelete} className="text-[10px] py-1 text-red-500 hover:bg-red-500/10">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete Selected
                </Button>
              </div>
            </GlassCard>
          )}

          {/* Files List / Grid view toggles and render list */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {currentProject ? `${currentProject} files` : "All Knowledge Base Documents"}
              </h2>
              <div className="flex gap-2 border p-0.5 rounded-lg" style={{ borderColor: T.border }}>
                <button onClick={() => setViewMode("grid")} className={`p-1 rounded-md ${viewMode === "grid" ? "bg-slate-500/10 text-white" : "text-slate-500"}`}>
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1 rounded-md ${viewMode === "list" ? "bg-slate-500/10 text-white" : "text-slate-500"}`}>
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="py-20 text-center text-slate-400 border rounded-2xl" style={{ borderColor: T.border }}>
                <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-xs font-semibold">No files indexed yet</p>
                <p className="text-[10px] text-slate-500">Drag files or browse directories to compile and transform.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-3 gap-6">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => {
                      setActiveFileDetails(file);
                      setEditSummaryText(file.aiSummary);
                    }}
                    className="p-4 rounded-2xl border bg-white/5 hover:border-purple-500/30 transition-all hover:scale-[1.01] flex flex-col justify-between h-48 cursor-pointer relative"
                    style={{ borderColor: T.border }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(file.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedFileIds([...selectedFileIds, file.id]);
                            else setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <button onClick={(e) => toggleStar(file.id, e)}>
                          <Star className={`h-4.5 w-4.5 ${file.starred ? "text-yellow-500 fill-current" : "text-slate-400"}`} />
                        </button>
                      </div>
                      <h4 className="text-xs font-bold truncate mb-1" style={{ color: T.textPrimary }}>{file.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-3 mb-2">{file.aiSummary}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: T.border }}>
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[8px] uppercase font-bold tracking-wider">{file.tag}</span>
                      <span className="text-[9px] text-slate-400">{file.size} • {file.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-slate-400 font-bold bg-white/5" style={{ borderColor: T.border }}>
                      <th className="py-3 px-4 w-8"></th>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Size</th>
                      <th className="py-3 px-2">Tag</th>
                      <th className="py-3 px-2">Project</th>
                      <th className="py-3 px-2">Created</th>
                      <th className="py-3 px-4 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-300" style={{ borderColor: T.border }}>
                    {filteredFiles.map(file => (
                      <tr 
                        key={file.id} 
                        onClick={() => {
                          setActiveFileDetails(file);
                          setEditSummaryText(file.aiSummary);
                        }}
                        className="hover:bg-slate-500/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedFileIds.includes(file.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedFileIds([...selectedFileIds, file.id]);
                              else setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-200">
                          <span className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                            {file.name}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{file.size}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                            {file.tag}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{file.project}</td>
                        <td className="py-3 px-2 text-slate-400">{file.date}</td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => deleteFile(file.id)} className="text-slate-500 hover:text-red-500 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* RAG Multi-File Chat Modal */}
      {batchChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="max-w-2xl w-full p-6 space-y-4 border-slate-200 bg-white" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500 animate-pulse" />
                <h3 className="text-sm font-bold" style={{ color: T.textPrimary }}>Multi-File RAG Chat Engine</h3>
              </div>
              <button onClick={() => setBatchChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-4 rounded-xl border space-y-3 font-mono text-[11px]" style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}>
              {batchChatResponse ? (
                <p className="white-space-pre-wrap">{batchChatResponse}</p>
              ) : (
                <p className="text-slate-500 italic text-center py-10">Select files, type your analysis query below, and run RAG compile.</p>
              )}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={batchChatQuery}
                onChange={(e) => setBatchChatQuery(e.target.value)}
                placeholder="Compare these PDFs, generate structured highlights..."
                className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none border shadow-sm"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              />
              <div className="flex justify-end gap-2.5">
                <Button variant="outline" size="sm" onClick={() => setBatchChatOpen(false)}>Close</Button>
                <Button size="sm" onClick={handleBatchChat} disabled={batchChatLoading} className="bg-purple-600 hover:bg-purple-700">
                  {batchChatLoading ? "Compiling..." : "Run RAG Query"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* File Details Sidebar Panel */}
      {activeFileDetails && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950/95 border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            
            {/* Header controls */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                <span className="text-xs font-bold text-white truncate max-w-[240px]">{activeFileDetails.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleStar(activeFileDetails.id)} className="p-1 hover:bg-white/5 rounded">
                  <Star className={`h-4.5 w-4.5 ${activeFileDetails.starred ? "text-yellow-500 fill-yellow-500" : "text-slate-400"}`} />
                </button>
                <button onClick={() => setActiveFileDetails(null)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Move to Project dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Move to Project</label>
              <select
                value={activeFileDetails.project}
                onChange={(e) => handleMoveFile(activeFileDetails.id, e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Custom Tag input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Active Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder={`Current: ${activeFileDetails.tag}`}
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none"
                />
                <Button size="sm" onClick={() => handleAddCustomTag(activeFileDetails.id)} className="px-2 py-1 text-[10px]">Set Tag</Button>
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">AI Knowledge Summary</label>
                {activeFileDetailsEditSummary ? (
                  <button
                    onClick={() => {
                      const updated = files.map(f => f.id === activeFileDetails.id ? { ...f, aiSummary: editSummaryText } : f);
                      saveFilesState(updated);
                      setActiveFileDetails({ ...activeFileDetails, aiSummary: editSummaryText });
                      setActiveFileDetailsEditSummary(false);
                    }}
                    className="text-[9px] text-emerald-400 font-bold"
                  >
                    Save
                  </button>
                ) : (
                  <button onClick={() => setActiveFileDetailsEditSummary(true)} className="text-[9px] text-purple-400 font-bold">Edit</button>
                )}
              </div>

              {activeFileDetailsEditSummary ? (
                <textarea
                  value={editSummaryText}
                  onChange={(e) => setEditSummaryText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/10 bg-slate-900 text-white text-xs leading-normal focus:outline-none focus:border-purple-500 h-28"
                />
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">{activeFileDetails.aiSummary}</p>
              )}
            </div>

            {/* One-Click Quick Actions Mapped by Type */}
            <div className="space-y-3.5">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block border-b border-white/10 pb-1">One-Click AI Transformations</label>
              
              <div className="grid grid-cols-2 gap-2">
                {/* PDF/DOCX Actions */}
                {["PDF", "DOCX", "TXT"].includes(activeFileDetails.type) && (
                  <>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Executive Summary", "Summary (Generate a concise professional summary)")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Executive Summary
                    </button>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Study Notes", "Structured Notes (Reorganize text into comprehensive study notes)")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Study Notes
                    </button>
                  </>
                )}

                {/* Video Actions */}
                {["MP4", "MOV", "AVI", "MKV", "WEBM"].includes(activeFileDetails.type) && (
                  <>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Video Summary", "Generate a concise professional summary of this uploaded video including key events, discussions and conclusions.")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Video Summary
                    </button>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Timeline", "Create an chronological summary with timestamp tags")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Video Timeline
                    </button>
                  </>
                )}

                {/* Image Actions */}
                {["PNG", "JPG", "JPEG", "WEBP"].includes(activeFileDetails.type) && (
                  <>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Image OCR", "Extract all visible text preserving formatting.")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Extract Text (OCR)
                    </button>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Translate Image", "Extract all text and translate it cleanly to English.")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Translate Image
                    </button>
                  </>
                )}

                {/* Code Actions */}
                {["JS", "TS", "PY", "GO", "CPP", "HTML", "CSS"].includes(activeFileDetails.type) && (
                  <>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Explain Code", "Explain Code (Provide a detailed semantic walkthrough of this codebase and functions)")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Explain Code
                    </button>
                    <button
                      onClick={() => runFileAction(activeFileDetails, "Generate Tests", "Generate complete robust unit test cases for the functions")}
                      className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left"
                    >
                      <Zap className="h-3 w-3" />
                      Generate Tests
                    </button>
                  </>
                )}

                <Link
                  href="/chat"
                  className="px-3 py-2 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 text-purple-300 text-[10px] font-bold flex items-center gap-1.5 transition-all text-left col-span-2 justify-center"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Open in AI Chat Workspace
                </Link>
              </div>
            </div>

            {/* Processing History log */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block border-b border-white/10 pb-1">AI Processing History</label>
              <div className="space-y-2 font-mono text-[9px] text-slate-400">
                {activeFileDetails.processingHistory.map((hist, idx) => (
                  <div key={idx} className="flex justify-between border-b border-white/5 pb-1">
                    <span>{hist.date} • {hist.action} ({hist.model})</span>
                    <span>{hist.tokens} tkn • {hist.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-white/10 flex justify-between gap-3 mt-6">
            <button
              onClick={() => deleteFile(activeFileDetails.id)}
              className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold flex-1 transition-all"
            >
              Delete
            </button>
            <button
              onClick={() => {
                const blob = new Blob([activeFileDetails.aiSummary], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `AI_Summary_${activeFileDetails.name}.txt`;
                a.click();
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-750 text-white text-xs font-bold flex-1 transition-all"
            >
              Download Summary
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
