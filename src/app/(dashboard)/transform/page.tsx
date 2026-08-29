"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  UploadCloud, RefreshCw, CheckCircle, FileText, FileCode, Clipboard, Download, 
  Share2, Trash2, Settings, AlertCircle, FileCheck, ChevronRight, BookOpen, Cpu, 
  Volume2, Image as ImageIcon, Music, Video, Layers, ListChecks, HelpCircle, FileSpreadsheet, 
  Presentation, BarChart3, Wand2, Sparkles, Check, Play
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

// Detailed conversion mapping based on detected format
const CONVERSION_MAP: Record<string, string[]> = {
  pdf: ["Word (.docx)", "Excel (.xlsx)", "PowerPoint (.pptx)", "Images (.png)", "Text (.txt)", "Markdown (.md)"],
  doc: ["PDF (.pdf)", "PowerPoint (.pptx)", "HTML (.html)", "Markdown (.md)"],
  docx: ["PDF (.pdf)", "PowerPoint (.pptx)", "HTML (.html)", "Markdown (.md)"],
  xls: ["PDF (.pdf)", "CSV (.csv)", "Word (.docx)", "PowerPoint (.pptx)"],
  xlsx: ["PDF (.pdf)", "CSV (.csv)", "Word (.docx)", "PowerPoint (.pptx)"],
  ppt: ["PDF (.pdf)", "Images (.png)", "Word (.docx)", "Text (.txt)"],
  pptx: ["PDF (.pdf)", "Images (.png)", "Word (.docx)", "Text (.txt)"],
  csv: ["Excel (.xlsx)", "PDF (.pdf)"],
  txt: ["PDF (.pdf)", "Word (.docx)"],
  md: ["PDF (.pdf)", "Word (.docx)", "HTML (.html)"],
  png: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  jpg: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  jpeg: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  webp: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  tiff: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  bmp: ["PDF (.pdf)", "Word (OCR)", "Excel (Table OCR)", "Text (.txt)"],
  mp3: ["Transcript", "Summary", "Notes"],
  wav: ["Transcript", "Summary", "Notes"],
  m4a: ["Transcript", "Summary", "Notes"],
  aac: ["Transcript", "Summary", "Notes"],
  ogg: ["Transcript", "Summary", "Notes"],
  mp4: ["Transcript", "Summary", "Meeting Minutes"],
  mov: ["Transcript", "Summary", "Meeting Minutes"],
  avi: ["Transcript", "Summary", "Meeting Minutes"],
  mkv: ["Transcript", "Summary", "Meeting Minutes"],
  webm: ["Transcript", "Summary", "Meeting Minutes"]
};

// Available AI Transformations
const AI_TRANSFORMATIONS = [
  "None (Standard Conversion)", "Summarize", "Rewrite", "Translate", "Explain", "Simplify", 
  "Improve Writing", "Extract Tables", "Extract Key Points", "Extract Entities", 
  "Generate FAQ", "Generate MCQs", "Generate Flashcards", "Convert to JSON", 
  "Convert to Markdown", "OCR Text Extraction", "Create Blog Draft", "Create LinkedIn Post", 
  "Create Tweet Thread", "Create Presentation Script", "Generate Report", 
  "Generate Meeting Notes", "Generate Email", "Generate Documentation"
];

interface Project {
  id: string;
  name: string;
  category: string;
}

