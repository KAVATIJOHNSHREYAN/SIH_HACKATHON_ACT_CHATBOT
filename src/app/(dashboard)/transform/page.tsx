"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  RefreshCw, 
  CheckCircle, 
  FileText, 
  FileCode, 
  Clipboard,
  Download,
  Share2,
  Trash2,
  Settings,
  AlertCircle,
  FileCheck,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ApiClient } from "@/lib/apiClient";

const TARGET_FORMATS = [
  { group: "Summaries & Docs", formats: ["Summary", "Detailed Summary", "Article", "Blog", "Notes", "Meeting Minutes", "Research Summary"] },
  { group: "Structured & Code", formats: ["JSON", "CSV", "Markdown", "HTML", "Code Explanation", "Code Documentation"] },
  { group: "Study & Testing", formats: ["MCQs", "Flashcards", "FAQ"] },
  { group: "Specialized", formats: ["Legal Simplification", "Medical Document Summary", "Tone Conversion", "Translation", "Press Release", "Resume", "LinkedIn Post", "Social Media Post", "OCR Text"] },
];

export default function TransformPage() {
  const [sourceType, setSourceType] = useState<"file" | "text">("file");
  const [inputText, setInputText] = useState("");
  
  // Real file states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");
  
  const [targetFormat, setTargetFormat] = useState("Summary");
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");

  // Pipeline execution states
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [outputPreview, setOutputPreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character and Word Counters
  const charCount = inputText.length;
  const wordCount = inputText.trim() === "" ? 0 : inputText.trim().split(/\s+/).length;

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

    // Check size limit (e.g., 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File is too large. Max size is 50MB.");
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();

    // If it's a textual file, read it directly
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
        const text = event.target?.result as string;
        setFileContent(text || "");
        setSelectedFileBase64("");
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read file contents.");
      };
      reader.readAsText(file);
    } else {
      // For binary files (PDFs, DOCX, PPTX, Images, Audios), read as base64 DataURL
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSelectedFileBase64(dataUrl || "");
        setFileContent("");
      };
      reader.onerror = () => {
        setErrorMsg("Failed to read binary file stream.");
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
    setFileContent("");
    setSelectedFileBase64("");
    resetForm();
  };

  const handleTransform = async () => {
    const hasInput = sourceType === "file" ? (selectedFileBase64 || fileContent) : inputText;

    if (!hasInput) {
      setErrorMsg("Please upload a file or paste content to transform.");
      return;
    }

    setErrorMsg("");
    setStatus("uploading");
    setStage("Uploading source stream...");
    setProgress(15);

    try {
      await new Promise(r => setTimeout(r, 600));
      setStatus("processing");
      setStage("Analyzing file layout schemas...");
      setProgress(45);

      await new Promise(r => setTimeout(r, 600));
      setStage("Querying RAG vectors & prompting ACT...");
      setProgress(75);

      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const payload = sourceType === "file"
        ? {
            fileData: selectedFileBase64 || undefined,
            text: fileContent || undefined,
            fileName: selectedFile?.name,
            fileType: selectedFile?.type,
            format: targetFormat,
            model: selectedModel,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          }
        : {
            text: inputText,
            format: targetFormat,
            model: selectedModel,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          };

      const data = await ApiClient.postTransform(payload);

      setStatus("done");
      setStage("Output completed");
      setProgress(100);
      setOutputPreview(data.output);

      saveToHistory({
        file: selectedFile ? selectedFile.name : "Raw Text Input",
        action: `${sourceType === "file" ? selectedFile?.type || "File" : "Text"} to ${targetFormat}`,
        tokens: Math.floor((fileContent || inputText).length / 4) + 120,
        model: data.model || selectedModel,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Network error or model timeout.");
    }
  };

  const saveToHistory = (item: { file: string; action: string; tokens: number; model: string }) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history") || "[]";
      const history = JSON.parse(historyStr);
      const newJob = {
        id: Math.random(),
        file: item.file,
        action: item.action,
        date: new Date().toISOString().split('T')[0],
        tokens: item.tokens.toString(),
        status: "Completed",
      };
      localStorage.setItem("act_transform_history", JSON.stringify([newJob, ...history]));
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
    a.download = `ACT_${targetFormat.replace(/\s+/g, "_")}_Output.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ACT Content Transformation</h1>
        <p className="text-slate-600 text-xs mt-1">Transform documents, audios, or text into summaries, tables, templates, or FAQs based on real-time inputs.</p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Configuration Card */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="border-slate-200 bg-white shadow-sm space-y-6">
            <h2 className="text-base font-bold text-slate-855 tracking-tight flex items-center gap-2" style={{ color: '#0d2d0d' }}>
              <Settings className="h-4.5 w-4.5 text-purple-600" />
              1. Source Configuration
            </h2>

            {/* Input Selection Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => { setSourceType("file"); resetForm(); }}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
                  sourceType === "file" ? "bg-white border border-slate-250 text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                File Upload
              </button>
              <button
                type="button"
                onClick={() => { setSourceType("text"); resetForm(); }}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-all ${
                  sourceType === "text" ? "bg-white border border-slate-250 text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Raw Text Paste
              </button>
            </div>

            {/* File Dropzone */}
            {sourceType === "file" ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.mp3,.wav"
                />
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-purple-300 rounded-2xl p-8 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all group relative shadow-sm"
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <FileCheck className="h-10 w-10 text-purple-600 mx-auto animate-bounce" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-xs mx-auto">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button 
                        onClick={removeFile}
                        className="text-[10px] text-red-650 hover:text-red-700 font-semibold px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 shadow-sm transition-all"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-purple-600 transition-colors mx-auto mb-4" />
                      <p className="text-xs font-semibold text-slate-700">Drag and drop file here, or click to upload</p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, TXT, CSV, JSON, PNG, JPG, MP3 (Max 50MB)</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste or type the raw content you wish to convert..."
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 transition-colors leading-relaxed shadow-sm"
                  />
                  {inputText && (
                    <button
                      onClick={() => setInputText("")}
                      className="absolute right-3.5 bottom-3.5 text-[10px] text-slate-400 hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
                  <span>Words: {wordCount}</span>
                  <span>Characters: {charCount}</span>
                </div>
              </div>
            )}

            {/* Target Select */}
            <div className="space-y-3.5 pt-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                2. Target Output Format
              </label>
              <select
                value={targetFormat}
                onChange={(e) => { setTargetFormat(e.target.value); resetForm(); }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
              >
                {TARGET_FORMATS.map((group) => (
                  <optgroup key={group.group} label={group.group} className="bg-white text-slate-800 text-xs">
                    {group.formats.map((fmt) => (
                      <option key={fmt} value={fmt} className="text-slate-700 font-medium">
                        {fmt}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* AI Model selection */}
            <div className="space-y-3.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                3. Transformation Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
              >
                <option value="Gemini Pro">Gemini Pro</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Cohere">Cohere Command R+</option>
                <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>

            {/* Action Trigger button */}
            {status === "idle" || status === "done" || status === "error" ? (
              <Button onClick={handleTransform} className="w-full py-3 text-xs shadow-md">
                Transform Content via ACT
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-600 font-bold uppercase tracking-wider animate-pulse">
                    {stage}
                  </span>
                  <span className="text-slate-500 font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <button 
                  onClick={resetForm}
                  className="w-full text-center text-[10px] text-slate-400 hover:text-red-500 transition-colors font-semibold"
                >
                  Cancel Transformation
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Output Preview Card */}
        <div className="lg:col-span-7">
          <GlassCard className="border-slate-200 bg-white shadow-sm min-h-[500px] flex flex-col p-0 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-purple-600" />
                Transformation Output Preview
              </span>
              
              {status === "done" && outputPreview && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(outputPreview); alert("Copied to clipboard!"); }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                    title="Copy response"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                  <button
                    onClick={downloadOutput}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                    title="Download Markdown File"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {status === "done" && outputPreview ? (
              <div className="p-6 flex-1 flex flex-col justify-between bg-slate-50/20">
                <div className="text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed flex-1 prose max-w-none">
                  {outputPreview}
                </div>
                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-[10px] text-slate-500">
                  <span>Output generated successfully via ACT engine ({selectedModel})</span>
                  <span>Timestamp: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/10">
                <BookOpen className="h-10 w-10 text-slate-400 mb-4 animate-pulse" />
                <p className="text-sm font-semibold text-slate-700">Transform Console Empty</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Upload a document or paste raw text on the left configuration panel, then trigger ACT to output compilations.
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
