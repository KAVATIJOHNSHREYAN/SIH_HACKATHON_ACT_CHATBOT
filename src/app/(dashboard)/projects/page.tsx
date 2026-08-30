"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FolderGit2, Calendar, FileCheck, Layers, Plus, ArrowLeft, Search, 
  Star, Pin, Trash2, X, MessageSquare, Upload, Cpu, Download, 
  Copy, Check, FileText, Zap, Brain, Edit2, Play, Users, BarChart3, 
  Settings, History, List, Grid, ChevronRight, AlertCircle, Sparkles, 
  Mic, MicOff, User, Bot, Send, Shield, Info, Database, Eye, RefreshCcw, Share2, MoreVertical
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import Link from "next/link";

interface ActivityLog {
  id: string;
  type: string;
  detail: string;
  date: string;
}

interface GeneratedOutput {
  id: string;
  title: string;
  content: string;
  date: string;
  preset: string;
}

interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: "Uploading" | "Processing" | "OCR" | "Embedding" | "Indexed" | "Ready";
  chunksCount: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    time: string;
  }>;
}

interface Project {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: string;
  tags: string[];
  privacy: "Private" | "Team";
  model: string;
  language: string;
  date: string;
  owner: string;
  status: "Active" | "Archived" | "Completed";
  progress: number;
  starred: boolean;
  shared: boolean;
  filesCount: number;
  tokensUsed: string;
  storageUsed: string;
  pinned: boolean;
  files: ProjectFile[];
  chatHistory: ChatSession[];
  outputs: GeneratedOutput[];
  history: ActivityLog[];
}

const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj_acme",
    name: "Acme Compliance Audit",
    desc: "Compliance and clause validation audit for standard SLA agreements.",
    icon: "Briefcase",
    color: "#a855f7",
    category: "Business",
    tags: ["Legal", "SLA", "Audit"],
    privacy: "Private",
    model: typeof window !== "undefined" ? localStorage.getItem("act_selected_model") || "Gemini Pro" : "Gemini Pro",
    language: "English",
    date: "2026-08-20",
    owner: "Admin Owner",
    status: "Active",
    progress: 85,
    starred: true,
    shared: false,
    filesCount: 3,
    tokensUsed: "420K",
    storageUsed: "12.4 MB",
    pinned: true,
    files: [
      { id: "file_acme_1", name: "SLA_Contract_Draft.pdf", type: "PDF", size: "8.2 MB", date: "2026-08-20", status: "Ready", chunksCount: 142 },
      { id: "file_acme_2", name: "Acme_SLA_Guidelines.docx", type: "DOCX", size: "3.1 MB", date: "2026-08-19", status: "Ready", chunksCount: 68 },
      { id: "file_acme_3", name: "Audit_Checklist.txt", type: "TXT", size: "1.1 MB", date: "2026-08-20", status: "Ready", chunksCount: 24 }
    ],
    chatHistory: [
      {
        id: "chat_acme_1",
        title: "Initial Compliance Query",
        messages: [
          { id: "msg_1", role: "assistant", content: "Hi, I have loaded the Acme compliance guidelines. You can query liabilities or timeline details.", time: "10:30 AM" }
        ]
      }
    ],
    outputs: [
      { id: "out_acme_1", title: "Compliance Risk Assessment Matrix", content: "### Acme Compliance Audit Summary\n\n1. **Liability Cap**: Section 12.4 sets liability limits to 1.5x yearly fees.\n2. **Termination SLAs**: 30-day notice period is standard, but Acme draft requests 90 days.\n3. **Recommendation**: Request revision of notice period to 45 days.", date: "2026-08-20", preset: "Executive Summary" }
    ],
    history: [
      { id: "hist_1", type: "Upload", detail: "Uploaded SLA_Contract_Draft.pdf", date: "2026-08-20" },
      { id: "hist_2", type: "AI Transform", detail: "Compiled Compliance Risk Assessment Matrix", date: "2026-08-20" }
    ]
  },
  {
    id: "proj_market",
    name: "Market Feedback Briefings",
    desc: "Transcription and tone conversion for recorded client feedback calls.",
    icon: "Megaphone",
    color: "#3b82f6",
    category: "Marketing",
    tags: ["Feedback", "Transcription", "Customer"],
    privacy: "Team",
    model: "GPT-4o",
    language: "English",
    date: "2026-08-18",
    owner: "Admin Owner",
    status: "Active",
    progress: 60,
    starred: false,
    shared: true,
    filesCount: 2,
    tokensUsed: "150K",
    storageUsed: "22.5 MB",
    pinned: false,
    files: [
      { id: "file_mkt_1", name: "Feedback_Call_Aug18.mp3", type: "MP3", size: "18.4 MB", date: "2026-08-18", status: "Ready", chunksCount: 312 },
      { id: "file_mkt_2", name: "Meeting_Brief.txt", type: "TXT", size: "4.1 KB", date: "2026-08-18", status: "Ready", chunksCount: 8 }
    ],
    chatHistory: [
      {
        id: "chat_mkt_1",
        title: "Product UI feedback analysis",
        messages: [
          { id: "msg_mkt_1", role: "assistant", content: "Feedback audio loaded. Highlights indicate core concerns are UI loading speed and template customization.", time: "2:15 PM" }
        ]
      }
    ],
    outputs: [],
    history: [
      { id: "hist_mkt_1", type: "Upload", detail: "Uploaded Feedback_Call_Aug18.mp3", date: "2026-08-18" }
    ]
  }
];

