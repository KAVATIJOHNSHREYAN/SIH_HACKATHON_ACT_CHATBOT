"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Globe, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import { OutputPanel } from "@/components/OutputPanel";
import { presetOptions, presetPrompts } from "@/lib/presets";

export default function UrlTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [urlInput, setUrlInput] = useState("");
  
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [preset, setPreset] = useState("exec_summary");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const triggerTransform = async () => {
    if (!urlInput.trim() || !urlInput.startsWith("http")) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setStatus("processing");
    setOutput("");
    setErrorMsg("");
    setStage("Crawling URL content...");
    setProgress(30);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const targetFormat = presetPrompts[preset] || preset;

      const payload = {
        text: urlInput, // The backend handles URLs as text input to the URL scraper
        format: targetFormat,
        model: typeof window !== "undefined" ? localStorage.getItem("act_selected_model") || "Gemini Pro" : "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      setStage("Generating ACT Output...");
      setProgress(75);

      const data = await ApiClient.streamTransform(payload, (chunk) => {
        if (chunk.stage) setStage(chunk.stage);
        if (chunk.progress) setProgress(Math.max(progress, chunk.progress));
      });

      setStatus("done");
      setProgress(100);
      setStage("Complete");
      setOutput(data.output || "No output returned.");

      if (typeof window !== "undefined") {
        const historyStr = localStorage.getItem("act_transform_history") || "[]";
        const history = JSON.parse(historyStr);
        const newJob = {
          id: Date.now(),
          file: urlInput.length > 50 ? urlInput.substring(0, 50) + "..." : urlInput,
          action: preset,
          date: new Date().toISOString().split("T")[0],
          tokens: Math.floor((data.output?.length || 0) / 4) + 120,
          status: "Completed"
        };
        localStorage.setItem("act_transform_history", JSON.stringify([newJob, ...history]));
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to process the URL.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-black/5 rounded-lg transition-colors" style={{ color: T.textSecondary }}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <Globe className="h-6 w-6 text-purple-600" />
            URL Crawl Transformation
          </h1>
          <p className="text-[11px] mt-1" style={{ color: T.textSecondary }}>
            Paste any webpage URL to extract, summarize, and transform its content automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column - Controls */}
        <div className="md:col-span-5 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: T.border }}>
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: T.textPrimary }}>Web Engine</h3>
                <p className="text-[10px]" style={{ color: T.textSecondary }}>Scraping & semantic analysis</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full p-4 rounded-xl border text-[11px] focus:outline-none focus:border-purple-500 font-mono"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              />
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide" style={{ color: T.textSecondary }}>Conversion Preset</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                {presetOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} style={{ backgroundColor: T.bgCard, color: T.textPrimary }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {status === "processing" ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-purple-600 animate-pulse uppercase tracking-wider">{stage}</span>
                  <span style={{ color: T.textSecondary }}>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden border shadow-inner" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
                  <div className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <Button onClick={triggerTransform} className="w-full text-xs py-3 bg-purple-650 hover:bg-purple-750">
                Transform URL Content
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            )}
          </GlassCard>
        </div>

        {/* Right Output Converted Preview Area */}
        <div className="md:col-span-7 space-y-6">
          <OutputPanel output={output} setOutput={setOutput} T={T} className="h-[520px]" />
        </div>

      </div>
    </div>
  );
}
