"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FolderGit2, Calendar, FileCheck, Layers, Plus, ArrowLeft, Search, 
  Star, Pin, Trash2, X, MessageSquare, Upload, Cpu, Download, 
  Copy, Check, FileText, Zap, Brain, Edit2, Play, Users, BarChart3, 
  Settings, History, List, Grid, ChevronRight, AlertCircle, Sparkles, Mic, MicOff,
  User, Bot, Send
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
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
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
  filesCount: number;
  tokensUsed: string;
  storageUsed: string;
  pinned: boolean;
  files: ProjectFile[];
  chatHistory: ChatMessage[];
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
    model: "Gemini Pro",
    language: "English",
    date: "2026-08-20",
    owner: "Admin Owner",
    status: "Active",
    progress: 75,
    filesCount: 3,
    tokensUsed: "420K",
    storageUsed: "12.4 MB",
    pinned: true,
    files: [
      { id: "file_acme_1", name: "SLA_Contract_Draft.pdf", type: "PDF", size: "8.2 MB", date: "2026-08-20" },
      { id: "file_acme_2", name: "Acme_SLA_Guidelines.docx", type: "DOCX", size: "3.1 MB", date: "2026-08-19" },
      { id: "file_acme_3", name: "Audit_Checklist.txt", type: "TXT", size: "1.1 MB", date: "2026-08-20" }
    ],
    chatHistory: [
      { id: "msg_1", role: "assistant", content: "Hi, I have loaded the Acme compliance guidelines. You can query liabilities or timeline details.", time: "10:30 AM" }
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
    progress: 40,
    filesCount: 2,
    tokensUsed: "150K",
    storageUsed: "22.5 MB",
    pinned: false,
    files: [
      { id: "file_mkt_1", name: "Feedback_Call_Aug18.mp3", type: "MP3", size: "18.4 MB", date: "2026-08-18" },
      { id: "file_mkt_2", name: "Meeting_Brief.txt", type: "TXT", size: "4.1 KB", date: "2026-08-18" }
    ],
    chatHistory: [
      { id: "msg_mkt_1", role: "assistant", content: "Feedback audio loaded. Highlights indicate core concerns are UI loading speed and template customization.", time: "2:15 PM" }
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

  // Storage states
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  
  // Dashboard states
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create Project form state
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [newProjColor, setNewProjColor] = useState("#a855f7");
  const [newProjCategory, setNewProjCategory] = useState("Business");
  const [newProjModel, setNewProjModel] = useState("Gemini Pro");
  const [newProjLanguage, setNewProjLanguage] = useState("English");
  const [newProjPrivacy, setNewProjPrivacy] = useState<"Private" | "Team">("Private");

  // Workspace active tab
  const [activeTab, setActiveTab] = useState<"Overview" | "Files" | "AI Chat" | "Quick Actions" | "Generated Outputs" | "History" | "Analytics" | "Settings">("Overview");

  // Workspace RAG chat state
  const [chatInput, setChatInput] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  // File Upload Indicator
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Action Form state
  const [selectedActionPreset, setSelectedActionPreset] = useState("summary");
  const [customActionPrompt, setCustomActionPrompt] = useState("");
  const [selectedActionFile, setSelectedActionFile] = useState<string>("");

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_assistant_projects_manager");
      if (stored) {
        setProjects(JSON.parse(stored));
      } else {
        setProjects(DEFAULT_PROJECTS);
        localStorage.setItem("act_assistant_projects_manager", JSON.stringify(DEFAULT_PROJECTS));
      }
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem("act_assistant_projects_manager", JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    if (!newProjName.trim()) {
      alert("Please specify a project name.");
      return;
    }

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: newProjName,
      desc: newProjDesc || "AI assisted content transformation workspace.",
      icon: "Folder",
      color: newProjColor,
      category: newProjCategory,
      tags: [newProjCategory],
      privacy: newProjPrivacy,
      model: newProjModel,
      language: newProjLanguage,
      date: new Date().toISOString().split('T')[0],
      owner: "Admin Owner",
      status: "Active",
      progress: 0,
      filesCount: 0,
      tokensUsed: "0K",
      storageUsed: "0 MB",
      pinned: false,
      files: [],
      chatHistory: [
        { id: `wel_${Date.now()}`, role: "assistant", content: `Welcome to your AI workspace: ${newProjName}. Upload files or type prompts to get started.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ],
      outputs: [],
      history: [
        { id: `hist_${Date.now()}`, type: "System", detail: `Project ${newProjName} initialized.`, date: new Date().toISOString().split('T')[0] }
      ]
    };

    const updated = [newProject, ...projects];
    saveProjects(updated);

    // Reset inputs & close
    setNewProjName("");
    setNewProjDesc("");
    setCreateModalOpen(false);
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project workspace and all its data?")) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      if (activeProject?.id === id) {
        setActiveProject(null);
      }
    }
  };

  const togglePinProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = projects.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p);
    saveProjects(updated);
    if (activeProject?.id === id) {
      setActiveProject({ ...activeProject, pinned: !activeProject.pinned });
    }
  };

  // Workspace file uploads
  const handleWorkspaceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (uploaded && activeProject) {
      processWorkspaceFiles(Array.from(uploaded));
    }
  };

  const processWorkspaceFiles = async (fileList: File[]) => {
    if (!activeProject) return;
    setIsUploading(true);
    setUploadProgress(20);

    const updatedFiles = [...activeProject.files];
    const updatedHistory = [...activeProject.history];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadStage(`Processing & indexing: ${file.name}`);
      setUploadProgress(Math.round(((i + 1) / fileList.length) * 100));
      await new Promise(r => setTimeout(r, 600));

      const fileExtension = file.name.split('.').pop()?.toUpperCase() || "TXT";
      const newFile: ProjectFile = {
        id: `file_${Date.now()}_${i}`,
        name: file.name,
        type: fileExtension,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        date: new Date().toISOString().split('T')[0]
      };

      updatedFiles.push(newFile);
      updatedHistory.push({
        id: `hist_${Date.now()}_${i}`,
        type: "Upload",
        detail: `Uploaded ${file.name}`,
        date: new Date().toISOString().split('T')[0]
      });
    }

    const updatedProjObj: Project = {
      ...activeProject,
      files: updatedFiles,
      history: updatedHistory,
      filesCount: updatedFiles.length,
      storageUsed: `${(parseFloat(activeProject.storageUsed) + fileList.length * 1.5).toFixed(1)} MB`
    };

    // Save to lists
    const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
    saveProjects(updatedProjList);
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
        detail: `Removed file ${file?.name || "Unknown"}`,
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

    const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
    saveProjects(updatedProjList);
    setActiveProject(updatedProjObj);
  };

  // Workspace RAG Chat
  const handleSendWorkspaceChat = async () => {
    if (!chatInput.trim() || !activeProject) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChat = [...activeProject.chatHistory, userMsg];
    
    // Optimistic UI update
    setActiveProject({ ...activeProject, chatHistory: updatedChat });
    setChatInput("");

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const fileContextTexts = activeProject.files.map(f => `[File Context: ${f.name} (Size: ${f.size})]`).join("\n");

      const response = await ApiClient.postChat({
        messages: updatedChat.map(m => ({ role: m.role, content: m.content })),
        files: [],
        model: activeProject.model,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
        useRAG: true
      });

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant",
        content: response.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalChat = [...updatedChat, assistantMsg];
      const updatedProjObj = {
        ...activeProject,
        chatHistory: finalChat,
        history: [{ id: `hist_chat_${Date.now()}`, type: "AI Chat", detail: `Queried AI: "${userMsg.content.slice(0, 25)}..."`, date: new Date().toISOString().split('T')[0] }, ...activeProject.history]
      };

      const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
      saveProjects(updatedProjList);
      setActiveProject(updatedProjObj);

    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: "assistant",
        content: err.message || "Failed to retrieve AI model response.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setActiveProject({ ...activeProject, chatHistory: [...updatedChat, errMsg] });
    }
  };

  // Quick Action execution on selected file
  const handleExecuteQuickAction = async () => {
    if (!activeProject) return;
    const targetFile = activeProject.files.find(f => f.id === selectedActionFile);
    if (!targetFile) {
      alert("Please upload and select a project file first.");
      return;
    }

    setIsUploading(true);
    setUploadStage(`Executing quick action on ${targetFile.name}...`);
    setUploadProgress(40);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const defaultPrompt = customActionPrompt || `Summarize this file: ${selectedActionPreset}`;
      const payload = {
        text: `[Source Document: ${targetFile.name}]\n- File Size: ${targetFile.size}\n- Extension: ${targetFile.type}\nContent transformation RAG analysis.`,
        format: defaultPrompt,
        model: activeProject.model,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null
      };

      const response = await ApiClient.postTransform(payload);

      setUploadProgress(100);
      setUploadStage("Action output compiled successfully");

      const newOutput: GeneratedOutput = {
        id: `out_${Date.now()}`,
        title: `${targetFile.name.split(".")[0]} - ${selectedActionPreset.toUpperCase()}`,
        content: response.output || "No output compiled.",
        date: new Date().toISOString().split('T')[0],
        preset: selectedActionPreset
      };

      const updatedOutputs = [newOutput, ...activeProject.outputs];
      const updatedHistory = [
        {
          id: `hist_${Date.now()}`,
          type: "AI Transform",
          detail: `Executed Quick Action: ${selectedActionPreset} on ${targetFile.name}`,
          date: new Date().toISOString().split('T')[0]
        },
        ...activeProject.history
      ];

      const updatedProjObj = {
        ...activeProject,
        outputs: updatedOutputs,
        history: updatedHistory
      };

      const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProjObj : p);
      saveProjects(updatedProjList);
      setActiveProject(updatedProjObj);

      alert(`Transformation compiled! View details in the 'Generated Outputs' tab.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to trigger AI quick action.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Toggle Voice input for Chat
  const toggleVoiceInput = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsVoiceActive(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.lang = "en-US";
    rec.onstart = () => setIsVoiceActive(true);
    rec.onresult = (e: any) => {
      const txt = e.results[0][0].transcript;
      setChatInput(prev => prev ? `${prev} ${txt}` : txt);
    };
    rec.onend = () => setIsVoiceActive(false);
    recognitionRef.current = rec;
    rec.start();
  };

  // Filter project cards on dashboard
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* File uploader DOM hook */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleWorkspaceFileUpload}
        className="hidden"
      />

      {/* DASHBOARD MODE: Displaying Project Cards */}
      {!activeProject ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>AI Workspace Manager</h1>
              <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
                Intelligent RAG workspaces. Organize files, chat with AI, compile custom quick actions, and manage documents.
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none border shadow-inner"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
                />
              </div>

              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 shadow-sm rounded-xl bg-purple-650 hover:bg-purple-750 text-white text-xs py-2 px-4"
              >
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </div>
          </div>

          {/* Grid list of dynamic project cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => { setActiveProject(p); setActiveTab("Overview"); }}
                className="p-5 rounded-3xl border bg-white/5 hover:border-purple-500/30 hover:scale-[1.01] transition-all duration-200 cursor-pointer flex flex-col justify-between h-64 relative group shadow-lg"
                style={{ borderColor: T.border }}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-purple-400" style={{ backgroundColor: `${p.color}15` }}>
                      <FolderGit2 className="h-5.5 w-5.5" style={{ color: p.color }} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => togglePinProject(p.id, e)} className="p-1 hover:bg-white/5 rounded">
                        <Star className={`h-4.5 w-4.5 ${p.pinned ? "text-yellow-500 fill-yellow-500" : "text-slate-500"}`} />
                      </button>
                      <button onClick={(e) => deleteProject(p.id, e)} className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-red-500">
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold truncate mb-1.5" style={{ color: T.textPrimary }}>{p.name}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-4">{p.desc}</p>
                </div>

                <div className="space-y-3 pt-3 border-t" style={{ borderColor: T.border }}>
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold text-slate-500">
                      <span>RAG Setup Progress</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-purple-650 h-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  {/* Foot metadata */}
                  <div className="flex items-center justify-between text-[9px] text-slate-500">
                    <span className="flex items-center gap-1"><FileCheck className="h-3 w-3 text-purple-400" /> {p.filesCount} Files</span>
                    <span className="flex items-center gap-1"><Layers className="h-3 w-3 text-cyan-400" /> {p.tokensUsed} Tokens</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {p.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        
        /* PROJECT DETAILS: Workspace Area Mode */
        <div className="space-y-6">
          {/* Back to list dashboard header */}
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
                  <h1 className="text-xl font-bold" style={{ color: T.textPrimary }}>{activeProject.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">{activeProject.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{activeProject.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold bg-white/5 border px-3.5 py-1.5 rounded-xl" style={{ borderColor: T.border }}>
              <Cpu className="h-4 w-4 text-purple-400" />
              <span>Model Config: {activeProject.model}</span>
            </div>
          </div>

          {/* Upload progress notifier inside workspace */}
          {isUploading && (
            <GlassCard className="p-4 border-purple-500/30 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>{uploadStage}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-650 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </GlassCard>
          )}

          {/* Workspace Tabs Navigator */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b" style={{ borderColor: T.border }}>
            {(["Overview", "Files", "AI Chat", "Quick Actions", "Generated Outputs", "History", "Analytics", "Settings"] as const).map(tab => (
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

          {/* Tab Content Panels */}
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="grid md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-6">
                
                {/* AI Workspace Suggestions */}
                <GlassCard className="p-5 border-purple-500/20 bg-purple-500/5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    <span>ACT Copilot Suggestion</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Based on files currently uploaded inside **{activeProject.name}**, you can generate a **Compliance Risk Assessment Matrix** or review liabilities cap from the SLA contracts. Navigate to **Quick Actions** tab to run in one-click.
                  </p>
                </GlassCard>

                {/* Pinned / Recent Files */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Workspace Files</h3>
                  <div className="space-y-2.5">
                    {activeProject.files.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No files in this project workspace yet. Go to Files tab to upload.</p>
                    ) : (
                      activeProject.files.slice(0, 3).map(f => (
                        <div key={f.id} className="p-3.5 border rounded-2xl flex items-center justify-between bg-white/5" style={{ borderColor: T.border }}>
                          <div className="flex items-center gap-3">
                            <FileText className="h-4.5 w-4.5 text-purple-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-none">{f.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{f.size}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Side Overview Stats */}
              <div className="md:col-span-4 space-y-6">
                <GlassCard className="p-4 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: T.border }}>Workspace Details</h3>
                  
                  <div className="space-y-3 text-[11px] text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Indexed Files:</span>
                      <span className="font-bold">{activeProject.filesCount} files</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage Used:</span>
                      <span className="font-bold">{activeProject.storageUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Language:</span>
                      <span className="font-bold">{activeProject.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Privacy:</span>
                      <span className="font-bold">{activeProject.privacy}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* TAB 2: FILES */}
          {activeTab === "Files" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">File Directory</h3>
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="text-[10px] py-1 bg-purple-650 hover:bg-purple-750">
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Add File
                </Button>
              </div>

              {activeProject.files.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed rounded-3xl" style={{ borderColor: T.border }}>
                  <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-semibold">No files uploaded inside this project workspace</p>
                  <p className="text-[9.5px] text-slate-500 mt-1">Upload PDF, Word, Excel, media, or source code to compile embeddings.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden shadow-sm" style={{ borderColor: T.border }}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-slate-400 font-bold bg-white/5" style={{ borderColor: T.border }}>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-2">Size</th>
                        <th className="py-3 px-2">Type</th>
                        <th className="py-3 px-2">Uploaded</th>
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
                          <td className="py-3 px-2 text-slate-400">{f.date}</td>
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

          {/* TAB 3: AI CHAT */}
          {activeTab === "AI Chat" && (
            <div className="border rounded-2xl h-[480px] flex flex-col justify-between overflow-hidden bg-white/5" style={{ borderColor: T.border }}>
              
              {/* Messages scroll frame */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeProject.chatHistory.map(msg => (
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
                ))}
              </div>

              {/* Chat Input bar */}
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
                  placeholder="Ask questions referencing uploaded project files..."
                  className="flex-1 bg-transparent text-xs focus:outline-none text-white placeholder-slate-500"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendWorkspaceChat(); }}
                />
                <Button size="sm" onClick={handleSendWorkspaceChat} className="bg-purple-650 hover:bg-purple-750 text-white text-xs py-1 px-3">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>

            </div>
          )}

          {/* TAB 4: QUICK ACTIONS */}
          {activeTab === "Quick Actions" && (
            <GlassCard className="p-5 space-y-6" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: T.border }}>
                <Zap className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Run Quick AI Workflows</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                
                {/* File Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Project File</label>
                  <select
                    value={selectedActionFile}
                    onChange={(e) => setSelectedActionFile(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Select a file...</option>
                    {activeProject.files.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Workflow Select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Action Preset</label>
                  <select
                    value={selectedActionPreset}
                    onChange={(e) => setSelectedActionPreset(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="summary">Summarize (Professional Abstract)</option>
                    <option value="translate">Translate to English</option>
                    <option value="flashcards">Generate study Q&A Flashcards</option>
                    <option value="minutes">Minutes of Meeting (MoM)</option>
                    <option value="actions">Extract Action Items Checklist</option>
                    <option value="timeline">Chronological Event Timeline</option>
                    <option value="bugs">Find Bugs & Vulnerabilities (Code Only)</option>
                  </select>
                </div>

                {/* Custom system prompt instruction override */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Optional Custom Instruction Override</label>
                  <input
                    type="text"
                    value={customActionPrompt}
                    onChange={(e) => setCustomActionPrompt(e.target.value)}
                    placeholder="Focus strictly on pricing terms, extract only function signatures..."
                    className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none"
                  />
                </div>

              </div>

              <Button onClick={handleExecuteQuickAction} className="w-full bg-purple-600 hover:bg-purple-700 text-xs py-2">
                Execute AI Workflow
              </Button>
            </GlassCard>
          )}

          {/* TAB 5: GENERATED OUTPUTS */}
          {activeTab === "Generated Outputs" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Generated Reports</h3>
              
              {activeProject.outputs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No outputs compiled yet. Run a Quick Action to save transformed results.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activeProject.outputs.map(out => (
                    <GlassCard key={out.id} className="p-4 space-y-3 flex flex-col justify-between" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
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

                      <div className="pt-2 flex justify-end gap-2 border-t border-white/5">
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
                          Download Markdown
                        </Button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {activeTab === "History" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Chronological Event logs</h3>
              
              <div className="space-y-2 border-l-2 border-purple-500/20 pl-4 font-mono text-[10px] text-slate-400">
                {activeProject.history.map(hist => (
                  <div key={hist.id} className="py-1">
                    <span className="text-purple-400 font-bold">[{hist.date}]</span>
                    <span className="ml-2 text-slate-500 font-bold uppercase">{hist.type}:</span>
                    <span className="ml-2 text-slate-300">{hist.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ANALYTICS */}
          {activeTab === "Analytics" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Total Tokens Ingested</p>
                <p className="text-xl font-bold font-mono text-purple-400">{activeProject.tokensUsed}</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">File Directory Storage</p>
                <p className="text-xl font-bold font-mono text-cyan-400">{activeProject.storageUsed}</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Actions Run</p>
                <p className="text-xl font-bold font-mono text-emerald-400">{activeProject.outputs.length} actions</p>
              </GlassCard>
              <GlassCard className="p-4 text-center space-y-1.5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                <p className="text-[9px] text-slate-500 uppercase font-bold">Conversations log</p>
                <p className="text-xl font-bold font-mono text-yellow-400">{activeProject.chatHistory.length} messages</p>
              </GlassCard>
            </div>
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === "Settings" && (
            <GlassCard className="p-5 space-y-6" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: T.border }}>
                <Settings className="h-4.5 w-4.5 text-slate-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Settings</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rename Workspace</label>
                  <input
                    type="text"
                    value={activeProject.name}
                    onChange={(e) => {
                      const updatedProj = { ...activeProject, name: e.target.value };
                      setActiveProject(updatedProj);
                      const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedProjList);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">AI Model Selector</label>
                  <select
                    value={activeProject.model}
                    onChange={(e) => {
                      const updatedProj = { ...activeProject, model: e.target.value };
                      setActiveProject(updatedProj);
                      const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedProjList);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Gemini Pro">Gemini Pro</option>
                    <option value="GPT-4o">GPT-4o</option>
                    <option value="Cohere">Cohere Command R+</option>
                    <option value="Claude 3.5">Claude 3.5</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4 border-white/10">
                <Button 
                  onClick={() => {
                    if (confirm("Archive this project workspace?")) {
                      const updatedProj = { ...activeProject, status: "Archived" as const };
                      setActiveProject(updatedProj);
                      const updatedProjList = projects.map(p => p.id === activeProject.id ? updatedProj : p);
                      saveProjects(updatedProjList);
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

      {/* Create Project Workspace Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="max-w-md w-full p-6 space-y-4 border-slate-200 bg-white" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-bold" style={{ color: T.textPrimary }}>Create AI Workspace Project</h3>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Project Name */}
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

              {/* Description */}
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

              {/* Grid of properties */}
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
                    <option value="Business" style={{ backgroundColor: T.bgCard }}>Business</option>
                    <option value="Education" style={{ backgroundColor: T.bgCard }}>Education</option>
                    <option value="Legal" style={{ backgroundColor: T.bgCard }}>Legal</option>
                    <option value="Healthcare" style={{ backgroundColor: T.bgCard }}>Healthcare</option>
                    <option value="Marketing" style={{ backgroundColor: T.bgCard }}>Marketing</option>
                  </select>
                </div>
              </div>

              {/* Privacy */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Privacy Settings</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewProjPrivacy("Private")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      newProjPrivacy === "Private" ? "bg-purple-600 border-purple-700 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Private
                  </button>
                  <button
                    onClick={() => setNewProjPrivacy("Team")}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      newProjPrivacy === "Team" ? "bg-purple-600 border-purple-700 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Team Shared
                  </button>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t flex justify-end gap-2.5" style={{ borderColor: T.border }}>
              <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateProject} className="bg-purple-600 hover:bg-purple-700">Create Project</Button>
            </div>

          </GlassCard>
        </div>
      )}

    </div>
  );
}