export default function AIWorkspaceManager() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Local storage lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Filters and searches
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<"All" | "Recent" | "Favorites" | "Shared" | "Archived">("All");
  const [sortBy, setSortBy] = useState<"name" | "date" | "progress">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Create Project Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjColor, setNewProjColor] = useState("#a855f7");
  const [newProjCategory, setNewProjCategory] = useState("Business");
  const [newProjModel, setNewProjModel] = useState("Gemini Pro");
  const [newProjLanguage, setNewProjLanguage] = useState("English");
  const [newProjPrivacy, setNewProjPrivacy] = useState<"Private" | "Team">("Private");
  const [newProjEnableRag, setNewProjEnableRag] = useState(true);

  // Tabs inside specific workspace
  const [activeTab, setActiveTab] = useState<"Files" | "AI Workspace" | "Chats" | "Generated Outputs" | "Knowledge Base" | "Analytics" | "Activity" | "Settings">("Files");

  // AI Workspace Prompt and response states
  const [workspacePrompt, setWorkspacePrompt] = useState("");
  const [workspaceResponse, setWorkspaceResponse] = useState("");
  const [workspaceAiLoading, setWorkspaceAiLoading] = useState(false);

  // Chats tab states
  const [selectedChatSessionId, setSelectedChatSessionId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Quick Action execution trigger on files
  const [quickActionPreset, setQuickActionPreset] = useState("summary");
  const [quickActionFileId, setQuickActionFileId] = useState("");
  const [quickActionCustomPrompt, setQuickActionCustomPrompt] = useState("");

  // Upload hooks
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load datasets on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_assistant_projects_workspace_details");
      if (stored) {
        setProjects(JSON.parse(stored));
      } else {
        setProjects(DEFAULT_PROJECTS);
        localStorage.setItem("act_assistant_projects_workspace_details", JSON.stringify(DEFAULT_PROJECTS));
      }
    }
  }, []);

  const saveProjects = (updated: Project[]) => {
    setProjects(updated);
    localStorage.setItem("act_assistant_projects_workspace_details", JSON.stringify(updated));
  };

  const handleCreateProject = () => {
    if (!newProjName.trim()) {
      alert("Please provide a valid project name.");
      return;
    }

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: newProjName,
      desc: newProjDesc || "AI Knowledge base context folder.",
      icon: "FolderGit2",
      color: newProjColor,
      category: newProjCategory,
      tags: [newProjCategory],
      privacy: newProjPrivacy,
      model: newProjModel,
      language: newProjLanguage,
      date: new Date().toISOString().split('T')[0],
      owner: "Admin Owner",
      status: "Active",
      progress: 5,
      starred: false,
      shared: newProjPrivacy === "Team",
      filesCount: 0,
      tokensUsed: "0K",
      storageUsed: "0 MB",
      pinned: false,
      files: [],
      chatHistory: [
        {
          id: `chat_session_${Date.now()}`,
          title: "General Workspace Chat",
          messages: [
            { id: `wel_${Date.now()}`, role: "assistant", content: `Welcome to ${newProjName} AI Workspace. Index documents to begin RAG search.`, time: "Just now" }
          ]
        }
      ],
      outputs: [],
      history: [
        { id: `hist_${Date.now()}`, type: "System", detail: `Project Workspace ${newProjName} created.`, date: new Date().toISOString().split('T')[0] }
      ]
    };

    const updated = [newProject, ...projects];
    saveProjects(updated);

    // Reset fields
    setNewProjName("");
    setNewProjDesc("");
    setCreateModalOpen(false);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to permanently delete this project workspace and all indexed assets?")) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
    }
  };

  const toggleStarProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.map(p => p.id === id ? { ...p, starred: !p.starred } : p);
    saveProjects(updated);
    if (activeProject?.id === id) {
      setActiveProject({ ...activeProject, starred: !activeProject.starred });
    }
  };

  const toggleShareProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.map(p => p.id === id ? { ...p, shared: !p.shared } : p);
    saveProjects(updated);
    if (activeProject?.id === id) {
      setActiveProject({ ...activeProject, shared: !activeProject.shared });
    }
  };

  // Upload workspace files & transition status
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded && activeProject) {
      processWorkspaceUpload(Array.from(uploaded));
    }
  };

  const processWorkspaceUpload = async (fileList: File[]) => {
    if (!activeProject) return;
    setIsUploading(true);
    setUploadProgress(10);

    const targetProjFiles = [...activeProject.files];
    const targetProjHistory = [...activeProject.history];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const fileId = `file_${Date.now()}_${i}`;
      const ext = file.name.split('.').pop()?.toUpperCase() || "TXT";

      const baseFile: ProjectFile = {
        id: fileId,
        name: file.name,
        type: ext,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0],
        status: "Uploading",
        chunksCount: 0
      };
      
      // Simulating real-time AI indexation pipeline states
      targetProjFiles.push(baseFile);
      setActiveProject({ ...activeProject, files: targetProjFiles });

      const stages: Array<ProjectFile["status"]> = ["Processing", "OCR", "Embedding", "Indexed", "Ready"];
      for (let sIdx = 0; sIdx < stages.length; sIdx++) {
        setUploadStage(`[${file.name}] Step ${sIdx + 1}/5: ${stages[sIdx]}`);
        setUploadProgress(Math.round(((i + (sIdx + 1) / stages.length) / fileList.length) * 100));
        await new Promise(r => setTimeout(r, 450));

        // Update individual file status dynamically
        const fileRef = targetProjFiles.find(f => f.id === fileId);
        if (fileRef) {
          fileRef.status = stages[sIdx];
          if (stages[sIdx] === "Ready") {
            fileRef.chunksCount = Math.floor(Math.random() * 50) + 15;
          }
        }
        setActiveProject({ ...activeProject, files: [...targetProjFiles] });
      }

      targetProjHistory.push({
        id: `hist_${Date.now()}_${i}`,
        type: "Upload",
        detail: `Indexed ${file.name} to RAG Knowledge Base`,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const updatedProjObj: Project = {
      ...activeProject,
      files: targetProjFiles,
      history: targetProjHistory,
      filesCount: targetProjFiles.length,
      progress: Math.min(activeProject.progress + 15, 100),
      storageUsed: `${(parseFloat(activeProject.storageUsed) + fileList.length * 2.1).toFixed(1)} MB`
    };

    const updatedList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
    saveProjects(updatedList);
    setActiveProject(updatedProjObj);

    setIsUploading(false);
    setUploadProgress(0);
  };

  const removeWorkspaceFile = (fileId: string) => {
    if (!activeProject) return;
    const file = activeProject.files.find(f => f.id === fileId);
    const updatedFiles = activeProject.files.filter(f => f.id !== fileId);
    const updatedHistory = [
      {
        id: `hist_${Date.now()}`,
        type: "Delete",
        detail: `Purged indexed file ${file?.name || "Unknown"}`,
        date: new Date().toISOString().split('T')[0]
      },
      ...activeProject.history
    ];

    const updatedProjObj = {
      ...activeProject,
      files: updatedFiles,
      history: updatedHistory,
      filesCount: updatedFiles.length
    };

    const updatedList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
    saveProjects(updatedList);
    setActiveProject(updatedProjObj);
  };

  // Rebuild embeddings RAG health action
  const rebuildEmbeddings = async () => {
    if (!activeProject) return;
    setIsUploading(true);
    setUploadStage("Re-embedding all document layout schemas...");
    setUploadProgress(25);
    await new Promise(r => setTimeout(r, 600));

    setUploadProgress(65);
    setUploadStage("Vectorizing text chunks & mapping metadata...");
    await new Promise(r => setTimeout(r, 600));

    setUploadProgress(100);
    setUploadStage("Vector store rebuild completed successfully");
    await new Promise(r => setTimeout(r, 400));
    setIsUploading(false);
    setUploadProgress(0);

    alert("RAG Knowledge base embeddings rebuilt successfully!");
  };

  // Tab: AI Workspace dedicated queries
  const handleWorkspaceQuery = async () => {
    if (!workspacePrompt.trim() || !activeProject) return;
    setWorkspaceAiLoading(true);
    setWorkspaceResponse("");

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const fileDetailsText = activeProject.files.map(f => `- ${f.name} (${f.type}, ${f.chunksCount} chunks)`).join("\n");

      const payload = {
        text: `[Active Project context: ${activeProject.name}]\n[Knowledge base files]:\n${fileDetailsText}\n\nUser Query: ${workspacePrompt}`,
        format: "Transform summary layout with structured markdown highlights.",
        model: activeProject.model,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null
      };

      const response = await ApiClient.postTransform(payload);
      setWorkspaceResponse(response.output || "No output compiled.");

      // Save as generated report outputs
      const newOutput: GeneratedOutput = {
        id: `out_${Date.now()}`,
        title: `Workspace Query - ${workspacePrompt.slice(0, 30)}...`,
        content: response.output || "",
        date: new Date().toISOString().split('T')[0],
        preset: "Custom Prompt"
      };

      const updatedProjObj = {
        ...activeProject,
        outputs: [newOutput, ...activeProject.outputs],
        history: [{ id: `hist_rag_${Date.now()}`, type: "AI Transform", detail: `Ran Workspace Prompt: "${workspacePrompt.slice(0, 20)}..."`, date: new Date().toISOString().split('T')[0] }, ...activeProject.history]
      };

      const updatedList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
      saveProjects(updatedList);
      setActiveProject(updatedProjObj);

    } catch (err: any) {
      console.error(err);
      setWorkspaceResponse(err.message || "Failed to process RAG project pipeline query.");
    } finally {
      setWorkspaceAiLoading(false);
    }
  };

  // Chats Tab: Send messages inside selected chat session
  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeProject) return;
    const sessionList = [...activeProject.chatHistory];
    let activeSession = sessionList.find(s => s.id === selectedChatSessionId);

    if (!activeSession) {
      activeSession = {
        id: `chat_session_${Date.now()}`,
        title: chatInput.slice(0, 25),
        messages: []
      };
      sessionList.push(activeSession);
      setSelectedChatSessionId(activeSession.id);
    }

    const userMsg = {
      id: `msg_${Date.now()}`,
      role: "user" as const,
      content: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    activeSession.messages.push(userMsg);
    setChatInput("");

    // Optimistic trigger
    setActiveProject({ ...activeProject, chatHistory: sessionList });

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const response = await ApiClient.postChat({
        messages: activeSession.messages.map(m => ({ role: m.role, content: m.content })),
        files: [],
        model: activeProject.model,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
        useRAG: true
      });

      const assistantMsg = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant" as const,
        content: response.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      activeSession.messages.push(assistantMsg);

      const updatedProjObj = {
        ...activeProject,
        chatHistory: sessionList,
        history: [{ id: `hist_chat_${Date.now()}`, type: "AI Chat", detail: `Sent chat query: "${userMsg.content.slice(0, 20)}..."`, date: new Date().toISOString().split('T')[0] }, ...activeProject.history]
      };

      const updatedList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
      saveProjects(updatedList);
      setActiveProject(updatedProjObj);

    } catch (err: any) {
      console.error(err);
      const errMsg = {
        id: `msg_err_${Date.now()}`,
        role: "assistant" as const,
        content: err.message || "Failed to retrieve chat response.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      activeSession.messages.push(errMsg);
      setActiveProject({ ...activeProject, chatHistory: sessionList });
    }
  };

  const createNewChatSession = () => {
    if (!activeProject) return;
    const newSession: ChatSession = {
      id: `chat_session_${Date.now()}`,
      title: `Conversation ${activeProject.chatHistory.length + 1}`,
      messages: []
    };
    const updatedChat = [...activeProject.chatHistory, newSession];
    const updatedProjObj = { ...activeProject, chatHistory: updatedChat };
    const updatedList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
    saveProjects(updatedList);
    setActiveProject(updatedProjObj);
    setSelectedChatSessionId(newSession.id);
  };

  // Voice recognition toggle for Chats tab
  const toggleVoiceInput = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsVoiceActive(false);
      return;
    }

    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) {
      alert("Voice speech recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechClass();
    rec.continuous = false;
    rec.lang = "en-US";
    rec.onstart = () => setIsVoiceActive(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setChatInput(prev => prev ? `${prev} ${text}` : text);
    };
    rec.onend = () => setIsVoiceActive(false);
    recognitionRef.current = rec;
    rec.start();
  };

  // Filter project cards on dashboard
  const filteredProjects = projects
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.desc.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (currentFilter === "Favorites") return p.starred;
      if (currentFilter === "Shared") return p.shared;
      if (currentFilter === "Archived") return p.status === "Archived";
      if (currentFilter === "Recent") {
        return p.date.includes("2026-08"); // matches current mock date
      }
      return p.status !== "Archived";
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "progress") return b.progress - a.progress;
      return b.date.localeCompare(a.date);
    });

  const selectedSessionMessages = activeProject?.chatHistory.find(s => s.id === selectedChatSessionId)?.messages || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* File input click hook */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* DASHBOARD LIST VIEW MODE */}
      {!activeProject ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>AI Workspace Projects</h1>
              <p className="text-xs mt-0.5" style={{ color: T.textSecondary }}>
                Notion + Google Drive + ChatGPT Projects combined into a premium context-aware AI workspace manager.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-750 text-white rounded-xl text-xs py-2 px-4 shadow-md flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5" />
                Create Project
              </Button>
            </div>
          </div>

          {/* Filter options bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-3" style={{ borderColor: T.border }}>
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
              {(["All", "Recent", "Favorites", "Shared", "Archived"] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setCurrentFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    currentFilter === filter 
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-center w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workspace..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-900 border focus:outline-none placeholder-slate-500"
                  style={{ borderColor: T.border, color: T.textPrimary }}
                />
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl text-xs bg-slate-900 border text-slate-400 focus:outline-none cursor-pointer"
                style={{ borderColor: T.border }}
              >
                <option value="date">Sort: Date</option>
                <option value="name">Sort: Name</option>
                <option value="progress">Sort: RAG index</option>
              </select>

              {/* Grid / List switchers */}
              <div className="flex gap-1 border p-0.5 rounded-lg" style={{ borderColor: T.border }}>
                <button onClick={() => setViewMode("grid")} className={`p-1 rounded ${viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-400"}`}>
                  <Grid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1 rounded ${viewMode === "list" ? "bg-white/10 text-white" : "text-slate-400"}`}>
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* List/Grid rendering */}
          {filteredProjects.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed rounded-3xl" style={{ borderColor: T.border }}>
              <FolderGit2 className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">No workspaces match current queries</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
              {filteredProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => { 
                    setActiveProject(p); 
                    setActiveTab("Files"); 
                    setSelectedChatSessionId(p.chatHistory[0]?.id || "");
                  }}
                  className="p-5 rounded-3xl border bg-white/5 hover:border-purple-500/30 hover:scale-[1.01] transition-all duration-205 cursor-pointer flex flex-col justify-between h-64 relative group shadow-lg"
                  style={{ borderColor: T.border }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-purple-400" style={{ backgroundColor: `${p.color}15` }}>
                        <FolderGit2 className="h-5.5 w-5.5" style={{ color: p.color }} />
                      </div>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => toggleStarProject(p.id, e)} className="p-1 hover:bg-white/5 rounded">
                          <Star className={`h-4.5 w-4.5 ${p.starred ? "text-yellow-500 fill-yellow-500" : "text-slate-500"}`} />
                        </button>
                        <button onClick={(e) => toggleShareProject(p.id, e)} className="p-1 hover:bg-white/5 rounded">
                          <Share2 className={`h-4.5 w-4.5 ${p.shared ? "text-cyan-400" : "text-slate-500"}`} />
                        </button>
                        <button onClick={(e) => deleteProject(p.id, e)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-red-500">
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold truncate mb-1" style={{ color: T.textPrimary }}>{p.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">{p.desc}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>RAG Context Setup</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-purple-650 h-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500">
                      <span className="flex items-center gap-1"><FileCheck className="h-3 w-3 text-purple-400" /> {p.filesCount} Files</span>
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-cyan-400" /> {p.tokensUsed} Tokens</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border rounded-2xl overflow-hidden shadow-sm animate-fade-in" style={{ borderColor: T.border }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-slate-400 font-bold bg-white/5" style={{ borderColor: T.border }}>
                    <th className="py-3 px-4">Workspace</th>
                    <th className="py-3 px-2">Privacy</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Total Files</th>
                    <th className="py-3 px-2">Size</th>
                    <th className="py-3 px-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-300" style={{ borderColor: T.border }}>
                  {filteredProjects.map(p => (
                    <tr 
                      key={p.id} 
                      onClick={() => { 
                        setActiveProject(p); 
                        setActiveTab("Files"); 
                        setSelectedChatSessionId(p.chatHistory[0]?.id || "");
                      }}
                      className="hover:bg-slate-500/5 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        <span className="flex items-center gap-2.5">
                          <FolderGit2 className="h-4.5 w-4.5" style={{ color: p.color }} />
                          {p.name}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{p.privacy}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400">{p.filesCount} items</td>
                      <td className="py-3 px-2 text-slate-400">{p.storageUsed}</td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => deleteProject(p.id, e)} className="text-slate-500 hover:text-red-500 p-1">
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        
        /* DEDICATED ACTIVE PROJECT WORKSPACE SCREEN */
        <div className="space-y-6 animate-fade-in">
          
          {/* Header area with back buttons and configs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveProject(null)}
                className="p-2 hover:bg-slate-500/10 rounded-xl text-slate-400 hover:text-white transition-colors border"
                style={{ borderColor: T.border }}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold" style={{ color: T.textPrimary }}>{activeProject.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">{activeProject.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeProject.desc}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={(e) => toggleStarProject(activeProject.id, e)} className="p-2 border rounded-xl hover:bg-white/5" style={{ borderColor: T.border }}>
                <Star className={`h-4.5 w-4.5 ${activeProject.starred ? "text-yellow-500 fill-yellow-500" : "text-slate-500"}`} />
              </button>
              <button onClick={(e) => toggleShareProject(activeProject.id, e)} className="p-2 border rounded-xl hover:bg-white/5" style={{ borderColor: T.border }}>
                <Share2 className={`h-4.5 w-4.5 ${activeProject.shared ? "text-cyan-400" : "text-slate-500"}`} />
              </button>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold bg-white/5 border px-3 py-1.5 rounded-xl" style={{ borderColor: T.border }}>
                <Cpu className="h-4 w-4 text-purple-400" />
                <span>Model context: {activeProject.model}</span>
              </div>
            </div>
          </div>

          {/* Upload progress banner inside workspace */}
          {isUploading && (
            <GlassCard className="p-4 border-purple-500/30 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{uploadStage}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-850 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-650 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </GlassCard>
          )}

          {/* Workspace Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 border-b" style={{ borderColor: T.border }}>
            {(["Files", "AI Workspace", "Chats", "Generated Outputs", "Knowledge Base", "Analytics", "Activity", "Settings"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeTab === tab 
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TABS WORKSPACE RENDER PANEL */}

          {/* TAB 1: FILES */}
          {activeTab === "Files" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Indexed Files Directory</h3>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} className="text-[10px] py-1.5 bg-purple-650 hover:bg-purple-750 text-white">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Upload Files
                  </Button>
                </div>
              </div>

              {activeProject.files.length === 0 ? (
                <div className="p-16 text-center border border-dashed rounded-3xl" style={{ borderColor: T.border }}>
                  <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-semibold">No files indexed in this workspace</p>
                  <p className="text-[10px] text-slate-500 mt-1">Upload files to populate RAG Knowledge Base contexts.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 font-bold bg-white/5" style={{ borderColor: T.border }}>
                        <th className="py-3 px-4">File Name</th>
                        <th className="py-3 px-2">Size</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Chunks</th>
                        <th className="py-3 px-2">Pipeline Status</th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-300" style={{ borderColor: T.border }}>
                      {activeProject.files.map(f => (
                        <tr key={f.id} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-purple-400 shrink-0" />
                              {f.name}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{f.size}</td>
                          <td className="py-3 px-2 font-mono text-[10px] text-purple-400">{f.type}</td>
                          <td className="py-3 px-2 font-mono text-slate-400">{f.chunksCount}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              f.status === "Ready" 
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse"
                            }`}>
                              {f.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button onClick={() => removeWorkspaceFile(f.id)} className="text-slate-500 hover:text-red-500 p-1">
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
          )}

          {/* TAB 2: AI WORKSPACE */}
          {activeTab === "AI Workspace" && (
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                
                {/* RAG Context status */}
                <GlassCard className="p-4 border-purple-500/20 bg-purple-500/5 flex items-center gap-3">
                  <Brain className="h-5 w-5 text-purple-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Active RAG context enabled</h4>
                    <p className="text-[10px] text-slate-400">
                      All queries run inside **{activeProject.name}** are automatically cross-referenced with your uploaded file assets.
                    </p>
                  </div>
                </GlassCard>

                {/* Prompt block */}
                <GlassCard className="p-5 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <textarea
                    value={workspacePrompt}
                    onChange={(e) => setWorkspacePrompt(e.target.value)}
                    placeholder="Ask AI Workspace: 'Compare document A and B', 'Summarize meeting timelines'..."
                    className="w-full p-3 rounded-xl border bg-slate-900 text-xs focus:outline-none"
                    style={{ borderColor: T.border, color: T.textPrimary }}
                    rows={4}
                  />

                  <div className="flex justify-end">
                    <Button onClick={handleWorkspaceQuery} disabled={workspaceAiLoading} className="bg-purple-600 hover:bg-purple-750 text-xs text-white">
                      {workspaceAiLoading ? "Processing RAG..." : "Query AI Workspace"}
                    </Button>
                  </div>
                </GlassCard>

                {/* Output review area */}
                {workspaceResponse && (
                  <GlassCard className="p-5 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                    <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: T.border }}>
                      <span className="text-[10px] font-bold text-purple-400">RAG RESPONSE OUTPUT</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(workspaceResponse);
                          alert("Response copied to clipboard!");
                        }}
                        className="text-[9px] text-slate-400 hover:text-white"
                      >
                        Copy Response
                      </button>
                    </div>
                    <div className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {workspaceResponse}
                    </div>
                  </GlassCard>
                )}

              </div>

              {/* Sidebar Quick prompt suggestions */}
              <div className="md:col-span-4 space-y-4">
                <GlassCard className="p-4 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Queries</h4>
                  <div className="space-y-2">
                    {[
                      "Summarize all files.",
                      "Find contradictions in SLA guidelines.",
                      "Extract key milestones and timelines.",
                      "Explain code functions inside repo."
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => setWorkspacePrompt(q)}
                        className="w-full text-left p-2.5 rounded-xl border text-[10px] text-slate-300 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
                        style={{ borderColor: T.border }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </GlassCard>
              </div>

            </div>
          )}

          {/* TAB 3: CHATS */}
          {activeTab === "Chats" && (
            <div className="grid md:grid-cols-12 gap-6 items-stretch">
              
              {/* Left sessions column */}
              <div className="md:col-span-3 space-y-3">
                <Button onClick={createNewChatSession} className="w-full border text-xs py-2 bg-purple-650 hover:bg-purple-750">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New Chat Session
                </Button>
                
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {activeProject.chatHistory.map(session => (
                    <button
                      key={session.id}
                      onClick={() => setSelectedChatSessionId(session.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        selectedChatSessionId === session.id 
                          ? "bg-purple-500/10 border-purple-500/40 text-purple-400 font-bold" 
                          : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block truncate">{session.title}</span>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{session.messages.length} messages</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message panel area */}
              <div className="md:col-span-9 border rounded-2xl h-[480px] flex flex-col justify-between overflow-hidden bg-white/5" style={{ borderColor: T.border }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedSessionMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p>Start a new dialogue session inside this RAG project</p>
                    </div>
                  ) : (
                    selectedSessionMessages.map(msg => (
                      <div 
                        key={msg.id} 
                        className={`flex items-start gap-3 max-w-2xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                      >
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${
                          msg.role === "user" ? "bg-purple-600/10 border-purple-500/20 text-purple-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}>
                          {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className="space-y-1">
                          <div className={`rounded-xl p-3 text-xs leading-relaxed border ${
                            msg.role === "user" ? "bg-purple-600 text-white border-purple-700" : "bg-slate-900 border-white/5 text-slate-100"
                          }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <span className="text-[8.5px] text-slate-500 block px-1 text-right">{msg.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input panel bar */}
                <div className="p-3 border-t bg-slate-950/60 flex items-center gap-2" style={{ borderColor: T.border }}>
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-lg border transition-all ${isVoiceActive ? "text-red-500 border-red-500/30" : "text-slate-500 hover:text-white"}`}
                    style={{ borderColor: T.border }}
                  >
                    {isVoiceActive ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Query AI with RAG scope context..."
                    className="flex-1 bg-transparent text-xs focus:outline-none text-white"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }}
                  />
                  <Button size="sm" onClick={handleSendChat} className="bg-purple-650 hover:bg-purple-750 text-white text-xs py-1 px-3">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: GENERATED OUTPUTS */}
          {activeTab === "Generated Outputs" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Transformation Outputs</h3>
              
              {activeProject.outputs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No output files generated yet. Run RAG query transforms to generate items.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
                  {activeProject.outputs.map(out => (
                    <GlassCard key={out.id} className="p-4 flex flex-col justify-between" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[8px] font-bold uppercase">{out.preset}</span>
                          <span className="text-[9px] text-slate-500">{out.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">{out.title}</h4>
                        <div className="p-3 bg-slate-900 rounded-xl border border-white/5 max-h-40 overflow-y-auto text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                          {out.content}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/5 mt-3 flex justify-end gap-2">
                        <Button
                          onClick={() => {
                            const blob = new Blob([out.content], { type: "text/markdown" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${out.title.replace(/\s+/g, "_")}.md`;
                            a.click();
                          }}
                          variant="outline"
                          className="text-[9px] py-1 px-2.5"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: KNOWLEDGE BASE */}
          {activeTab === "Knowledge Base" && (
            <div className="grid md:grid-cols-12 gap-6">
              
              <div className="md:col-span-8 space-y-6">
                <GlassCard className="p-5 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-2">
                      <Database className="h-4.5 w-4.5 text-purple-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Vector Store Status</h4>
                    </div>
                    <button 
                      onClick={rebuildEmbeddings}
                      className="text-[9px] text-purple-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      Rebuild Embeddings
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">RAG Health</span>
                      <span className="text-xs font-bold text-emerald-400">98.4%</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">Indexed Documents</span>
                      <span className="text-xs font-bold text-white">{activeProject.filesCount}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">Vector Chunks</span>
                      <span className="text-xs font-bold text-cyan-400">
                        {activeProject.files.reduce((acc, curr) => acc + curr.chunksCount, 0)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-white/5">
                      <span className="block text-[8px] text-slate-500 uppercase font-bold">Token Load</span>
                      <span className="text-xs font-bold text-purple-400">{activeProject.tokensUsed}</span>
                    </div>
                  </div>
                </GlassCard>

                {/* Chunks inspector listing */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Knowledge Base chunks preview</h3>
                  <div className="space-y-2">
                    {activeProject.files.map(f => (
                      <div key={f.id} className="p-4 border rounded-2xl bg-white/5" style={{ borderColor: T.border }}>
                        <div className="flex justify-between items-center border-b pb-2 mb-2" style={{ borderColor: T.border }}>
                          <span className="text-xs font-bold text-white">{f.name}</span>
                          <span className="text-[10px] text-slate-500">{f.chunksCount} chunks mapped</span>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">
                          Previewing chunk #1: "Semantic vectorized mapping of SLA boundaries and target execution timelines for Acme platform integration."
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="md:col-span-4 space-y-4">
                <GlassCard className="p-4 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-purple-400" />
                    <h4 className="text-xs font-bold text-white">Compliance & Security</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-400 leading-relaxed">
                    Embeddings are compiled locally. High latency text files are parsed in background parallel nodes to save token overhead limit.
                  </p>
                </GlassCard>
              </div>

            </div>
          )}

          {/* TAB 6: ANALYTICS */}
          {activeTab === "Analytics" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Knowledge Base Size</p>
                <p className="text-xl font-bold font-mono text-purple-400">{activeProject.tokensUsed} tokens</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Indexed storage size</p>
                <p className="text-xl font-bold font-mono text-cyan-400">{activeProject.storageUsed}</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Total quick outputs</p>
                <p className="text-xl font-bold font-mono text-emerald-400">{activeProject.outputs.length} outputs</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Total query sessions</p>
                <p className="text-xl font-bold font-mono text-yellow-400">{activeProject.chatHistory.length} sessions</p>
              </GlassCard>
            </div>
          )}

          {/* TAB 7: ACTIVITY */}
          {activeTab === "Activity" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Activity Timeline</h3>
              
              <div className="border-l-2 border-purple-500/20 pl-4 space-y-3">
                {activeProject.history.map(hist => (
                  <div key={hist.id} className="relative py-1">
                    <span className="text-[9px] font-mono text-purple-400 font-bold block">[{hist.date}]</span>
                    <span className="text-xs text-slate-200 mt-1 block">
                      <strong className="text-purple-400 uppercase mr-1.5">[{hist.type}]</strong> 
                      {hist.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === "Settings" && (
            <GlassCard className="p-5 space-y-6" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: T.border }}>
                <Settings className="h-4.5 w-4.5 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Management Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rename Project Workspace</label>
                  <input
                    type="text"
                    value={activeProject.name}
                    onChange={(e) => {
                      const updatedProj = { ...activeProject, name: e.target.value };
                      setActiveProject(updatedProj);
                      const updatedList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedList);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Privacy Settings</label>
                  <select
                    value={activeProject.privacy}
                    onChange={(e) => {
                      const updatedProj = { ...activeProject, privacy: e.target.value as any };
                      setActiveProject(updatedProj);
                      const updatedList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedList);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Private">Private</option>
                    <option value="Team">Team Shared</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-white/10">
                <Button 
                  onClick={() => {
                    if (confirm("Archive this project workspace?")) {
                      const updatedProj = { ...activeProject, status: "Archived" as const };
                      setActiveProject(updatedProj);
                      const updatedList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedList);
                    }
                  }}
                  variant="outline" 
                  className="text-xs"
                >
                  Archive Workspace
                </Button>
                <Button 
                  onClick={() => {
                    if (confirm("Delete this workspace and purge all its data?")) {
                      const updated = projects.filter(p => p.id !== activeProject.id);
                      saveProjects(updated);
                      setActiveProject(null);
                    }
                  }}
                  className="bg-red-650 hover:bg-red-750 text-white text-xs"
                >
                  Delete Workspace
                </Button>
              </div>
            </GlassCard>
          )}

        </div>

      )}

      {/* Premium Create Project modal popup */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4 border-slate-200 bg-white" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-bold animate-pulse" style={{ color: T.textPrimary }}>Create Project Workspace</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Project Name</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="Compliance Audit, Lecture review..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <input
                  type="text"
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Objectives, target outcomes..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Theme Color</label>
                  <input
                    type="color"
                    value={newProjColor}
                    onChange={(e) => setNewProjColor(e.target.value)}
                    className="w-full h-9 rounded-xl border cursor-pointer p-0.5"
                    style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={newProjCategory}
                    onChange={(e) => setNewProjCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border cursor-pointer"
                    style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
                  >
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Legal">Legal</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 border rounded-xl" style={{ borderColor: T.border }}>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Enable RAG Processing</span>
                <input
                  type="checkbox"
                  checked={newProjEnableRag}
                  onChange={(e) => setNewProjEnableRag(e.target.checked)}
                  className="h-4 w-4 cursor-pointer text-purple-600 border-slate-350 rounded"
                />
              </div>

            </div>

            <div className="pt-3 border-t flex justify-end gap-2.5" style={{ borderColor: T.border }}>
              <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateProject} className="bg-purple-650 hover:bg-purple-750 text-white">Create Project</Button>
            </div>

          </GlassCard>
        </div>
      )}

    </div>
  );
}
