"use client";

import React, { useState, useEffect } from "react";
import { 
  HelpCircle, BookOpen, KeyRound, Cpu, Layers, Search, Play, ArrowRight, CheckCircle, 
  ChevronDown, ChevronUp, AlertOctagon, Terminal, MessageSquare, Shield, Activity, 
  ExternalLink, Download, Command, Globe, Check, Info, Send, Bot, User, RefreshCw, X
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface DocArticle {
  id: string;
  title: string;
  category: string;
  content: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface TroubleshootingCard {
  id: string;
  problem: string;
  cause: string;
  solution: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function KnowledgeCenterPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [searchQuery, setSearchQuery] = useState("");
  
  // Interactive Onboarding Checklist
  const [checklist, setChecklist] = useState<OnboardingStep[]>([
    { id: "step_proj", label: "Create your first Project", completed: true },
    { id: "step_file", label: "Upload your first File", completed: true },
    { id: "step_trans", label: "Run your first AI Transformation", completed: false },
    { id: "step_quick", label: "Use a Quick Action", completed: false },
    { id: "step_chat", label: "Chat with your documents", completed: false },
    { id: "step_exp", label: "Export your output", completed: false }
  ]);

  // Collapsible FAQ states
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Floating Chatbot States
  const [chatBotOpen, setChatBotOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "1", role: "assistant", content: "Hi! I am the ACT Support Assistant. Ask me how Projects work, how to execute Quick Actions, or what RAG is." }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Markdown Doc modal viewer states
  const [selectedDoc, setSelectedDoc] = useState<DocArticle | null>(null);

  // Video tutorial modal states
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  // Load checklist progress from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_onboarding_checklist");
      if (stored) {
        setChecklist(JSON.parse(stored));
      }
    }
  }, []);

  const saveChecklist = (updated: OnboardingStep[]) => {
    setChecklist(updated);
    localStorage.setItem("act_onboarding_checklist", JSON.stringify(updated));
  };

  const toggleChecklistStep = (id: string) => {
    const updated = checklist.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    saveChecklist(updated);
  };

  const calculatedProgress = Math.round(
    (checklist.filter(s => s.completed).length / checklist.length) * 100
  );

  // Platform live status values
  const systemStatus = [
    { name: "Authentication Service", status: "Operational" },
    { name: "AI Models Engine", status: "Operational" },
    { name: "PostgreSQL Database", status: "Operational" },
    { name: "Pinecone Vector DB", status: "Operational" },
    { name: "AWS S3 Storage", status: "Operational" },
    { name: "Transform API Node", status: "Operational" }
  ];

  // Markdown doc list
  const docArticles: DocArticle[] = [
    { 
      id: "workspace", 
      title: "AI Workspace Guide", 
      category: "Workspaces",
      content: "### AI Workspace Guide\n\nACT's core workspace handles speech transformation, RAG index creation, and model execution.\n\n- **Step 1:** Select model (Gemini Pro, GPT-4o, Claude 3.5 Sonnet).\n- **Step 2:** Drag-and-drop file inputs.\n- **Step 3:** Setup prompt format instructions.\n- **Step 4:** Execute compiler trigger." 
    },
    { 
      id: "projects", 
      title: "Projects Guide", 
      category: "Management",
      content: "### Projects & Folders Workspace Guide\n\nProjects isolate folder contexts to separate client audits or research databases.\n\n- **Project creation:** Use themes, tags, and category binders to organize workspaces.\n- **RAG setup:** Indexing files in a specific project restricts AI chats to that project context automatically." 
    },
    { 
      id: "quick_actions", 
      title: "Quick Actions Guide", 
      category: "Workflows",
      content: "### Quick Actions Workflows\n\nRun one-click AI commands on any uploaded content.\n\n- Supported actions: Summarize, MoM Minutes, Alt text description, code unit tests, translate, and Markdown restructuring." 
    },
    { 
      id: "rag_arch", 
      title: "RAG vector Store Architecture", 
      category: "Developer",
      content: "### RAG vector Store Architecture\n\nACT uses local chunking and vector mapping to index PDFs, docx files, and audio/video transcripts.\n\n- **Chunks:** Mapped in 400-token sizes.\n- **Embeddings:** Generated via OpenAI text-embedding-3-small or Cohere." 
    }
  ];

  // FAQs
  const faqs: FAQItem[] = [
    { q: "How do I upload files?", a: "Go to AI Knowledge Hub (My Files) or any Project Workspace and click the Upload button or drag-and-drop files directly." },
    { q: "How does RAG work?", a: "RAG stands for Retrieval-Augmented Generation. ACT indexes your documents into chunks, embeddings them into our vector store. When you query the AI, it retrieves matching chunks to ground responses with citations." },
    { q: "What file formats are supported?", a: "PDF, Word (DOCX), Text (TXT), Excel (CSV/XLSX), Powerpoint (PPTX), Images, Audio, and Video files up to 150 MB limits." },
    { q: "Can I use multiple AI models?", a: "Yes! You can configure default models (Gemini Pro, GPT-4o, Claude) for each project or select them inside the chat prompts." }
  ];

  // Troubleshooting
  const troubleshooting: TroubleshootingCard[] = [
    { 
      id: "tr_1", 
      problem: "Upload Failed (File Size)", 
      cause: "File size exceeds browser RAG upload limits of 150 MB.", 
      solution: "Compress the file or segment it into smaller sub-documents before uploading." 
    },
    { 
      id: "tr_2", 
      problem: "RAG Index Error", 
      cause: "Vector database timeout or parsing schema mismatches.", 
      solution: "Go to the Project's Knowledge Base tab and click 'Rebuild Embeddings' to recreate indexes." 
    }
  ];

  // Floating AI Chat submission
  const handleSupportChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await ApiClient.postChat({
        messages: [{ role: "user", content: `You are a support chatbot. Answer help queries: ${userMsg.content}` }],
        files: [],
        model: "Gemini Pro",
        apiKey: null,
        openaiKey: null,
        cohereKey: null,
        useRAG: false
      });

      setChatMessages(prev => [...prev, {
        id: `ai_${Date.now()}`,
        role: "assistant",
        content: response.content
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        id: `ai_err_${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm experiencing connectivity issues. Please query again or read the FAQ section."
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Keyboard shortcut definitions
  const shortcuts = [
    { key: "Ctrl + K", action: "Global Search" },
    { key: "Ctrl + U", action: "Upload File" },
    { key: "Ctrl + P", action: "New Project" },
    { key: "Ctrl + Enter", action: "Run Transformation" },
    { key: "Ctrl + /", action: "Open AI Assistant" }
  ];

  const filteredDocs = docArticles.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 relative">
      
      {/* 1. Hero Section */}
      <div className="text-center py-10 space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: T.textPrimary }}>
          Knowledge Center
        </h1>
        <p className="text-xs leading-relaxed" style={{ color: T.textSecondary }}>
          Everything you need to master ACT AI — tutorials, documentation, FAQs, troubleshooting, and developer resources.
        </p>

        {/* Live Search Documentation */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="absolute left-3 top-5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documentation topics, integration keys..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-sm bg-slate-900"
            style={{ borderColor: T.border, color: T.textPrimary }}
          />
        </div>
      </div>

      {/* 2. Interactive Onboarding Checklist */}
      <GlassCard className="p-5 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3" style={{ borderColor: T.border }}>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Onboarding checklist</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Toggle completed steps to track onboarding setup progress.</p>
          </div>
          <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {calculatedProgress}% Completed
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          {checklist.map(step => (
            <button
              key={step.id}
              onClick={() => toggleChecklistStep(step.id)}
              className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-900 text-left transition-all hover:border-purple-500/20"
              style={{ borderColor: T.border }}
            >
              <span className="text-xs text-slate-200" style={step.completed ? { textDecoration: 'line-through', color: '#94a3b8' } : {}}>{step.label}</span>
              <CheckCircle className={`h-4.5 w-4.5 shrink-0 ${step.completed ? "text-emerald-400 fill-emerald-500/10" : "text-slate-655"}`} />
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Grid of Docs & FAQ accordion layout */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Documentation Library & Troubleshooting */}
        <div className="md:col-span-8 space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Documentation Articles</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredDocs.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="p-4 rounded-2xl border bg-white/5 hover:border-purple-500/30 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-36"
                  style={{ borderColor: T.border }}
                >
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-purple-400">{doc.category}</span>
                    <h4 className="text-xs font-bold text-white mt-1">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      Click to open article and review guide details, RAG configurations, and API payloads.
                    </p>
                  </div>
                  <span className="text-[9px] text-purple-400 flex items-center gap-1 mt-2">
                    Read doc <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting Center */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Troubleshooting guides</h3>
            <div className="space-y-3">
              {troubleshooting.map(tr => (
                <GlassCard key={tr.id} className="p-4 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <AlertOctagon className="h-4 w-4" />
                    <span>{tr.problem}</span>
                  </div>
                  <p className="text-[10px] text-slate-300"><strong>Root Cause:</strong> {tr.cause}</p>
                  <p className="text-[10px] text-slate-350"><strong>Recommended Fix:</strong> {tr.solution}</p>
                  
                  <div className="pt-2 border-t border-white/5 flex justify-end">
                    <Button 
                      onClick={() => alert(`Running automatic fix command for ${tr.problem}... Resolved!`)}
                      className="text-[9px] py-1 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Run One-Click Fix
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

        </div>

        {/* Right FAQs & status indicators */}
        <div className="md:col-span-4 space-y-6">
          
          {/* FAQs list accordion */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border rounded-xl overflow-hidden bg-white/5" style={{ borderColor: T.border }}>
                  <button
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3.5 text-xs text-left text-white font-bold"
                  >
                    <span>{faq.q}</span>
                    {expandedFaqIndex === idx ? <ChevronUp className="h-4 w-4 text-purple-400" /> : <ChevronDown className="h-4 w-4 text-purple-400" />}
                  </button>
                  {expandedFaqIndex === idx && (
                    <div className="p-3.5 bg-slate-900/60 border-t border-white/5 text-[10px] text-slate-300 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live system status */}
          <GlassCard className="p-4 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1.5" style={{ borderColor: T.border }}>
              Platform Nodes Status
            </h3>

            <div className="space-y-2.5 text-[10px] text-slate-300">
              {systemStatus.map(sys => (
                <div key={sys.name} className="flex justify-between items-center">
                  <span>{sys.name}</span>
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Developer center */}
      <GlassCard className="p-5 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
        <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: T.border }}>
          <Terminal className="h-4.5 w-4.5 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Developer Resource center</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">REST API POST payload example</span>
            <pre className="p-3 bg-slate-950/80 rounded-xl border border-white/5 text-[10px] font-mono text-emerald-400 overflow-x-auto">
{`curl -X POST https://act.platform/api/transform \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Source document details...",
    "format": "MoM summary minutes",
    "model": "Gemini Pro"
  }'`}
            </pre>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Downloads</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => alert("Downloading OpenAPI Swagger Spec file...")}
                className="p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-between text-slate-300 hover:bg-white/5 transition-all"
                style={{ borderColor: T.border }}
              >
                <span>OpenAPI.json</span>
                <Download className="h-3.5 w-3.5 text-purple-400" />
              </button>
              <button 
                onClick={() => alert("Downloading Postman Collection spec...")}
                className="p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-between text-slate-300 hover:bg-white/5 transition-all"
                style={{ borderColor: T.border }}
              >
                <span>Postman.json</span>
                <Download className="h-3.5 w-3.5 text-purple-400" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Keyboard Shortcuts table */}
      <GlassCard className="p-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-2" style={{ borderColor: T.border }}>
          Keyboard Shortcuts Cheat table
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300 font-mono">
          {shortcuts.map(sh => (
            <div key={sh.key} className="flex justify-between border-b pb-1.5" style={{ borderColor: T.border }}>
              <span className="text-purple-400 font-bold">{sh.key}</span>
              <span>{sh.action}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Floating chatbot dedicated to help */}
      <div className="fixed bottom-6 right-6 z-55">
        {chatBotOpen ? (
          <GlassCard className="w-80 h-96 p-4 flex flex-col justify-between shadow-2xl border bg-slate-950/95" style={{ borderColor: T.border }}>
            <div className="flex justify-between items-center border-b pb-2 mb-2" style={{ borderColor: T.border }}>
              <div className="flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-purple-400" />
                <span className="text-xs font-bold text-white">Docs Support AI</span>
              </div>
              <button onClick={() => setChatBotOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 p-2 max-h-64 text-[10px] leading-relaxed">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`p-2 rounded-xl border ${
                  msg.role === "user" ? "bg-purple-650/15 border-purple-500/20 text-right text-purple-300" : "bg-slate-900 border-white/5 text-slate-350"
                }`}>
                  {msg.content}
                </div>
              ))}
              {chatLoading && <div className="text-slate-500 italic">Thinking...</div>}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: T.border }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about templates, setup RAG..."
                className="flex-1 bg-transparent text-xs focus:outline-none text-white"
                onKeyDown={(e) => { if (e.key === "Enter") handleSupportChatSend(); }}
              />
              <button onClick={handleSupportChatSend} className="p-1 rounded bg-purple-650 hover:bg-purple-750 text-white">
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </GlassCard>
        ) : (
          <button
            onClick={() => setChatBotOpen(true)}
            className="h-12 w-12 rounded-full bg-purple-650 hover:bg-purple-750 text-white flex items-center justify-center shadow-2xl transition-all hover:scale-105"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Markdown Document viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="max-w-2xl w-full p-6 space-y-4 border-slate-200 bg-white" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: T.border }}>
              <h3 className="text-sm font-bold" style={{ color: T.textPrimary }}>{selectedDoc.title}</h3>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed" style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}>
              <p className="whitespace-pre-wrap">{selectedDoc.content}</p>
            </div>

            <div className="flex justify-end pt-3">
              <Button size="sm" onClick={() => setSelectedDoc(null)}>Close Reader</Button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
