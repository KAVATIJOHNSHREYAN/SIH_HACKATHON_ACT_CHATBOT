"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, RefreshCw, CheckCircle, FileText, FileCode, Clipboard, Download, 
  Share2, Trash2, Settings, AlertCircle, FileCheck, ChevronRight, BookOpen, Cpu, 
  Volume2, Image as ImageIcon, Music, Video, Layers, ListChecks, HelpCircle, FileSpreadsheet, 
  Presentation, BarChart3, Wand2, Sparkles, Check, Play, AlignLeft, Eye
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

// Import real file generation libraries
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";

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
  txt: ["PDF (.pdf)", "Word (.docx)", "Markdown (.md)"],
  md: ["PDF (.pdf)", "Word (.docx)", "HTML (.html)"],
  png: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  jpg: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  jpeg: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  webp: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  tiff: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  bmp: ["PDF (.pdf)", "Word (.docx)", "Excel (.xlsx)", "Text (.txt)"],
  mp3: ["Word (.docx)", "Text (.txt)", "Markdown (.md)"],
  wav: ["Word (.docx)", "Text (.txt)", "Markdown (.md)"],
  m4a: ["Word (.docx)", "Text (.txt)", "Markdown (.md)"],
  aac: ["Word (.docx)", "Text (.txt)", "Markdown (.md)"],
  ogg: ["Word (.docx)", "Text (.txt)", "Markdown (.md)"],
  mp4: ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"],
  mov: ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"],
  avi: ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"],
  mkv: ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"],
  webm: ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"]
};

// Available AI Transformations grouped logically
const AI_TRANSFORMATIONS = [
  {
    group: "Summarization",
    options: ["Short Summary", "Detailed Summary", "Executive Summary", "Bullet Summary"]
  },
  {
    group: "Notes Generation",
    options: ["Student Notes", "Study Notes", "Meeting Notes", "Lecture Notes"]
  },
  {
    group: "Testing & Quizzes",
    options: ["FAQ Generation", "MCQ - Easy", "MCQ - Medium", "MCQ - Hard", "MCQ - Answer Key", "Flashcard Generation", "Question & Answer Generation", "Generate Quiz", "Generate Interview Questions", "Generate Assignment Questions"]
  },
  {
    group: "Extractions",
    options: ["Key Points Extraction", "Action Items Extraction", "Important Dates Extraction", "Entity Extraction", "Table Extraction", "OCR Text Extraction"]
  },
  {
    group: "Code & Structure",
    options: ["JSON Conversion", "Markdown Conversion", "Documentation Generation"]
  },
  {
    group: "Content Creation",
    options: ["Blog Generation", "LinkedIn Post Generation", "Tweet/X Thread Generation", "Email Generation", "Report Generation", "Presentation Content Generation"]
  },
  {
    group: "Simplification & Rewrite",
    options: ["Explain Like I'm 5", "Technical Explanation", "Simplify Content", "Rewrite Content", "Grammar Correction", "Professional Rewrite"]
  },
  {
    group: "Tone Conversion",
    options: ["Formal Tone", "Casual Tone", "Academic Tone", "Business Tone", "Marketing Tone"]
  },
  {
    group: "Advanced Research",
    options: ["Compare Two Documents", "Detect Duplicate Content", "Generate Learning Objectives", "Generate Course Material"]
  }
];

interface Project {
  id: string;
  name: string;
  category: string;
}

