"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, Bot, User, Trash2, X, FileCheck, ChevronDown, 
  Cpu, Paperclip, Mic, MicOff, Search, Settings, PanelLeftClose, 
  PanelLeft, Copy, Check, RotateCcw, Edit3, Square, RefreshCw, Sun, Moon, Upload
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import Link from "next/link";

interface FileAttachment {
  name: string;
  size: number;
  type: string;
  data: string; // Base64 DataURL
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tokens?: number;
  model?: string;
  time: string;
  isStreaming?: boolean;
}

interface SavedChat {
  id: number;
  title: string;
  messages: Message[];
}

export default function ChatWorkspace() {
  const { isDark, toggleTheme } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  // Chat message states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  
  // Attachments
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Edit / Streaming control refs
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Sync active chat messages to localStorage when updated
  const saveCurrentChatState = (updatedMessages: Message[]) => {
    if (!activeChatId) {
      // Create new saved chat
      const firstUserMsg = updatedMessages.find(m => m.role === "user")?.content || "New Conversation";
      const title = firstUserMsg.slice(0, 24) + (firstUserMsg.length > 24 ? "..." : "");
      const newChat: SavedChat = {
        id: Date.now(),
        title,
        messages: updatedMessages
      };
      const updated = [newChat, ...savedChats];
      setSavedChats(updated);
      setActiveChatId(newChat.id);
      localStorage.setItem("act_assistant_saved_chats", JSON.stringify(updated));
    } else {
      const updated = savedChats.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      });
      setSavedChats(updated);
      localStorage.setItem("act_assistant_saved_chats", JSON.stringify(updated));
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      processFiles(files);
    }
  };

  // Clipboard paste handler for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        processFiles(imageFiles as any);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) processFiles(files);
  };

  const processFiles = (files: FileList | File[]) => {
    setUploadProgress(10);
    const total = files.length;
    let loaded = 0;

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
        loaded++;
        setUploadProgress(Math.round((loaded / total) * 100));
        if (loaded === total) {
          setTimeout(() => setUploadProgress(null), 800);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Simulated Streaming AI Response
  const streamResponse = (rawContent: string, modelName: string) => {
    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    setIsTyping(false);

    const assistantMsgId = `assistant_${Date.now()}`;
    const newAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      model: modelName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };

    setMessages(prev => {
      const next = [...prev, newAssistantMsg];
      saveCurrentChatState(next);
      return next;
    });

    let currentLength = 0;
    const increment = Math.ceil(rawContent.length / 50) || 2; // dynamic typing speed

    streamIntervalRef.current = setInterval(() => {
      currentLength += increment;
      if (currentLength >= rawContent.length) {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: rawContent, isStreaming: false };
          }
          return m;
        }));
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id === assistantMsgId) {
            return { ...m, content: rawContent.slice(0, currentLength) };
          }
          return m;
        }));
      }
    }, 25);
  };

  const stopStreaming = () => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      setMessages(prev => prev.map(m => {
        if (m.isStreaming) {
          return { ...m, isStreaming: false };
        }
        return m;
      }));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text || `Attached ${attachedFiles.length} file(s)`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setIsTyping(true);
    setAttachedFiles([]);

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
        useRAG: true
      });

      streamResponse(data.content, data.model || selectedModel);

    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      const errMsg: Message = {
        id: `assistant_err_${Date.now()}`,
        role: "assistant",
        content: err.message || "Unable to retrieve response from AI engine. Please verify credentials.",
        model: "System Error",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const next = [...prev, errMsg];
        saveCurrentChatState(next);
        return next;
      });
    }
  };

  // Copy Message Helper
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Regenerate Response Helper
  const handleRegenerate = () => {
    if (messages.length < 2) return;
    // Find last user message
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === "user");
    if (lastUserIndex === -1) return;
    const realIndex = messages.length - 1 - lastUserIndex;
    const text = messages[realIndex].content;
    
    // Trim history back to that user message
    const truncatedHistory = messages.slice(0, realIndex + 1);
    setMessages(truncatedHistory);
    handleSendMessage(text);
  };

  // Edit User Message
  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditVal(msg.content);
  };

  const handleSaveEdit = (id: string) => {
    const updated = messages.map(m => {
      if (m.id === id) {
        return { ...m, content: editVal };
      }
      return m;
    });
    setMessages(updated);
    setEditingMessageId(null);
    saveCurrentChatState(updated);
  };

  // Voice Speech Recognition
  const toggleVoiceInput = () => {
    if (isVoiceActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsVoiceActive(false);
      return;
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsVoiceActive(true);
      console.log("Voice recognition started...");
    };

    rec.onresult = (e: any) => {
      const resultText = e.results[0][0].transcript;
      setInputText(prev => prev ? `${prev} ${resultText}` : resultText);
    };

    rec.onerror = (err: any) => {
      console.error("Speech recognition error:", err);
      setIsVoiceActive(false);
    };

    rec.onend = () => {
      setIsVoiceActive(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Start a fresh empty chat workspace
  const handleNewChat = () => {
    stopStreaming();
    setMessages([]);
    setActiveChatId(null);
  };

  // Delete chat from list
  const handleDeleteChat = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedChats.filter(c => c.id !== id);
    setSavedChats(updated);
    localStorage.setItem("act_assistant_saved_chats", JSON.stringify(updated));
    if (activeChatId === id) {
      handleNewChat();
    }
  };

  // Search filtered chats
  const filteredChats = savedChats.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className="h-[calc(100vh-6rem)] max-w-7xl mx-auto flex rounded-3xl overflow-hidden border shadow-xl relative transition-all duration-300"
      style={{ backgroundColor: T.bgCard, borderColor: T.border }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-purple-600/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="p-8 rounded-2xl border-2 border-dashed border-purple-500 bg-black/80 text-white font-bold text-sm text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 animate-bounce text-purple-400" />
            Drop your documents or media anywhere to upload
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      <div 
        className={`transition-all duration-300 flex flex-col border-r h-full ${
          sidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
        style={{ borderColor: T.border, backgroundColor: isDark ? "#0b1424" : "#f8fafc" }}
      >
        <div className="p-4 flex flex-col h-full justify-between">
          <div className="space-y-4">
            {/* New Chat Button */}
            <Button 
              onClick={handleNewChat}
              className="w-full text-xs py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md rounded-xl"
            >
              + New Chat
            </Button>

            {/* Search Chats Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-[10px] focus:outline-none border shadow-inner"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              />
            </div>

            {/* Saved/Recent Chats */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Chats</p>
              {filteredChats.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No recent chats</p>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      stopStreaming();
                      setMessages(chat.messages);
                      setActiveChatId(chat.id);
                    }}
                    className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between cursor-pointer group transition-all ${
                      activeChatId === chat.id
                        ? "bg-purple-500/10 border-purple-500/30 text-purple-400 font-bold"
                        : "hover:bg-slate-500/5 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="truncate flex-1 pr-2">{chat.title}</span>
                    <button 
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-red-500 rounded transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Settings Footer */}
          <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: T.border }}>
            <Link href="/settings" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <Settings className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
            </Link>
            <span className="text-[8px] font-mono text-slate-500">v1.2.0</span>
          </div>
        </div>
      </div>

      {/* Main Chat Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header controls */}
        <div className="border-b px-6 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ borderColor: T.border, backgroundColor: isDark ? "#060d1a" : "#ffffff" }}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg border text-slate-400 hover:text-white transition-colors"
              style={{ borderColor: T.border }}
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: T.textPrimary }}>
                ACT AI Assistant
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Model Select */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="border rounded-xl px-3 py-1.5 text-[10px] focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                <option value="Gemini Pro" style={{ backgroundColor: T.bgCard }}>Gemini Pro</option>
                <option value="GPT-4o" style={{ backgroundColor: T.bgCard }}>GPT-4o</option>
                <option value="Cohere" style={{ backgroundColor: T.bgCard }}>Cohere Command R+</option>
                <option value="Claude 3.5" style={{ backgroundColor: T.bgCard }}>Claude 3.5</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border hover:bg-slate-500/10 transition-all shadow-sm"
              style={{ borderColor: T.border, color: T.textPrimary }}
            >
              {isDark ? <Sun className="h-3.5 w-3.5 text-yellow-500" /> : <Moon className="h-3.5 w-3.5 text-purple-600" />}
            </button>

            {/* User Profile */}
            <div className="h-8 w-8 rounded-full bg-purple-500/20 border flex items-center justify-center font-bold text-xs" style={{ borderColor: T.border, color: T.primaryBright }}>
              A
            </div>
          </div>
        </div>

        {/* Message Panels / Conversation Frame */}
        <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-6 space-y-6" style={{ backgroundColor: isDark ? "#060d1a" : "#fbfbfb" }}>
          {messages.length === 0 ? (
            /* Welcome Area */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-sm font-bold" style={{ color: T.textPrimary }}>ACT AI Assistant</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hi, I'm ACT AI Assistant. Upload files or ask anything.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-4 max-w-3xl ${
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                  msg.role === "user" 
                    ? "bg-purple-600/10 border-purple-500/20 text-purple-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-purple-500 bg-transparent"
                        style={{ color: T.textPrimary, borderColor: T.border }}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button onClick={() => setEditingMessageId(null)} variant="outline" className="text-[10px] py-1">
                          Cancel
                        </Button>
                        <Button onClick={() => handleSaveEdit(msg.id)} className="text-[10px] py-1 bg-purple-600 hover:bg-purple-700">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-2xl p-4 text-xs leading-relaxed border ${
                      msg.role === "user" 
                        ? "bg-purple-600 text-white border-purple-700 shadow-sm" 
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 shadow-sm"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}

                  {/* Message Action Controls */}
                  <div className="flex items-center gap-3 px-1 text-[9px] text-slate-400">
                    <span>{msg.time}</span>
                    {msg.model && <span className="font-mono text-purple-400">{msg.model}</span>}
                    
                    {!msg.isStreaming && msg.role === "assistant" && (
                      <button 
                        onClick={() => handleCopyMessage(msg.content)} 
                        className="hover:text-purple-400 flex items-center gap-1 font-semibold"
                        title="Copy Response"
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </button>
                    )}
                    {!msg.isStreaming && msg.role === "assistant" && (
                      <button 
                        onClick={handleRegenerate}
                        className="hover:text-purple-400 flex items-center gap-1 font-semibold"
                        title="Regenerate Output"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Regenerate
                      </button>
                    )}
                    {msg.role === "user" && editingMessageId !== msg.id && (
                      <button 
                        onClick={() => handleStartEdit(msg)} 
                        className="hover:text-purple-400 flex items-center gap-1 font-semibold"
                        title="Edit Message"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 flex gap-1.5 items-center shadow-sm">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Stop Stream Button when streaming */}
          {messages.some(m => m.isStreaming) && (
            <div className="flex justify-center pb-2">
              <button 
                onClick={stopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-bold shadow-sm transition-all"
              >
                <Square className="h-3 w-3 fill-red-500" />
                Stop Generating
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Workspace */}
        <div className="p-4 border-t flex flex-col space-y-3" style={{ borderColor: T.border, backgroundColor: isDark ? "#060d1a" : "#ffffff" }}>
          
          {/* File attachment chips */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9.5px] font-bold shadow-sm"
                  style={{ backgroundColor: T.bgHover, borderColor: T.border, color: T.primaryBright }}
                >
                  <FileCheck className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => removeAttachment(idx)} className="text-slate-400 hover:text-slate-600 p-0.5 ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress indicator */}
          {uploadProgress !== null && (
            <div className="flex items-center gap-3">
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-[8px] font-bold text-slate-400 shrink-0">{uploadProgress}%</span>
            </div>
          )}

          {/* Form rounded input bar */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} 
            className="flex items-center gap-3 border rounded-2xl px-4 py-3 shadow-md focus-within:border-purple-500/60 focus-within:ring-1 focus-within:ring-purple-500/30 transition-all"
            style={{ backgroundColor: T.bgInput, borderColor: T.border }}
          >
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileAttach}
              className="hidden"
              accept=".pdf,.docx,.ppt,.pptx,.txt,.md,.png,.jpg,.jpeg,.mp3,.wav,.mp4,.mov,.avi,.mkv,.webm,.csv,.xls,.xlsx,.json"
            />
            {/* Attach Button */}
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title="Attach files (PDF, Office, Media, CSV)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4" />
            </button>

            {/* Voice Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`transition-colors p-1 ${isVoiceActive ? "text-red-500" : "text-slate-400 hover:text-slate-200"}`}
              title={isVoiceActive ? "Listening... Click to stop" : "Speak to write"}
            >
              {isVoiceActive ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything or search context..."
              className="flex-1 bg-transparent text-xs text-slate-200 focus:outline-none placeholder-slate-400"
              style={{ color: T.textPrimary }}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() && attachedFiles.length === 0}
              className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-40 hover:bg-purple-700 active:scale-95 transition-all shadow-sm shadow-purple-500/20"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
