"use client";

import React, { useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Image as ImageIcon, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import { OutputPanel } from "@/components/OutputPanel";
import { presetOptions, presetPrompts } from "@/lib/presets";
import { uploadFileMultipart } from "@/lib/uploadUtils";

export default function ImagesTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [preset, setPreset] = useState("exec_summary");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("File exceeds 20MB size limit.");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setOutput("");
    }
  };

  const triggerTransform = async () => {
    if (!selectedFile) {
      alert("Please select or drop an image file first.");
      return;
    }

    setStatus("processing");
    setOutput("");
    setErrorMsg("");
    setStage("Uploading image...");
    setProgress(10);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      const uploadedFileUrl = await uploadFileMultipart(selectedFile, (pct) => {
        setProgress(10 + Math.floor(pct * 0.4));
      });
      
      setStage("Analyzing image content...");
      setProgress(60);

      const targetFormat = presetPrompts[preset] || preset;

      const payload = {
        fileUrl: uploadedFileUrl,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        format: targetFormat,
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      setStage("Generating ACT Output...");
      setProgress(85);

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
          file: selectedFile.name,
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
      setErrorMsg(err.message || "Failed to process the image.");
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
            <ImageIcon className="h-6 w-6 text-purple-600" />
            Image Transformation
          </h1>
          <p className="text-[11px] mt-1" style={{ color: T.textSecondary }}>
            Upload images (infographics, diagrams, posters) and automatically extract insights, summaries, and structural content.
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
                <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: T.textPrimary }}>Image Engine</h3>
                <p className="text-[10px]" style={{ color: T.textSecondary }}>Vision analysis & extraction</p>
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
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp, image/gif"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange({ target: { files: [file] } } as any);
                }}
                className="p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all hover:border-purple-500/50 relative overflow-hidden"
                style={{ backgroundColor: T.bgInput, borderColor: T.border }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 object-contain rounded-lg" />
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 text-purple-600 mx-auto mb-2 opacity-80" />
                    <span className="text-xs font-semibold block" style={{ color: T.textPrimary }}>
                      Drag & drop image files here
                    </span>
                    <span className="text-[10px] mt-1 block" style={{ color: T.textSecondary }}>
                      Supports PNG, JPG, WEBP, GIF (Max 20MB)
                    </span>
                  </>
                )}
              </div>
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
                Compile Image Output
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