export default function TransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [sourceType, setSourceType] = useState<"file" | "text">("file");
  const [inputText, setInputText] = useState("");
  
  // File details
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedExt, setDetectedExt] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");
  
  // Output configuration
  const [targetFormat, setTargetFormat] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  const [aiTransform, setAiTransform] = useState("None (Standard Conversion)");
  const [selectedProjectId, setSelectedProjectId] = useState("none");
  const [projects, setProjects] = useState<Project[]>([]);

  // Pipeline execution status
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [processingTime, setProcessingTime] = useState(0);
  const [tokenUsage, setTokenUsage] = useState(0);

  const [outputPreview, setOutputPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load project binders for Project Integration selector
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_assistant_projects_workspace_details");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
          }
        } catch {}
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setErrorMsg("");
    resetForm();

    const nameParts = file.name.split(".");
    const ext = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "";
    setDetectedExt(ext);

    // Auto select target format
    const validTargets = CONVERSION_MAP[ext] || [];
    if (validTargets.length > 0) {
      setTargetFormat(validTargets[0]);
    } else {
      setTargetFormat("Text (.txt)");
    }

    const reader = new FileReader();

    if (
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.type === "text/csv" ||
      file.type === "application/json" ||
      ext === "md" ||
      ext === "csv" ||
      ext === "json" ||
      ext === "txt"
    ) {
      reader.onload = (event) => {
        setFileContent(event.target?.result as string || "");
        setSelectedFileBase64("");
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setSelectedFileBase64(event.target?.result as string || "");
        setFileContent("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setDetectedExt("");
    setTargetFormat("");
    setFileContent("");
    setSelectedFileBase64("");
    resetForm();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Estimates conversion processing speed in ms
  const estimateProcessingTime = () => {
    if (!selectedFile) return 3000;
    const size = selectedFile.size;
    if (detectedExt === "mp4" || detectedExt === "webm" || detectedExt === "mp3") {
      return 12000; // Audios/Videos take longer
    }
    if (size > 10 * 1024 * 1024) return 8000;
    return 4000;
  };

  const handleTransform = async () => {
    if (sourceType === "file" && !selectedFile) {
      setErrorMsg("Please upload a source file first.");
      return;
    }
    if (sourceType === "text" && !inputText.trim()) {
      setErrorMsg("Please paste or write some raw text first.");
      return;
    }

    setErrorMsg("");
    setStatus("converting");
    setProgress(5);
    setStage("1. Parsing document boundaries...");

    const totalEstimatedTime = estimateProcessingTime();
    const startTimestamp = Date.now();

    // Progress bar simulation matching estimated latency
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 5;
      });
    }, totalEstimatedTime / 18);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const promptModifier = aiTransform !== "None (Standard Conversion)" 
        ? `Additionally apply this AI action: ${aiTransform}` 
        : `Convert input context format to ${targetFormat}`;

      const payload = sourceType === "file"
        ? {
            fileData: selectedFileBase64 || undefined,
            text: fileContent || undefined,
            fileName: selectedFile?.name,
            fileType: selectedFile?.type,
            format: targetFormat,
            model: selectedModel,
            promptOverride: promptModifier,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          }
        : {
            text: inputText,
            format: targetFormat,
            model: selectedModel,
            promptOverride: promptModifier,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          };

      setStage("2. Executing semantic conversion via LLMSwitcher...");
      const data = await ApiClient.postTransform(payload);

      clearInterval(interval);
      setProgress(100);
      setStatus("done");
      setStage("Transformation output ready!");

      const duration = Date.now() - startTimestamp;
      const tokens = Math.floor(((fileContent || inputText).length + data.output.length) / 4.2) + 180;
      setProcessingTime(duration);
      setTokenUsage(tokens);
      setOutputPreview(data.output);

      // Save to global user-scoped History log
      saveToHistory({
        fileName: selectedFile ? selectedFile.name : "Text Snippet",
        action: `${sourceType === "file" ? detectedExt.toUpperCase() : "TXT"} → ${targetFormat}`,
        model: selectedModel,
        time: duration,
        tokens: tokens,
        size: selectedFile ? selectedFile.size : inputText.length,
      });

      // Save converted output to selected Project binder
      if (selectedProjectId !== "none") {
        saveFileToProject(selectedProjectId, selectedFile ? selectedFile.name : "Snippet.txt", data.output);
      }

      // Update Analytics
      updateAnalyticsMetrics(tokens);

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to finalize pipeline. Check API credentials.");
    }
  };

  const saveToHistory = (item: { fileName: string; action: string; model: string; time: number; tokens: number; size: number }) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history") || "[]";
      let historyList = [];
      try {
        historyList = JSON.parse(historyStr);
      } catch {}
      
      const newRecord = {
        id: `tr_${Date.now()}`,
        userId: "session_user",
        userEmail: "active_session",
        projectId: selectedProjectId !== "none" ? selectedProjectId : undefined,
        projectName: selectedProjectId !== "none" ? projects.find(p => p.id === selectedProjectId)?.name : undefined,
        sourceFileName: item.fileName,
        fileType: detectedExt || "txt",
        transformationType: item.action,
        modelUsed: item.model,
        processingTime: item.time,
        inputTokens: Math.floor(item.tokens * 0.4),
        outputTokens: Math.floor(item.tokens * 0.6),
        totalTokens: item.tokens,
        fileSize: item.size,
        status: "Success",
        createdAt: new Date().toISOString(),
        favorite: false
      };
      
      localStorage.setItem("act_transform_history", JSON.stringify([newRecord, ...historyList]));
    }
  };

  const saveFileToProject = (projId: string, originalName: string, outputText: string) => {
    if (typeof window !== "undefined") {
      const filesStr = localStorage.getItem("act_user_files") || "[]";
      let filesList = [];
      try {
        filesList = JSON.parse(filesStr);
      } catch {}

      const nameParts = originalName.split(".");
      const baseName = nameParts.slice(0, -1).join(".");
      const newFileName = `${baseName}_converted_${targetFormat.replace(/[^a-zA-Z0-9]/g, "_")}.md`;

      const newFileObj = {
        id: `f_${Date.now()}`,
        name: newFileName,
        size: outputText.length,
        type: "text/markdown",
        projectId: projId,
        uploadedAt: new Date().toISOString(),
        tag: "Output",
        summary: `AI generated transformation: ${aiTransform} on ${originalName}.`,
        favorite: false
      };

      localStorage.setItem("act_user_files", JSON.stringify([newFileObj, ...filesList]));
    }
  };

  const updateAnalyticsMetrics = (tokensUsed: number) => {
    if (typeof window !== "undefined") {
      const statsStr = localStorage.getItem("act_analytics_stats");
      let stats = { totalTransformations: 0, totalFiles: 0, totalTokens: 0 };
      if (statsStr) {
        try {
          stats = JSON.parse(statsStr);
        } catch {}
      }
      stats.totalTransformations += 1;
      stats.totalTokens += tokensUsed;
      localStorage.setItem("act_analytics_stats", JSON.stringify(stats));
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setProgress(0);
    setOutputPreview("");
    setErrorMsg("");
  };

  const downloadOutput = () => {
    if (!outputPreview) return;
    const blob = new Blob([outputPreview], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ACT_Converted_${detectedExt || "output"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const validOutputFormats = detectedExt ? (CONVERSION_MAP[detectedExt] || ["Text (.txt)"]) : ["Text (.txt)"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
          Universal Document Processing Suite
        </h1>
        <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
          Convert, process, edit, and apply AI transformations across PDF, Word, Excel, PowerPoint, Images, Audio, and Video files.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Config Panel */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2" style={{ borderColor: T.border }}>
              1. Upload Document / File
            </h3>

            {/* Input Selection Tabs */}
            <div className="flex rounded-xl p-1 border" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
              <button
                type="button"
                onClick={() => { setSourceType("file"); resetForm(); }}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all`}
                style={{
                  backgroundColor: sourceType === "file" ? T.bgActive : "transparent",
                  color: sourceType === "file" ? T.textActive : T.textSecondary
                }}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => { setSourceType("text"); resetForm(); }}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all`}
                style={{
                  backgroundColor: sourceType === "text" ? T.bgActive : "transparent",
                  color: sourceType === "text" ? T.textActive : T.textSecondary
                }}
              >
                Raw Text Snippet
              </button>
            </div>

            {sourceType === "file" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.rtf,.csv,image/*,audio/*,video/*"
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-purple-500 bg-slate-900"
                  style={{ borderColor: T.border }}
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <FileCheck className="h-9 w-9 text-emerald-400 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white truncate max-w-xs mx-auto">{selectedFile.name}</p>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
                          Detected: {detectedExt}
                        </span>
                      </div>
                      <button onClick={removeFile} className="text-[10px] text-red-400 font-bold block mx-auto underline">
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <UploadCloud className="h-10 w-10 text-slate-500 mx-auto" />
                      <p className="text-xs font-semibold text-slate-200">Drag and drop file, or click to browse</p>
                      <p className="text-[9px] text-slate-500">Supports PDF, Office (DOCX, XLSX, PPTX), CSV, Images, Audio, and Video files</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <textarea
                rows={5}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste or write raw copy context here..."
                className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200"
                style={{ borderColor: T.border }}
              />
            )}

            {/* Target Output Configuration */}
            {selectedFile && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Output Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200"
                  style={{ borderColor: T.border }}
                >
                  {validOutputFormats.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* AI Enhancement option */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Optional AI Transformation</label>
              <select
                value={aiTransform}
                onChange={(e) => setAiTransform(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200"
                style={{ borderColor: T.border }}
              >
                {AI_TRANSFORMATIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Project Integration Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Save to Project Workspace</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200"
                style={{ borderColor: T.border }}
              >
                <option value="none">Do Not Save to Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            {/* Model & Execution */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Model Engine</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200"
                style={{ borderColor: T.border }}
              >
                <option value="Gemini Pro">Gemini Pro (Default)</option>
                <option value="GPT-4o">GPT-4o (High Fidelity)</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            {errorMsg && (
              <p className="text-red-400 text-[10px] font-bold text-center">{errorMsg}</p>
            )}

            {status === "converting" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-purple-400 font-bold animate-pulse">
                  <span>{stage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <Button onClick={handleTransform} className="w-full py-2.5 text-xs text-white bg-purple-650 hover:bg-purple-750">
                Execute Process Suite
                <Wand2 className="ml-2 h-4 w-4" />
              </Button>
            )}

          </GlassCard>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-7">
          <GlassCard className="min-h-[520px] flex flex-col justify-between overflow-hidden" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="px-5 py-3 border-b flex justify-between items-center bg-slate-950/40" style={{ borderColor: T.border }}>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-purple-400 animate-spin" />
                OUTPUT RESOLUTION PANEL
              </span>

              {status === "done" && outputPreview && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(outputPreview); alert("Copied output!"); }}
                    className="p-1 rounded bg-slate-900 border hover:bg-white/5 text-slate-300"
                    style={{ borderColor: T.border }}
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={downloadOutput}
                    className="p-1 rounded bg-slate-900 border hover:bg-white/5 text-slate-300"
                    style={{ borderColor: T.border }}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {status === "done" && outputPreview ? (
                <div className="space-y-4">
                  {/* Success indicator animation */}
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <Check className="h-4 w-4" />
                    <span>File transformed and structured successfully! Latency: {(processingTime / 1000).toFixed(2)}s</span>
                  </div>

                  <pre className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {outputPreview}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center py-20 text-slate-500">
                  <Cpu className="h-10 w-10 text-slate-600 mb-3" />
                  <p className="text-xs font-bold text-slate-400">Processing Engine Standby</p>
                  <p className="text-[10px] max-w-xs mt-1 text-slate-500">Configure parameters and upload documents. ACT will extract and transform contents dynamically.</p>
                </div>
              )}
            </div>

            {status === "done" && (
              <div className="p-4 bg-slate-950/20 border-t text-[10px] text-slate-500 flex justify-between" style={{ borderColor: T.border }}>
                <span>Tokens Consumed: {tokenUsage.toLocaleString()}</span>
                <span>Workspace Saved: {selectedProjectId !== "none" ? "Yes" : "No"}</span>
              </div>
            )}
          </GlassCard>
        </div>

      </div>

    </div>
  );
}
