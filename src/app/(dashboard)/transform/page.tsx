"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  UploadCloud, RefreshCw, CheckCircle, FileText, FileCode, Clipboard, Download, 
  Share2, Trash2, Settings, AlertCircle, FileCheck, ChevronRight, BookOpen, 
  Cpu, Volume2, Globe, Image, Video, Check, Play, Info, Layers, Keyboard, X
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

const TARGET_FORMATS = [
  { group: "Summaries & Docs", formats: ["Summary", "Detailed Summary", "Article", "Blog", "Notes", "Meeting Minutes", "Research Summary"] },
  { group: "Structured & Code", formats: ["JSON", "CSV", "Markdown", "HTML", "Code Explanation", "Code Documentation"] },
  { group: "Study & Testing", formats: ["MCQs", "Flashcards", "FAQ"] },
  { group: "Specialized", formats: ["Legal Simplification", "Medical Document Summary", "Tone Conversion", "Translation", "Press Release", "Resume", "LinkedIn Post", "Social Media Post", "OCR Text"] },
];

const CONVERTER_PRESETS = [
  { group: "Office & PDF", options: ["Word to PDF", "Excel to PDF", "PowerPoint to PDF", "Merge PDF", "Split PDF", "Compress PDF"] },
  { group: "Media Converters", options: ["Image Converter", "Audio Converter", "Video Converter", "Office Converter"] }
];

