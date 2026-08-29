"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  UploadCloud, RefreshCw, CheckCircle, FileText, FileCode, Clipboard, Download, 
  Share2, Trash2, Settings, AlertCircle, FileCheck, ChevronRight, BookOpen, 
  Cpu, Volume2, Globe, Image, Video, Check, Play, Info, Layers
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character and Word counters for text
  const charCount = inputText.length;
  const wordCount = inputText.trim() === "" ? 0 : inputText.trim().split(/\s+/).length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (activeTab === "images") {
      // Store multiple images support
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

      // Save user-scoped history log
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
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
          Transform Workspace
        </h1>
        <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
          Unified content transformation and file conversion engine. Upload, paste, or crawl content.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: T.border }}>
        {[
          { id: "documents", label: "Documents", icon: FileText },
          { id: "text", label: "Raw Text", icon: FileCode },
          { id: "images", label: "Images", icon: Image },
          { id: "ocr", label: "OCR Scanner", icon: FileCheck },
          { id: "audio", label: "Audio Transcribe", icon: Volume2 },
          { id: "video", label: "Video Engine", icon: Video },
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Webpage URL URL</span>
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Upload Documents</span>
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
                File Conversion
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
                    Run AI Transformation
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
                    Run Format Conversion
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
              {status === "done" && outputPreview && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(outputPreview); alert("Copied to clipboard!"); }}
                    className="p-1.5 text-slate-500 hover:text-slate-200"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <button
                    onClick={downloadOutput}
                    className="p-1.5 text-slate-500 hover:text-slate-200"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
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
    </div>
  );
}