export default function TransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;
  const router = useRouter();

  // Mode Selection: "transform" | "convert" | "both"
  const [processingMode, setProcessingMode] = useState<"transform" | "convert" | "both">("transform");

  // Input Type selection
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
  const [aiTransform, setAiTransform] = useState("Detailed Summary");
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

  // Load project binders
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
      setTargetFormat("PDF (.pdf)");
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

  const estimateProcessingTime = () => {
    if (!selectedFile) return 3000;
    const size = selectedFile.size;
    if (detectedExt === "mp4" || detectedExt === "webm" || detectedExt === "mp3") {
      return 14000;
    }
    if (size > 10 * 1024 * 1024) return 9000;
    return 5000;
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
    setStage("1. Extracting data boundaries...");

    const totalEstimatedTime = estimateProcessingTime();
    const startTimestamp = Date.now();

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 6;
      });
    }, totalEstimatedTime / 15);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      // Pipeline prompts based on mode selected
      let finalPrompt = "";
      if (processingMode === "transform") {
        finalPrompt = `Apply this AI transformation preset: ${aiTransform}`;
      } else if (processingMode === "convert") {
        finalPrompt = `Convert input context directly to ${targetFormat}`;
      } else {
        finalPrompt = `First apply AI transformation: ${aiTransform}, then format/convert output for ${targetFormat} schema representation.`;
      }

      const payload = sourceType === "file"
        ? {
            fileData: selectedFileBase64 || undefined,
            text: fileContent || undefined,
            fileName: selectedFile?.name,
            fileType: selectedFile?.type,
            format: targetFormat || "PDF (.pdf)",
            model: selectedModel,
            promptOverride: finalPrompt,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          }
        : {
            text: inputText,
            format: targetFormat || "PDF (.pdf)",
            model: selectedModel,
            promptOverride: finalPrompt,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          };

      setStage("2. Compiling document structures via LLMSwitcher...");
      const data = await ApiClient.postTransform(payload);

      clearInterval(interval);
      setProgress(100);
      setStatus("done");
      setStage("Transformation compilation completed successfully!");

      const duration = Date.now() - startTimestamp;
      const tokens = Math.floor(((fileContent || inputText).length + data.output.length) / 4) + 200;
      setProcessingTime(duration);
      setTokenUsage(tokens);
      setOutputPreview(data.output);

      // Save to global user-scoped History log
      saveToHistory({
        fileName: selectedFile ? selectedFile.name : "Text Paste",
        action: `${processingMode.toUpperCase()}: ${sourceType === "file" ? detectedExt.toUpperCase() : "TXT"} → ${targetFormat || "PDF"}`,
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
      setErrorMsg(err.message || "Failed to execute pipeline. Confirm keys configuration.");
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
      const newFileName = `${baseName}_transformed.md`;

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

  // ─── Real Binary File Download Generator ──────────────────────────────────
  const downloadOutput = async () => {
    if (!outputPreview) return;

    const baseName = selectedFile 
      ? selectedFile.name.split(".").slice(0, -1).join(".") 
      : "ACT_Output";

    // 1. Generate real PDF binary
    if (targetFormat.includes("PDF") || processingMode === "convert" && targetFormat.includes("PDF")) {
      const doc = new jsPDF();
      const splitText = doc.splitTextToSize(outputPreview, 180);
      let y = 15;
      for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(splitText[i], 10, y);
        y += 6;
      }
      const pdfBlob = doc.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      triggerBlobDownload(url, `${baseName}.pdf`);
      return;
    }

    // 2. Generate real DOCX binary
    if (targetFormat.includes("Word") || targetFormat.includes("DOCX") || targetFormat.includes("docx")) {
      const paragraphs = outputPreview.split("\n").map(line => {
        return new Paragraph({
          children: [new TextRun(line)]
        });
      });
      const doc = new Document({
        sections: [{ children: paragraphs }]
      });
      const docxBlob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(docxBlob);
      triggerBlobDownload(url, `${baseName}.docx`);
      return;
    }

    // 3. Fallback text/markdown download
    const isMarkdown = targetFormat.includes("Markdown") || targetFormat.includes("md");
    const mime = isMarkdown ? "text/markdown" : "text/plain";
    const ext = isMarkdown ? "md" : "txt";

    const blob = new Blob([outputPreview], { type: mime });
    const url = URL.createObjectURL(blob);
    triggerBlobDownload(url, `${baseName}.${ext}`);
  };

  const triggerBlobDownload = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validOutputFormats = detectedExt ? (CONVERSION_MAP[detectedExt] || ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"]) : ["PDF (.pdf)", "Word (.docx)", "Text (.txt)"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4" style={{ borderColor: T.border }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>
            Document Transformation Suite
          </h1>
          <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
            Apply AI transformations or convert formats for PDF, Word, Excel, PowerPoint, Images, Audio, and Video files.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl p-1 border bg-slate-900" style={{ borderColor: T.border }}>
          <button
            onClick={() => { setProcessingMode("transform"); resetForm(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
            style={processingMode === "transform" ? { backgroundColor: T.bgActive, color: T.textActive } : { color: T.textSecondary }}
          >
            AI Transform
          </button>
          <button
            onClick={() => { setProcessingMode("convert"); resetForm(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
            style={processingMode === "convert" ? { backgroundColor: T.bgActive, color: T.textActive } : { color: T.textSecondary }}
          >
            File Conversion
          </button>
          <button
            onClick={() => { setProcessingMode("both"); resetForm(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all`}
            style={processingMode === "both" ? { backgroundColor: T.bgActive, color: T.textActive } : { color: T.textSecondary }}
          >
            Both Modes
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Input Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-5" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            
            <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: T.border }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Upload File</h3>
              <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase">
                Mode: {processingMode}
              </span>
            </div>

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
                Raw Text Paste
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

            {/* AI Transformation Options */}
            {(processingMode === "transform" || processingMode === "both") && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Transformation Options</label>
                <select
                  value={aiTransform}
                  onChange={(e) => setAiTransform(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200 font-semibold"
                  style={{ borderColor: T.border }}
                >
                  {AI_TRANSFORMATIONS.map(group => (
                    <optgroup key={group.group} label={group.group} style={{ backgroundColor: "#0f1e35" }}>
                      {group.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Output File Conversion Selector */}
            {(processingMode === "convert" || processingMode === "both") && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Output Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs focus:outline-none border bg-slate-900 text-slate-200 font-semibold"
                  style={{ borderColor: T.border }}
                >
                  {validOutputFormats.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Binder */}
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
                Run unified Suite
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
                CONVERSION RESOLUTION PANEL
              </span>

              {status === "done" && outputPreview && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => { navigator.clipboard.writeText(outputPreview); alert("Copied output!"); }}
                    className="p-1.5 rounded bg-slate-900 border hover:bg-white/5 text-slate-300"
                    style={{ borderColor: T.border }}
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={downloadOutput}
                    className="p-1.5 rounded bg-slate-900 border hover:bg-white/5 text-slate-350"
                    style={{ borderColor: T.border }}
                    title="Download converted output file"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {status === "done" && outputPreview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                    <Check className="h-4 w-4 animate-bounce" />
                    <span>File processed successfully! Latency: {(processingTime / 1000).toFixed(2)}s</span>
                  </div>

                  <pre className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {outputPreview}
                  </pre>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center py-20 text-slate-500">
                  <Cpu className="h-10 w-10 text-slate-600 mb-3" />
                  <p className="text-xs font-bold text-slate-400">Processing Engine Standby</p>
                  <p className="text-[10px] max-w-xs mt-1 text-slate-500 font-semibold">Upload file, select AI transformations or conversion targets, then run the unified execution builder.</p>
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
