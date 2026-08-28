"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Upload, FileCode, Download, 
  Copy, Check, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";

// --- MAIN PAGE CONTAINER ---

export default function CodeTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; lang: string } | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pipeline execution
  const [preset, setPreset] = useState("explain");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    { id: "explain", label: "Explain Code" },
    { id: "docs", label: "Generate API Docs" },
    { id: "tests", label: "Generate Unit Tests" },
    { id: "optimize", label: "Optimize Code" },
    { id: "bugs", label: "Detect Bugs" },
    { id: "flowchart", label: "Flowchart Generator" }
  ];

  // Process query params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qPreset = params.get("preset");
      const qPrompt = params.get("prompt");
      const qUpload = params.get("upload");

      if (qPreset) setPreset(qPreset);
      if (qUpload === "true") {
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 800);
      }
    }
  }, []);

  const handleFileLoaded = (file: File) => {
    setErrorMsg("");
    setOutput("");
    setFileContent("");
    setStats(null);

    // Limit check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File exceeds the 10MB size limit.");
      return;
    }

    const extension = file.name.split(".").pop() || "";
    setFileDetails({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      lang: extension.toUpperCase()
    });
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target?.result as string || "");
    };
    reader.readAsText(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileDetails(null);
    setFileContent("");
    setOutput("");
    setErrorMsg("");
    setStatus("idle");
    setStats(null);
  };

  const triggerCodeTransform = async () => {
    if (!selectedFile || !fileContent) {
      alert("Please upload a code file first.");
      return;
    }

    setErrorMsg("");
    setStatus("processing");
    setStage("Parsing Source Code...");
    setProgress(20);

    const tStart = performance.now();

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      setStage("Analyzing Code Structure...");
      setProgress(50);
      await new Promise((r) => setTimeout(r, 600));

      setStage("Generating Action Response...");
      setProgress(80);

      let targetPresetPrompt = "";
      if (preset === "explain") {
        targetPresetPrompt = "Explain Code (Provide a detailed semantic walkthrough of this codebase and functions)";
      } else if (preset === "docs") {
        targetPresetPrompt = "Generate API Docs (Draft professional API documentation including parameters and return types)";
      } else if (preset === "tests") {
        targetPresetPrompt = "Generate Unit Tests (Generate complete robust unit test cases for the functions)";
      } else if (preset === "optimize") {
        targetPresetPrompt = "Optimize Code (Suggest performance improvements, complexity reduction and refactoring)";
      } else if (preset === "bugs") {
        targetPresetPrompt = "Detect Bugs (Perform static analysis and identify edge cases, syntax or logical bugs)";
      } else if (preset === "flowchart") {
        targetPresetPrompt = "Flowchart Generator (Explain the runtime execution flowchart textually)";
      } else {
        targetPresetPrompt = "Plain Text (General explanation)";
      }

      // Override with custom query prompt if present
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qPrompt = params.get("prompt");
        if (qPrompt) {
          targetPresetPrompt = qPrompt;
        }
      }

      const transformPayload = {
        text: fileContent,
        format: targetPresetPrompt,
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      const data = await ApiClient.postTransform(transformPayload);

      const tEnd = performance.now();
      const elapsed = ((tEnd - tStart) / 1000).toFixed(1);

      setStatus("done");
      setProgress(100);
      setStage("Completed");
      setOutput(data.output || "No output generated.");

      setStats({
        fileSize: fileDetails?.size || "Unknown",
        lines: fileContent.split("\n").length,
        processingTime: `${elapsed}s`
      });

      // Save to transform history logs
      saveToHistory({
        file: fileDetails?.name || "Code_Transformed.txt",
        action: `Code to ${preset.toUpperCase()}`,
        tokens: Math.floor((fileContent || "").length / 4) + 150,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to compile code transformation.");
    }
  };

  const saveToHistory = (item: { file: string; action: string; tokens: number }) => {
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

  const downloadFile = (format: "md" | "txt") => {
    const blob = new Blob([output], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ACT_code_transformed.${format}`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold capitalize" style={{ color: T.textPrimary }}>Code Transformation</h1>
          <p className="text-xs mt-0.5" style={{ color: T.textSecondary }}>Automate code analysis, API documentation generation, unit testing, and flowcharting.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Control Column */}
        <div className="md:col-span-6 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: T.textPrimary }}>Code Actions Configuration</h3>
                <p className="text-[10px] text-slate-400">Manage source code uploads and target workflows</p>
              </div>
            </div>

            {/* Drag & drop upload box */}
            {!fileDetails ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileLoaded(file);
                  }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:border-purple-500/40"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                >
                  <Upload className="h-10 w-10 text-purple-500 mx-auto mb-3 animate-pulse" />
                  <span className="text-xs font-bold block mb-1" style={{ color: T.textPrimary }}>
                    Click to load code file
                  </span>
                  <span className="text-[9px] text-slate-400 block" style={{ color: T.textSecondary }}>
                    Supports JS, TS, Python, Go, C++, Rust, and HTML
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{fileDetails.name}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{fileDetails.size} • {fileDetails.lang}</p>
                  </div>
                  {status !== "processing" && (
                    <button 
                      onClick={removeFile}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-4"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Error messaging */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Presets dropdown */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: T.textSecondary }}>
                Target Action Preset
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                {presets.map((item) => (
                  <option key={item.id} value={item.id} style={{ backgroundColor: T.bgCard, color: T.textPrimary }}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Pipeline Action */}
            {status === "processing" ? (
              <div className="space-y-2 text-center py-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
                  <span>{stage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div className="bg-purple-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <Button 
                onClick={triggerCodeTransform} 
                className="w-full text-xs"
                disabled={!selectedFile}
              >
                Trigger Transform
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            )}

            {/* Stats display */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border text-center" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                <div>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>File Size</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.fileSize}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Lines</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.lines}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Duration</p>
                  <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.processingTime}</p>
                </div>
              </div>
            )}

          </GlassCard>
        </div>

        {/* Right Output Column */}
        <div className="md:col-span-6">
          <GlassCard className="flex flex-col h-[520px] justify-between border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
              <span className="text-xs font-bold" style={{ color: T.textPrimary }}>ACT Converted Output</span>
              {output && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-600 font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy Output"}
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col pt-4 overflow-hidden">
              <textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                placeholder="Target output markdown or code transformed text will render here. Choose a preset and click Trigger Transform."
                className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-purple-500"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              />
            </div>

            {output && (
              <div className="pt-4 border-t flex flex-col sm:flex-row gap-2" style={{ borderColor: T.border }}>
                <Button onClick={() => downloadFile("md")} variant="outline" className="flex-1 text-xs py-2 rounded-lg">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Markdown (.md)
                </Button>
                <Button onClick={() => downloadFile("txt")} variant="outline" className="flex-1 text-xs py-2 rounded-lg">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Plain Text (.txt)
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
