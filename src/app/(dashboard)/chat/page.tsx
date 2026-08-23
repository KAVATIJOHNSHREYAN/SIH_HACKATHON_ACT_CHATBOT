"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Bookmark, 
  Link2, 
  X,
  FileCheck,
  ChevronDown,
  Cpu
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";

interface FileAttachment {
  name: string;
  size: number;
  type: string;
  data: string; // Base64 DataURL
}

interface Message {
  role: "user" | "assistant";
  content: string;
  tokens?: number;
  model?: string;
  time: string;
}

interface SavedChat {
  id: number;
  title: string;
  messages: Message[];
}

const SUGGESTED_PROMPTS = [
  "Summarize the key objectives of this project",
  "Translate the current text block into French",
  "Explain this codebase structure step by step"
];

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I'm ACT, your AI Content Transformation Assistant. How can I help you transform your content today? You can write a general question or attach multiple files to query their contents.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: "ACT Engine"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  const [useRAG, setUseRAG] = useState(true);
  
  // Attached files list
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [tokenSum, setTokenSum] = useState(65);

  // Pinned/Saved Chats list
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Load saved chats from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_assistant_saved_chats");
      if (stored) {
        setSavedChats(JSON.parse(stored));
      }
    }
  }, []);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAttachment: FileAttachment = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: dataUrl
        };
        setAttachedFiles(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMsg: Message = {
      role: "user",
      content: text || `Attached ${attachedFiles.length} file(s)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const data = await ApiClient.postChat({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        files: attachedFiles,
        model: selectedModel,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
        useRAG: useRAG
      });

      setIsTyping(false);
      
      const actMsg: Message = {
        role: "assistant",
        content: data.content,
        model: data.model || selectedModel,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        tokens: Math.floor(data.content.length / 4) + 120
      };

      setMessages(prev => [...prev, actMsg]);
      setTokenSum(prev => prev + (actMsg.tokens || 100));
      setAttachedFiles([]); // Clear attachments after successfully sending

    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      const errMsg: Message = {
        role: "assistant",
        content: err.message || "Unable to retrieve response from AI engine.",
        model: "System Error",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    }
  };

  // Pin/Save current chat thread
  const pinCurrentChat = () => {
    if (messages.length <= 1) return;
    
    // Use first user message or summary as title
    const firstUserMsg = messages.find(m => m.role === "user")?.content || "Conversation thread";
    const title = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? "..." : "");

    const newChat: SavedChat = {
      id: Date.now(),
      title,
      messages
    };

    const updated = [newChat, ...savedChats];
    setSavedChats(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("act_assistant_saved_chats", JSON.stringify(updated));
    }
    setActiveChatId(newChat.id);
  };

  const loadSavedChat = (chat: SavedChat) => {
    setMessages(chat.messages);
    setActiveChatId(chat.id);
  };

  const deleteSavedChat = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.filter(c => c.id !== id);
    setSavedChats(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("act_assistant_saved_chats", JSON.stringify(updated));
    }
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([
        {
          role: "assistant",
          content: "Hi, I'm ACT, your AI Content Transformation Assistant. How can I help you transform your content today?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: "ACT Engine"
        }
      ]);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] max-w-7xl mx-auto flex gap-6 items-stretch">
      {/* Pinned/Recent History left panel */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border border-white/5 rounded-2xl bg-slate-950/40 p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-xs font-bold text-slate-300">Chats Workspace</span>
          <button 
            onClick={() => {
              setMessages([
                {
                  role: "assistant",
                  content: "Hi, I'm ACT, your AI Content Transformation Assistant. How can I help you transform your content today?",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  model: "ACT Engine"
                }
              ]);
              setActiveChatId(null);
            }}
            className="text-[10px] text-slate-500 hover:text-white"
            title="Start New Chat"
          >
            New Chat
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-2">
          {savedChats.length === 0 ? (
            <p className="text-[10px] text-slate-600 text-center py-6">No pinned chats yet</p>
          ) : (
            savedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => loadSavedChat(chat)}
                className={`p-3 border rounded-xl text-xs flex items-center justify-between cursor-pointer group transition-all ${
                  activeChatId === chat.id
                    ? "bg-purple-600/10 border-purple-500/30 text-white font-semibold"
                    : "hover:bg-white/5 border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="truncate flex-1 pr-2">{chat.title}</span>
                <button 
                  onClick={(e) => deleteSavedChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-400 rounded transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-white/10 pt-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>Estimated Token Load</span>
            <span className="font-semibold text-purple-400">{tokenSum} / 100k</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${Math.min((tokenSum / 100000) * 100, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col border border-white/5 rounded-2xl bg-slate-950/20 overflow-hidden">
        {/* Chat Header controls */}
        <div className="border-b border-white/10 px-6 py-3.5 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8.5 w-8.5 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                ACT AI Assistant
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-500 truncate max-w-[200px] md:max-w-none">
                Interactive Assistant Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={pinCurrentChat}
              disabled={messages.length <= 1}
              className="px-2.5 py-1 rounded-lg border border-white/10 bg-slate-900 text-[10px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Pin Thread
            </button>

            <div className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5">
              <span className="text-[10px] text-slate-300 font-semibold">RAG Retrieval</span>
              <button
                type="button"
                onClick={() => setUseRAG(!useRAG)}
                className={`w-7 h-4 rounded-full transition-colors relative ${
                  useRAG ? "bg-purple-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3.5 h-3 bg-white rounded-full transition-transform ${
                    useRAG ? "translate-x-3" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="Gemini Pro">Gemini Pro</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Cohere">Cohere Command R+</option>
                <option value="Claude 3.5">Claude 3.5</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message Bubble Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 max-w-3xl ${
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div className={`h-8.5 w-8.5 rounded-lg flex items-center justify-center shrink-0 border ${
                msg.role === "user" 
                  ? "bg-slate-900 border-white/15 text-white" 
                  : "bg-purple-600/10 border-purple-500/20 text-purple-400"
              }`}>
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className="space-y-1">
                <div className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-purple-600 text-white" 
                    : "glass-panel border-white/5 text-slate-200"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 px-1.5 justify-end text-[9px] text-slate-500">
                  {msg.model && <span>{msg.model}</span>}
                  <span>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-start gap-3.5">
              <div className="h-8.5 w-8.5 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="glass-panel border-white/5 rounded-2xl p-4 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar Section */}
        <div className="border-t border-white/10 p-4 bg-slate-950/80 space-y-3.5">
          {/* File attachments render list */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] text-white">
                  <FileCheck className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="text-slate-500 hover:text-white p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Prompts Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                className="px-3.5 py-1.5 rounded-lg border border-white/5 bg-slate-900 text-[10px] text-slate-400 hover:text-white hover:border-purple-500/20 transition-all shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} 
            className="flex items-center gap-3 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5"
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
              accept=".pdf,.docx,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.mp3,.wav"
            />
            <button
              type="button"
              className="text-slate-400 hover:text-white"
              title="Attach files (PDF, DOCX, Images, Audio)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Link2 className="h-4 w-4" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={attachedFiles.length > 0 ? "Ask a question about the attached document..." : "Ask ACT anything..."}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() && attachedFiles.length === 0}
              className="p-1.5 rounded-lg bg-purple-600 text-white disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