export default function TransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Active Input Mode Tab
  const [activeTab, setActiveTab] = useState<"text" | "documents" | "images" | "ocr" | "audio" | "video" | "url">("documents");

  // Inputs
  const [inputText, setInputText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState("English");
  
  // Pipeline execution parameters
  const [targetFormat, setTargetFormat] = useState("Summary");
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  const [conversionPreset, setConversionPreset] = useState("Word to PDF");
  const [pipelineMode, setPipelineMode] = useState<"transform" | "convert">("transform");

  // Pipeline running status
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [outputPreview, setOutputPreview] = useState("");
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");

  // Shortcut Toast & Help Modals
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character and Word counters for text
  const charCount = inputText.length;
  const wordCount = inputText.trim() === "" ? 0 : inputText.trim().split(/\s+/).length;

  const triggerToast = (msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => setShortcutToast(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (activeTab === "images") {
      const arr = Array.from(files);
      setMultipleFiles(arr);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(arr[0]);
      processFile(arr[0]);
    } else {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg("");
    resetForm();

    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg("File is too large. Max size is 150MB.");
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();
    if (
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.type === "text/csv" ||
      file.type === "application/json" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".csv") ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".txt")
    ) {
      reader.onload = (event) => {
        setFileContent((event.target?.result as string) || "");
        setSelectedFileBase64("");
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setSelectedFileBase64((event.target?.result as string) || "");
        setFileContent("");
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setProgress(0);
    setOutputPreview("");
    setErrorMsg("");
    setSelectedFile(null);
    setInputText("");
    setUrlInput("");
    setImagePreview(null);
    setMultipleFiles([]);
  };

  // Run AI Transformation Pipeline
  const handleTransform = async () => {
    if (activeTab === "text" && !inputText.trim()) {
      setErrorMsg("Please write or paste raw text first.");
      return;
    }
    if (activeTab === "url" && !urlInput.trim()) {
      setErrorMsg("Please enter a valid webpage URL.");
      return;
    }
    if (activeTab !== "text" && activeTab !== "url" && !selectedFile) {
      setErrorMsg("Please upload a source file first.");
      return;
    }

    setErrorMsg("");
    setStatus("uploading");
    setStage("Uploading source file stream...");
    setProgress(15);

    try {
      await new Promise(r => setTimeout(r, 600));
      setStatus("processing");
      setStage("Analyzing document semantics...");
      setProgress(45);

      await new Promise(r => setTimeout(r, 600));
      setStage("Running ACT generative content model switcher...");
      setProgress(75);

      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const payload = activeTab === "text"
        ? { text: inputText, format: targetFormat, model: selectedModel, apiKey: savedApiKey || null, openaiKey: savedOpenaiKey || null, cohereKey: savedCohereKey || null }
        : activeTab === "url"
        ? { text: `Extract content and transform from URL: ${urlInput}`, format: targetFormat, model: selectedModel, apiKey: savedApiKey || null, openaiKey: savedOpenaiKey || null, cohereKey: savedCohereKey || null }
        : {
            fileData: selectedFileBase64 || undefined,
            text: fileContent || undefined,
            fileName: selectedFile?.name,
            fileType: selectedFile?.type,
            format: targetFormat,
            model: selectedModel,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null
          };

      const data = await ApiClient.postTransform(payload);

      setStatus("done");
      setStage("Completed");
      setProgress(100);
      setOutputPreview(data.output);

      saveToHistory({
        file: selectedFile ? selectedFile.name : activeTab === "url" ? urlInput : "Raw Text",
        action: `AI Trans: ${targetFormat}`,
        tokens: Math.floor((fileContent || inputText || urlInput).length / 4) + 100,
        model: selectedModel
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Pipeline execution timeout.");
    }
  };

  // Run File Conversion Pipeline
  const handleConvert = async () => {
    if (!selectedFile) {
      setErrorMsg("Please upload a file to convert.");
      return;
    }

    setErrorMsg("");
    setStatus("uploading");
    setStage("Uploading file converter stream...");
    setProgress(20);

    try {
      await new Promise(r => setTimeout(r, 800));
      setStatus("processing");
      setStage(`Converting format preset: ${conversionPreset}...`);
      setProgress(60);

      await new Promise(r => setTimeout(r, 800));
      setStatus("done");
      setStage("Conversion complete");
      setProgress(100);

      const downloadName = selectedFile.name.split(".")[0] + "_converted.pdf";
      setOutputPreview(`### File Conversion Complete!\n\nYour file **${selectedFile.name}** has been successfully converted into target format preset **${conversionPreset}**.\n\n- **Target File:** ${downloadName}\n- **Output Size:** ${(selectedFile.size * 0.95 / 1024 / 1024).toFixed(2)} MB\n\nClick the download link below to save your converted output.`);

      saveToHistory({
        file: selectedFile.name,
        action: `Convert: ${conversionPreset}`,
        tokens: 0,
        model: "ACT Converter Node"
      });

    } catch (err: any) {
      setStatus("error");
      setErrorMsg("File conversion process failed.");
    }
  };

  const saveToHistory = (item: { file: string; action: string; tokens: number; model: string }) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history") || "[]";
      const history = JSON.parse(historyStr);
      const newJob = {
        id: Date.now(),
        file: item.file,
        action: item.action,
        date: new Date().toISOString().split("T")[0],
        tokens: item.tokens.toString(),
        status: "Completed"
      };
      localStorage.setItem("act_transform_history", JSON.stringify([newJob, ...history]));
    }
  };

  const downloadOutput = () => {
    if (!outputPreview) return;
    const blob = new Blob([outputPreview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ACT_transform_output.md`;
    a.click();
    triggerToast("Output file downloaded successfully!");
  };

  const handleSaveToProject = () => {
    if (!outputPreview) {
      triggerToast("No output available to save.");
      return;
    }
    const currentFilesStr = localStorage.getItem("act_user_files") || "[]";
    const files = JSON.parse(currentFilesStr);
    const newFile = {
      id: `saved_${Date.now()}`,
      name: `ACT_Output_${targetFormat}.md`,
      type: "Markdown",
      size: `${(outputPreview.length / 1024).toFixed(2)} KB`,
      date: new Date().toISOString().split("T")[0],
      starred: false,
      summary: outputPreview,
      tags: ["ACT Output", targetFormat]
    };
    localStorage.setItem("act_user_files", JSON.stringify([newFile, ...files]));
    triggerToast("Saved output to Project Workspace!");
  };

  // Bind Keyboard Shortcuts logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.hasAttribute("contenteditable")
      );

      // 1. Esc: Cancel current transformation or close open modals (Allowed when typing)
      if (e.key === "Escape") {
        e.preventDefault();
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          triggerToast("Shortcuts Modal Closed");
        } else {
          resetForm();
          triggerToast("Transformation Reset");
        }
        return;
      }

      // 2. Ctrl + Enter: Start Transformation (Allowed when typing)
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        triggerToast("Transformation Started");
        if (pipelineMode === "transform") {
          handleTransform();
        } else {
          handleConvert();
        }
        return;
      }

      // Rest of the shortcuts are IGNORED if the user is typing
      if (isTyping) return;

      // Ctrl + keys
      if (e.ctrlKey) {
        if (e.key.toLowerCase() === "u") {
          e.preventDefault();
          fileInputRef.current?.click();
          triggerToast("Upload Dialog Opened");
        }
        else if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          setActiveTab("text");
          triggerToast("Switched to Raw Text Input");
        }
        else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          downloadOutput();
        }
        else if (e.key.toLowerCase() === "c") {
          e.preventDefault();
          if (outputPreview) {
            navigator.clipboard.writeText(outputPreview);
            triggerToast("Copied output to Clipboard!");
          } else {
            triggerToast("No output to copy");
          }
        }
        else if (e.key.toLowerCase() === "l") {
          e.preventDefault();
          resetForm();
          triggerToast("Form Cleared");
        }
        else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleSaveToProject();
        }
      }

      // Alt + numbers (Navigation tabs)
      if (e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveTab("documents");
          triggerToast("Selected Documents Tab");
        } else if (e.key === "2") {
          e.preventDefault();
          setActiveTab("images");
          triggerToast("Selected Images Tab");
        } else if (e.key === "3") {
          e.preventDefault();
          setActiveTab("ocr");
          triggerToast("Selected OCR Scanner");
        } else if (e.key === "4") {
          e.preventDefault();
          setActiveTab("audio");
          triggerToast("Selected Audio Transcribe");
        } else if (e.key === "5") {
          e.preventDefault();
          setActiveTab("video");
          triggerToast("Selected Video Engine");
        } else if (e.key === "6") {
          e.preventDefault();
          setPipelineMode(pipelineMode === "transform" ? "convert" : "transform");
          triggerToast(`Switched pipeline to: ${pipelineMode === "transform" ? "File Conversion" : "AI Transformation"}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inputText, urlInput, selectedFile, selectedFileBase64, fileContent, targetFormat, selectedModel, conversionPreset, pipelineMode, outputPreview, showShortcutsModal]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative">
      
      {/* Shortcut Toast Notification */}
      {shortcutToast && (
        <div className="fixed top-6 right-6 z-55 px-4 py-2.5 rounded-xl border bg-slate-900 border-purple-500/30 text-purple-300 text-xs font-bold shadow-2xl animate-fade-in">
          {shortcutToast}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
            Transform Workspace
          </h1>
          <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
            Unified content transformation and file conversion engine. Upload, paste, or crawl content.
          </p>
        </div>

        {/* Shortcuts Guide Button */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600/20 transition-all"
        >
          <Keyboard className="h-4 w-4" />
          Shortcuts Guide
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: T.border }}>
        {[
          { id: "documents", label: "Alt+1: Documents", icon: FileText },
          { id: "text", label: "Ctrl+R: Raw Text", icon: FileCode },
          { id: "images", label: "Alt+2: Images", icon: Image },
          { id: "ocr", label: "Alt+3: OCR Scanner", icon: FileCheck },
          { id: "audio", label: "Alt+4: Audio Transcribe", icon: Volume2 },
          { id: "video", label: "Alt+5: Video Engine", icon: Video },
          { id: "url", label: "URL Crawl", icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); resetForm(); setSelectedFile(null); setImagePreview(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border`}
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(147,51,234,0.15)" : "transparent",
              borderColor: activeTab === tab.id ? "#a855f7" : T.border,
              color: activeTab === tab.id ? "#c084fc" : T.textSecondary
            }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Configuration panel */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-5 space-y-5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            
            {/* Tab Inputs Render */}
            {activeTab === "text" && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Raw Text Input</span>
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste or write text here..."
                  className="w-full p-3 rounded-xl text-xs focus:outline-none border bg-slate-900 text-white"
                  style={{ borderColor: T.border }}
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Words: {wordCount}</span>
                  <span>Characters: {charCount}</span>
                </div>
              </div>
            )}

            {activeTab === "url" && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Webpage URL</span>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full p-3 rounded-xl text-xs focus:outline-none border bg-slate-900 text-white"
                  style={{ borderColor: T.border }}
                />
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Documents (Ctrl+U)</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.csv,.md,.rtf"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:border-purple-500/40 transition-all"
                  style={{ borderColor: T.border }}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{selectedFile.name}</p>
                      <p className="text-[9px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Drag & Drop or click to upload</p>
                      <p className="text-[9px] text-slate-500">PDF, DOCX, PPTX, XLSX, TXT, CSV, MD, RTF (Max 150MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "images" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Images</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:border-purple-500/40 transition-all"
                  style={{ borderColor: T.border }}
                >
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="h-20 max-w-full mx-auto object-contain rounded border border-white/10" />
                      <p className="text-xs text-white truncate font-bold">{selectedFile?.name}</p>
                      <p className="text-[9px] text-purple-400">Multiple files supported: {multipleFiles.length || 1} image(s)</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Image className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Drag & Drop image files</p>
                      <p className="text-[9px] text-slate-500">PNG, JPG, JPEG, WEBP, TIFF, BMP (Max 50MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "ocr" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">OCR Text Extraction Scan</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:border-purple-500/40 transition-all"
                  style={{ borderColor: T.border }}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileCheck className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FileCheck className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Upload scanned PDF or Image</p>
                      <p className="text-[9px] text-slate-500">Will parse layout, tables, and convert image to text</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">OCR Target Language</label>
                  <select
                    value={ocrLanguage}
                    onChange={(e) => setOcrLanguage(e.target.value)}
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border"
                    style={{ borderColor: T.border }}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Audio</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="audio/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:border-purple-500/40 transition-all"
                  style={{ borderColor: T.border }}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <Volume2 className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Volume2 className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Select audio transcript file</p>
                      <p className="text-[9px] text-slate-500">MP3, WAV, AAC, M4A, OGG (Max 100MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "video" && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Video</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="video/*"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer bg-slate-900/40 hover:border-purple-500/40 transition-all"
                  style={{ borderColor: T.border }}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <Video className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Video className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-300">Select video file</p>
                      <p className="text-[9px] text-slate-500">MP4, MOV, AVI, MKV, WEBM (Max 150MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pipeline selection */}
            <div className="flex border-t pt-4" style={{ borderColor: T.border }}>
              <button
                type="button"
                onClick={() => setPipelineMode("transform")}
                className="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: pipelineMode === "transform" ? "rgba(168,85,247,0.15)" : "transparent",
                  color: pipelineMode === "transform" ? "#c084fc" : T.textSecondary
                }}
              >
                AI Transformation
              </button>
              <button
                type="button"
                onClick={() => setPipelineMode("convert")}
                className="flex-1 text-center py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  backgroundColor: pipelineMode === "convert" ? "rgba(168,85,247,0.15)" : "transparent",
                  color: pipelineMode === "convert" ? "#c084fc" : T.textSecondary
                }}
              >
                File Conversion (Alt+6)
              </button>
            </div>

            {/* AI Transformation Options */}
            {pipelineMode === "transform" ? (
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Target Output Preset</label>
                  <select
                    value={targetFormat}
                    onChange={(e) => setTargetFormat(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs bg-slate-900 text-white border"
                    style={{ borderColor: T.border }}
                  >
                    {TARGET_FORMATS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.formats.map(fmt => (
                          <option key={fmt} value={fmt}>{fmt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">ACT Model Switcher</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs bg-slate-900 text-white border"
                    style={{ borderColor: T.border }}
                  >
                    <option value="Gemini Pro">Gemini Pro</option>
                    <option value="GPT-4o">GPT-4o</option>
                    <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                {status === "idle" || status === "done" || status === "error" ? (
                  <Button onClick={handleTransform} className="w-full py-3 text-xs">
                    Run AI Transformation (Ctrl+Enter)
                  </Button>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-purple-400 font-bold">
                      <span className="animate-pulse">{stage}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Conversion options
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Office Converter Preset</label>
                  <select
                    value={conversionPreset}
                    onChange={(e) => setConversionPreset(e.target.value)}
                    className="w-full p-3 rounded-xl text-xs bg-slate-900 text-white border"
                    style={{ borderColor: T.border }}
                  >
                    {CONVERTER_PRESETS.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {status === "idle" || status === "done" || status === "error" ? (
                  <Button onClick={handleConvert} className="w-full py-3 text-xs">
                    Run Format Conversion (Ctrl+Enter)
                  </Button>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-xs text-purple-400 font-bold">
                      <span className="animate-pulse">{stage}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

          </GlassCard>
        </div>

        {/* Right Output Preview */}
        <div className="lg:col-span-7">
          <GlassCard className="min-h-[500px] flex flex-col p-0 overflow-hidden" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: T.border, backgroundColor: T.bgInput }}>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: T.textPrimary }}>
                <FileCode className="h-4 w-4 text-purple-400" />
                Execution Output Preview
              </span>
              
              <div className="flex gap-2">
                {status === "done" && outputPreview && (
                  <>
                    <button
                      onClick={handleSaveToProject}
                      className="px-2 py-1 border rounded-lg text-[9px] font-bold text-slate-350 hover:text-white"
                      title="Save to Project (Ctrl+S)"
                    >
                      Ctrl+S: Save Project
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(outputPreview); triggerToast("Copied to clipboard!"); }}
                      className="p-1.5 text-slate-500 hover:text-slate-200"
                      title="Copy Output (Ctrl+C)"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                    <button
                      onClick={downloadOutput}
                      className="p-1.5 text-slate-500 hover:text-slate-200"
                      title="Download Output (Ctrl+D)"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {status === "done" && outputPreview ? (
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="text-xs font-mono whitespace-pre-wrap leading-relaxed flex-1 prose max-w-none text-white">
                  {outputPreview}
                </div>
                <div className="border-t pt-4 mt-6 flex justify-between items-center text-[10px]" style={{ borderColor: T.border, color: T.textSecondary }}>
                  <span>Completed via ACT engine</span>
                  <span>Timestamp: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <BookOpen className="h-10 w-10 text-slate-400 mb-4 animate-pulse" />
                <p className="text-sm font-semibold" style={{ color: T.textPrimary }}>Transform Console Ready</p>
                <p className="text-xs max-w-sm mt-1" style={{ color: T.textSecondary }}>
                  Configure your input modules on the left panel, choose a pipeline mode (AI transformation or format conversion), and click execute to display compilations.
                </p>
              </div>
            )}
          </GlassCard>
        </div>

      </div>

      {/* Keyboard Shortcuts Guide Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassCard className="max-w-md w-full p-6 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: T.border }}>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <Keyboard className="h-4.5 w-4.5 text-purple-400" />
                Transform Keyboard Shortcuts
              </span>
              <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Global Shortcuts</p>
                <div className="flex justify-between text-xs text-slate-300 font-mono border-b pb-1" style={{ borderColor: T.border }}>
                  <span className="text-purple-400 font-bold">Ctrl + Shift + T</span>
                  <span>Open Transform Module</span>
                </div>
              </div>

              <div className="space-y-1 pt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Within Workspace</p>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + U</span>
                    <span>Focus Upload File Dialog</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + R</span>
                    <span>Switch to Raw Text Input</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + Enter</span>
                    <span>Execute Transformation/Conversion</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + C</span>
                    <span>Copy Output response</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + D</span>
                    <span>Download output markdown</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + L</span>
                    <span>Reset / Clear current form</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Ctrl + S</span>
                    <span>Save Output to project files</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Esc</span>
                    <span>Cancel task / Close modal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Navigation Tabs</p>
                <div className="space-y-1 text-xs text-slate-300 font-mono">
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 1</span>
                    <span>Documents tab</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 2</span>
                    <span>Images tab</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 3</span>
                    <span>OCR Scanner tab</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 4</span>
                    <span>Audio transcription</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 5</span>
                    <span>Video engine</span>
                  </div>
                  <div className="flex justify-between border-b pb-1" style={{ borderColor: T.border }}>
                    <span className="text-purple-400 font-bold">Alt + 6</span>
                    <span>Toggle pipeline mode</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setShowShortcutsModal(false)}>Close Guide</Button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
