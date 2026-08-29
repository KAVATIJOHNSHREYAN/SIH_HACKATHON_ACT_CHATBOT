"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
  RefreshCw, ArrowLeft, Cpu, Upload, Video, Play, Pause,
  Volume2, VolumeX, Maximize2, Download, Copy, Check, AlertCircle, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import jsPDF from "jspdf";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import pptxgen from "pptxgenjs";
import JSZip from "jszip";
import * as XLSX from "xlsx";

// --- SUB-COMPONENTS ---

// 1. VIDEO UPLOADER COMPONENT
interface VideoUploaderProps {
  onFileLoaded: (file: File) => Promise<void>;
  onUrlLoaded: (url: string) => Promise<void>;
  isProcessing: boolean;
  T: any;
}
function VideoUploader({ onFileLoaded, onUrlLoaded, isProcessing, T }: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleFile = (file: File) => {
    const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm", "video/mpeg", "video/x-m4v"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|mkv|webm|mpeg|m4v)$/i)) {
      alert("Invalid video format. Supported formats: MP4, MOV, AVI, MKV, WebM, MPEG, M4V.");
      return;
    }
    onFileLoaded(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onUrlLoaded(urlInput);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUrlSubmit} className="flex items-center gap-2">
        <input 
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube, Vimeo or Direct Video URL"
          className="flex-1 p-3 rounded-xl border text-xs focus:outline-none focus:border-purple-500"
          style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
          disabled={isProcessing}
        />
        <Button type="submit" disabled={isProcessing || !urlInput.trim()} className="bg-purple-650 hover:bg-purple-750 px-6">
          Fetch
        </Button>
      </form>
      <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-400">
        <div className="flex-1 h-px bg-slate-200/10"></div>
        OR
        <div className="flex-1 h-px bg-slate-200/10"></div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        disabled={isProcessing}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${dragActive ? "border-purple-500 bg-purple-500/5" : "hover:border-purple-500/40"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ backgroundColor: T.bgInput, borderColor: T.border }}
      >
        <Video className="h-10 w-10 text-purple-500 mx-auto mb-3 animate-pulse" />
        <span className="text-xs font-bold block mb-1" style={{ color: T.textPrimary }}>
          Drag & drop video file here or click to browse
        </span>
        <span className="text-[10px] text-slate-400 block" style={{ color: T.textSecondary }}>
          Supports MP4, MOV, AVI, MKV, WebM, MPEG, M4V (Up to 2GB)
        </span>
      </div>
    </div>
  );
}

// 2. VIDEO PLAYER COMPONENT
interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  T: any;
}
function VideoPlayer({ videoUrl, videoRef, T }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const vol = parseFloat(e.target.value);
      videoRef.current.volume = vol;
      setVolume(vol);
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const muted = !isMuted;
      videoRef.current.muted = muted;
      setIsMuted(muted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden border bg-black aspect-video flex items-center justify-center" style={{ borderColor: T.border }}>
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-contain"
          onClick={togglePlay}
        />
      </div>

      {/* Controls Bar */}
      <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button onClick={togglePlay} variant="outline" className="p-2 h-auto rounded-lg">
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-purple-500" /> : <Play className="h-3.5 w-3.5 text-purple-500" />}
            </Button>
            <span className="text-[10px] font-mono font-bold" style={{ color: T.textPrimary }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={toggleMute} variant="outline" className="p-2 h-auto rounded-lg">
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <Button onClick={handleFullscreen} variant="outline" className="p-2 h-auto rounded-lg" title="Fullscreen">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>
    </div>
  );
}

// 3. TRANSCRIPT & EDIT PANEL
interface TranscriptPanelProps {
  transcript: string;
  setTranscript: (val: string) => void;
  T: any;
}
function TranscriptPanel({ transcript, setTranscript, T }: TranscriptPanelProps) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>
        Extracted Speech Transcript
      </label>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Audio speech transcript will display here after transcription. You can edit this text before compiling AI outputs."
        className="w-full h-24 p-3 rounded-xl border text-xs focus:outline-none focus:border-purple-500 resize-none"
        style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
      />
    </div>
  );
}

// 4. FRAME EXTRACTOR CONTROLLER & GALLERY
interface FrameExtractorProps {
  frames: { time: number; url: string; ocr?: string }[];
  interval: number;
  setInterval: (val: number) => void;
  T: any;
}
function FrameExtractor({ frames, interval, setInterval, T }: FrameExtractorProps) {
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>
          Frame Extraction Interval
        </label>
        <select
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value))}
          className="px-2 py-1 rounded-lg text-[10px] font-bold border focus:outline-none focus:border-purple-500"
          style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
        >
          <option value={1}>Every 1 Second</option>
          <option value={5}>Every 5 Seconds</option>
          <option value={10}>Every 10 Seconds</option>
          <option value={30}>Every 30 Seconds</option>
        </select>
      </div>

      {frames.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>
            Extracted Frames Gallery ({frames.length})
          </label>
          <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto p-1 border rounded-xl" style={{ borderColor: T.border }}>
            {frames.map((frame, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden border aspect-video bg-black group" style={{ borderColor: T.border }}>
                <img src={frame.url} alt={`Frame at ${frame.time}s`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/70 text-[8px] font-mono px-1 rounded text-white">
                  {formatTime(frame.time)}
                </span>
                {frame.ocr && (
                  <div className="absolute inset-0 bg-black/80 p-1 opacity-0 group-hover:opacity-100 transition-opacity overflow-y-auto text-[7px] text-emerald-400 font-mono leading-tight whitespace-pre-wrap">
                    {frame.ocr}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 5. PROGRESS PIPELINE STAGES
interface ProcessingProgressProps {
  stage: string;
  progress: number;
  T: any;
}
function ProcessingProgress({ stage, progress, T }: ProcessingProgressProps) {
  return (
    <div className="space-y-2.5 p-4 rounded-xl border" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className="text-purple-500 uppercase tracking-wider animate-pulse">{stage}</span>
        <span style={{ color: T.textSecondary }}>{progress}%</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden border shadow-inner" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
        <div
          className="bg-gradient-to-r from-purple-500 to-emerald-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// 6. PROCESSING STATISTICS PANEL
interface ProcessingStatsProps {
  stats: {
    duration: string;
    fileSize?: string;
    framesCount: number;
    ocrCount: number;
    wordsCount: number;
    processingTime: string;
    aiTime: string;
  } | null;
  T: any;
}
function ProcessingStats({ stats, T }: ProcessingStatsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-4 gap-2 p-3 rounded-xl border text-center" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Video Len</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.duration}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>File Size</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.fileSize || "N/A"}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Frames Extracted</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.framesCount}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>OCR Matches</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.ocrCount}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Transcript Words</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.wordsCount}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>Media Pipeline</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.processingTime}</p>
      </div>
      <div>
        <p className="text-[8px] text-slate-400 font-semibold uppercase" style={{ color: T.textSecondary }}>AI Compiler</p>
        <p className="text-[11px] font-mono font-bold" style={{ color: T.textPrimary }}>{stats.aiTime}</p>
      </div>
    </div>
  );
}

// 7. OUTPUT DISPLAY PANEL
interface OutputPanelProps {
  output: string;
  setOutput: (val: string) => void;
  T: any;
}
function OutputPanel({ output, setOutput, T }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState("txt");

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!output) return;
    
    try {
      const fileName = `ACT_Video_Export_${Date.now()}`;
      
      if (downloadFormat === "txt" || downloadFormat === "md" || downloadFormat === "json" || downloadFormat === "csv" || downloadFormat === "xml" || downloadFormat === "yaml") {
        let mime = "text/plain";
        if (downloadFormat === "md") mime = "text/markdown";
        if (downloadFormat === "json") mime = "application/json";
        if (downloadFormat === "csv") mime = "text/csv";
        if (downloadFormat === "xml") mime = "application/xml";
        
        const blob = new Blob([output], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${downloadFormat}`;
        a.click();
      } 
      else if (downloadFormat === "html") {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>ACT Video Export</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                pre { white-space: pre-wrap; font-family: monospace; font-size: 13px; background: #f4f4f5; padding: 20px; border-radius: 8px; border: 1px solid #e4e4e7; }
              </style>
            </head>
            <body>
              <h2>ACT Video Export</h2>
              <pre>${output}</pre>
            </body>
          </html>
        `;
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.html`;
        a.click();
      }
      else if (downloadFormat === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(output, 180);
        let cursorY = 10;
        lines.forEach((line: string) => {
          if (cursorY > 280) {
            doc.addPage();
            cursorY = 10;
          }
          doc.text(line, 10, cursorY);
          cursorY += 7;
        });
        doc.save(`${fileName}.pdf`);
      }
      else if (downloadFormat === "docx") {
        const paragraphs = output.split("\\n").map(line => new Paragraph({ children: [new TextRun(line)] }));
        const doc = new DocxDocument({ sections: [{ properties: {}, children: paragraphs }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.docx`;
        a.click();
      }
      else if (downloadFormat === "pptx") {
        const pres = new pptxgen();
        const slide = pres.addSlide();
        slide.addText(output.substring(0, 1000) + (output.length > 1000 ? "..." : ""), { x: 0.5, y: 0.5, w: "90%", h: "90%", align: "left", valign: "top", fontSize: 12 });
        pres.writeFile({ fileName: `${fileName}.pptx` });
      }
      else if (downloadFormat === "zip") {
        const zip = new JSZip();
        zip.file("video_package.md", output);
        zip.file("video_package.txt", output);
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.zip`;
        a.click();
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export file. Try another format.");
    }
  };

  return (
    <GlassCard className="h-[580px] flex flex-col justify-between border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
          <span className="text-xs font-bold" style={{ color: T.textPrimary }}>ACT Converted Output</span>
          {output && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-600 font-semibold"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy Text"}
            </button>
          )}
        </div>

        <textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="Video summary or compiled reports will render here. Choose a preset, extract frames/transcripts, and click Compile Video."
          className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-purple-500"
          style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
        />
      </div>

      {output && (
        <div className="pt-4 border-t flex flex-col sm:flex-row items-center gap-2" style={{ borderColor: T.border }}>
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="p-2 border rounded-lg text-xs flex-1 focus:outline-none focus:border-purple-500"
            style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
          >
            <option value="txt">TXT Document</option>
            <option value="md">Markdown (.md)</option>
            <option value="pdf">PDF Document</option>
            <option value="docx">Word (.docx)</option>
            <option value="csv">CSV Spreadsheet</option>
            <option value="json">JSON Data</option>
            <option value="html">HTML Page</option>
            <option value="pptx">PowerPoint (.pptx)</option>
            <option value="xml">XML Data</option>
            <option value="yaml">YAML File</option>
            <option value="zip">ZIP Package</option>
          </select>
          <Button onClick={handleDownload} className="text-xs py-2 px-6 rounded-lg bg-purple-650 hover:bg-purple-750 flex-1 sm:flex-none whitespace-nowrap">
            <Download className="h-3.5 w-3.5 mr-2" />
            Export Output
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

// --- MAIN PAGE CONTAINER ---

export default function VideoTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string; type: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // States
  const [transcript, setTranscript] = useState("");
  const [frames, setFrames] = useState<{ time: number; url: string; ocr?: string }[]>([]);
  const [interval, setIntervalVal] = useState(10);
  const [preset, setPreset] = useState("summary");

  // Pipeline status
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");
  const [stats, setStats] = useState<any | null>(null);

  const presets = [
    { id: "exec_summary", label: "Executive Summary" },
    { id: "detailed_summary", label: "Detailed Summary" },
    { id: "minutes", label: "Minutes of Meeting" },
    { id: "actions", label: "Action Items" },
    { id: "mcqs", label: "MCQs" },
    { id: "faqs", label: "FAQs" },
    { id: "linkedin", label: "LinkedIn Post" },
    { id: "twitter", label: "Twitter/X Thread" },
    { id: "facebook", label: "Facebook Post" },
    { id: "instagram", label: "Instagram Caption" },
    { id: "blog", label: "Professional Blog" },
    { id: "article", label: "Article" },
    { id: "press", label: "Press Release" },
    { id: "advisory", label: "Advisory" },
    { id: "research", label: "Research Summary" },
    { id: "presentation", label: "Presentation" },
    { id: "speaker_notes", label: "Presentation Speaker Notes" },
    { id: "infographic_content", label: "Infographic Content" },
    { id: "infographic_layout", label: "Infographic Layout" },
    { id: "key_messages", label: "Key Messages" },
    { id: "video_script", label: "Video Script" },
    { id: "storyboard", label: "Complete Storyboard" },
    { id: "scene_desc", label: "Scene Descriptions" },
    { id: "narration", label: "Narration Script" },
    { id: "voiceover", label: "Voice-over Script" },
    { id: "subtitles", label: "Subtitles (.srt)" },
    { id: "captions", label: "Captions (.vtt)" },
    { id: "shot_list", label: "Shot List" },
    { id: "visual_recs", label: "Visual Recommendations" },
    { id: "thumbnails", label: "Thumbnail Suggestions" },
    { id: "social_package", label: "Social Media Package" },
    { id: "seo_title", label: "SEO Title" },
    { id: "seo_desc", label: "SEO Description" },
    { id: "hashtags", label: "Hashtags" },
    { id: "keywords", label: "Keywords" },
    { id: "email", label: "Email Draft" },
    { id: "newsletter", label: "Newsletter" },
    { id: "documentation", label: "Documentation" },
    { id: "markdown", label: "Markdown" },
    { id: "json", label: "JSON" },
    { id: "csv", label: "CSV" },
    { id: "txt", label: "TXT" },
    { id: "pdf", label: "PDF" },
    { id: "docx", label: "DOCX" },
    { id: "pptx", label: "PPTX" },
    { id: "html", label: "HTML" },
    { id: "xml", label: "XML" },
    { id: "yaml", label: "YAML" },
    { id: "video_package", label: "Video Package (Full)" }
  ];
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qPreset = params.get("preset");
      const qUpload = params.get("upload");
      if (qPreset) {
        setPreset(qPreset);
      }
      if (qUpload === "true") {
        setTimeout(() => {
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
          if (fileInput) {
            fileInput.click();
          }
        }, 800);
      }
    }
  }, []);
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = (err) => reject(new Error("Failed to read video file content."));
      reader.readAsDataURL(file);
    });
  };

  const handleUrlLoaded = async (url: string) => {
    setErrorMsg("");
    setOutput("");
    setTranscript("");
    setFrames([]);
    setStats(null);
    setSelectedVideo(null);
    setVideoUrl(null);
    
    setVideoUrlInput(url);
    setFileDetails({
      name: url,
      size: "URL Source",
      type: "video/url"
    });
  };

  const handleFileLoaded = async (file: File) => {
    console.log("upload started");
    setErrorMsg("");
    setOutput("");
    setTranscript("");
    setFrames([]);
    setStats(null);

    const MAX_SIZE = 150 * 1024 * 1024; // 150 MB Limit
    if (file.size > MAX_SIZE) {
      const sizeStr = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
      const errMsg = `Video file size (${sizeStr}) exceeds direct browser RAG limit of 150 MB. Please compress the video or upload a smaller clip.`;
      setErrorMsg(errMsg);
      alert(errMsg);
      return;
    }

    setVideoUrl(URL.createObjectURL(file));
    setSelectedVideo(file);
    console.log("upload finished");
    console.log("selected file:", file.name);
    console.log("file size:", file.size);

    setFileDetails({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    });
  };

  const triggerVideoTransform = async () => {
    console.log("Trigger clicked");
    if (!selectedVideo) {
      alert("Please upload a video file first.");
      return;
    }
    console.log("file passed into transform:", selectedVideo.name);

    const tStart = performance.now();
    setErrorMsg("");
    setStatus("processing");
    setProgress(5);

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      // 1. READ METADATA & GENERATE PREVIEW
      setStage("Reading Video Metadata...");
      setProgress(10);

      const fileBase64 = await readFileAsDataURL(selectedVideo);
      await new Promise((r) => setTimeout(r, 600));

      const duration = videoRef.current?.duration || 60;
      const width = videoRef.current?.videoWidth || 1280;
      const height = videoRef.current?.videoHeight || 720;
      const durationStr = `${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`;

      // 2. EXTRACT AUDIO & SPEECH RECOGNITION
      setStage("Extracting Audio Track...");
      setProgress(25);
      await new Promise((r) => setTimeout(r, 800));

      setStage("Running Speech Recognition...");
      setProgress(40);

      let rawTranscriptText = "";
      if (selectedVideo.size <= 3.5 * 1024 * 1024) {
        // Request AI speech transcription from file payload
        const transcriptPayload = {
          fileData: fileBase64,
          fileName: fileDetails?.name || "video_upload.mp4",
          fileType: fileDetails?.type || "video/mp4",
          format: "Speech Transcript (Transcribe all spoken dialogues sequentially with timestamp lines)",
          model: "Gemini Pro",
          apiKey: savedApiKey || null,
          openaiKey: savedOpenaiKey || null,
          cohereKey: savedCohereKey || null,
        };

        const transcriptRes = await ApiClient.postTransform(transcriptPayload);
        rawTranscriptText = transcriptRes.output || "No speech dialogue was detected in the video track.";
      } else {
        rawTranscriptText = `[Speech Transcription bypassed due to server size limits. Transformed output is compiled from visual screen OCR below.]`;
      }
      setTranscript(rawTranscriptText);

      // 3. EXTRACT CANVAS FRAMES AT SPECIFIED INTERVALS
      setStage("Extracting Video Frames...");
      setProgress(60);

      const frameCount = Math.min(10, Math.max(2, Math.floor(duration / interval)));
      const extractedFramesList: { time: number; url: string; ocr?: string }[] = [];

      const videoElement = videoRef.current;
      if (videoElement) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");

        for (let i = 0; i < frameCount; i++) {
          const targetTime = Math.min(duration - 0.5, i * interval);
          videoElement.currentTime = targetTime;

          // Wait for seeked event
          await new Promise<void>((resolve) => {
            const onSeeked = () => {
              videoElement.removeEventListener("seeked", onSeeked);
              resolve();
            };
            videoElement.addEventListener("seeked", onSeeked);
          });

          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            extractedFramesList.push({
              time: targetTime,
              url: canvas.toDataURL("image/jpeg")
            });
          }
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      setFrames(extractedFramesList);

      // 4. RUN OCR ON SELECT EXTRACTED FRAMES
      setStage("Running Frame OCR & Text Alignment...");
      setProgress(75);

      let ocrDetectionsText = "";
      let ocrSuccessCount = 0;

      // Extract text from the middle/representative frames to save cost/speed
      const ocrSubset = extractedFramesList.filter((_, idx) => idx % 2 === 0);
      for (const frame of ocrSubset) {
        try {
          const ocrPayload = {
            fileData: frame.url,
            fileName: `frame_${frame.time}.jpeg`,
            fileType: "image/jpeg",
            format: "OCR Text",
            model: "Gemini Pro",
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          };
          const ocrRes = await ApiClient.postTransform(ocrPayload);
          const detectedText = ocrRes.output || "";

          if (detectedText.trim() && !detectedText.includes("Sandbox Mode")) {
            frame.ocr = detectedText.trim();
            ocrDetectionsText += `[Timestamp ${Math.floor(frame.time)}s] Visual OCR Text: ${detectedText.trim()}\n`;
            ocrSuccessCount++;
          }
        } catch {
          // ignore individual frame OCR failures
        }
        await new Promise((r) => setTimeout(r, 80));
      }

      // 5. COMBINE TRANSCRIPT & OCR FOR FINAL TARGET AI TRANSFORMATION
      setStage("Generating Converted Output...");
      setProgress(90);

      const tAfterMedia = performance.now();

      const presetPrompts: Record<string, string> = {
        "exec_summary": "Executive Summary (Generate a concise high-level professional summary of the video content)",
        "detailed_summary": "Detailed Summary (Generate an in-depth summary with all major points and timelines)",
        "minutes": "Meeting Minutes (Convert the dialogues into structured meeting minutes)",
        "actions": "Action Items (Extract action items, assignees if visible, and deadlines)",
        "mcqs": "MCQs (Generate Multiple Choice Questions based on the video facts)",
        "faqs": "FAQs (Generate Frequently Asked Questions with answers)",
        "linkedin": "LinkedIn Post (Write a professional engaging LinkedIn post summarizing the video)",
        "twitter": "Twitter/X Thread (Write a multi-part Twitter thread)",
        "facebook": "Facebook Post (Write a community-focused Facebook post)",
        "instagram": "Instagram Caption (Write a visual-first Instagram caption with emojis)",
        "blog": "Professional Blog (Write a comprehensive blog post using the video content)",
        "article": "Article (Draft a formal article with headings and structured paragraphs)",
        "press": "Press Release (Write a formal press release announcement)",
        "advisory": "Advisory (Generate a formal advisory notice or bulletin)",
        "research": "Research Summary (Generate an academic-style research summary)",
        "presentation": "Presentation (Structure the content as presentation slides)",
        "speaker_notes": "Presentation Speaker Notes (Draft notes for a speaker presenting this content)",
        "infographic_content": "Infographic Content (Extract key stats and facts for an infographic)",
        "infographic_layout": "Infographic Layout (Suggest a visual layout for the infographic)",
        "key_messages": "Key Messages (Extract the 3-5 absolute most important takeaways)",
        "video_script": "Video Script (Reformat the transcript into a polished script)",
        "storyboard": "Complete Storyboard (Generate a scene-by-scene storyboard with visual descriptions)",
        "scene_desc": "Scene Descriptions (Describe the physical scenes detected in the video)",
        "narration": "Narration Script (Draft a clean script for a voiceover narrator)",
        "voiceover": "Voice-over Script (Draft a voice-over script focusing on timing and pauses)",
        "subtitles": "Subtitles (.srt) (Generate SRT formatted subtitles with timestamps)",
        "captions": "Captions (.vtt) (Generate VTT formatted web captions)",
        "shot_list": "Shot List (Generate a camera shot list based on visual OCR/scenes)",
        "visual_recs": "Visual Recommendations (Suggest B-roll and visual assets)",
        "thumbnails": "Thumbnail Suggestions (Suggest 3 YouTube thumbnail ideas with text and imagery)",
        "social_package": "Social Media Package (Generate a bundled pack of tweets, posts, and captions)",
        "seo_title": "SEO Title (Generate 5 highly clickable SEO-optimized titles)",
        "seo_desc": "SEO Description (Generate an SEO meta description)",
        "hashtags": "Hashtags (Generate a list of 20 relevant hashtags)",
        "keywords": "Keywords (Extract primary and secondary SEO keywords)",
        "email": "Email Draft (Draft an email newsletter sharing this video content)",
        "newsletter": "Newsletter (Write a full email newsletter edition)",
        "documentation": "Documentation (Generate technical documentation or a user manual)",
        "markdown": "Markdown (Format text into detailed clean Markdown with headings)",
        "json": "JSON (Extract all facts and structure them into a valid JSON object)",
        "csv": "CSV (Extract any tabular data or lists into comma-separated values format)",
        "txt": "TXT (Clean readable plain text alignment)",
        "pdf": "PDF Structure (Generate content optimized for a PDF report)",
        "docx": "DOCX Structure (Generate content optimized for a Word document)",
        "pptx": "PPTX Structure (Generate content strictly as slides)",
        "html": "HTML (Generate valid HTML5 semantic markup)",
        "xml": "XML (Extract facts into a valid XML tree)",
        "yaml": "YAML (Extract facts into valid YAML format)",
        "video_package": "Video Package (Generate a massive master document containing: Script, Storyboard, Scene Numbers, Camera Angles, Visual Descriptions, Actions, Background, Lighting, Music, Tone, Subtitles, Transitions, Editing Notes, B-roll, End Screen, CTA, and Image Prompts)"
      };

      let targetPresetPrompt = presetPrompts[preset] || "Plain Text (Clean readable plain text alignment)";

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qPrompt = params.get("prompt");
        if (qPrompt) {
          targetPresetPrompt = qPrompt;
        }
      }

      const combinedText = `
[Video Metadata]
- Title: ${fileDetails?.name || "Video Source"}
- Duration: ${durationStr}
- Resolution: ${width}x${height}

[Speech Recognition Dialogue Transcript]
${rawTranscriptText}

[Screen OCR Detections]
${ocrDetectionsText || "No readable visual text detected on screen."}
`;

      const transformPayload = {
        text: combinedText,
        format: targetPresetPrompt,
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      const transformRes = await ApiClient.postTransform(transformPayload);

      const tEnd = performance.now();
      const mediaElapsed = ((tAfterMedia - tStart) / 1000).toFixed(1);
      const aiElapsed = ((tEnd - tAfterMedia) / 1000).toFixed(1);

      setStatus("done");
      setProgress(100);
      setStage("Completed");
      setOutput(transformRes.output || "No output generated by target model.");

      setStats({
        duration: durationStr,
        fileSize: fileDetails?.size || "Unknown",
        framesCount: extractedFramesList.length,
        ocrCount: ocrSuccessCount,
        wordsCount: rawTranscriptText.split(/\s+/).length,
        processingTime: `${mediaElapsed}s`,
        aiTime: `${aiElapsed}s`
      });

      // Save to transform history logs
      saveToHistory({
        file: fileDetails?.name || "Transformed_Video.mp4",
        action: `Video to ${preset.charAt(0).toUpperCase() + preset.slice(1)}`,
        tokens: Math.floor((combinedText || "").length / 4) + 200,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      let message = err.message || "Failed to process video pipeline or connect to AI engine.";
      if (message.includes("Unexpected token") || message.includes("is not valid JSON") || message.includes("413")) {
        message = "Video payload is too large for serverless transfer. Please compress the video file or use a smaller clip under 50 MB.";
      }
      setErrorMsg(message);
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

  const removeVideoFile = () => {
    setSelectedVideo(null);
    setFileDetails(null);
    setVideoUrl(null);
    setTranscript("");
    setFrames([]);
    setOutput("");
    setErrorMsg("");
    setStatus("idle");
    setStats(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <Video className="h-6 w-6 text-purple-500" />
            Video Analysis & Transformation
          </h1>
          <p className="text-xs mt-0.5" style={{ color: T.textSecondary }}>
            Upload videos to transcribe dialogue, capture frame slides, extract screen text, and generate notes.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-12 gap-6 items-start">

        {/* Left Control Column */}
        <div className="md:col-span-6 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800" style={{ color: T.textPrimary }}>Video Transform Workspace</h3>
                <p className="text-[10px] text-slate-500" style={{ color: T.textSecondary }}>Extract media streams and configure LLMs</p>
              </div>
            </div>

            {/* Video File Loader */}
            {!fileDetails ? (
              <VideoUploader
                onFileLoaded={handleFileLoaded}
                onUrlLoaded={handleUrlLoaded}
                isProcessing={status === "processing"}
                T={T}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{fileDetails.name}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{fileDetails.size} • {fileDetails.type}</p>
                  </div>
                  {status !== "processing" && (
                    <button
                      onClick={removeVideoFile}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-4"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {videoUrl && (
                  <VideoPlayer
                    videoUrl={videoUrl}
                    videoRef={videoRef}
                    T={T}
                  />
                )}
              </div>
            )}

            {/* Transcript Area */}
            {transcript && (
              <TranscriptPanel
                transcript={transcript}
                setTranscript={setTranscript}
                T={T}
              />
            )}

            {/* Frame Gallery Extractor */}
            {videoUrl && (
              <FrameExtractor
                frames={frames}
                interval={interval}
                setInterval={setIntervalVal}
                T={T}
              />
            )}

            {/* Pipeline Statistics */}
            <ProcessingStats stats={stats} T={T} />

            {/* Target AI Preset Processor Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>
                Target Converted Preset
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
              <ProcessingProgress stage={stage} progress={progress} T={T} />
            ) : (
              <Button
                onClick={triggerVideoTransform}
                className="w-full text-xs"
                disabled={!videoUrl}
              >
                Trigger Transform
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            )}

          </GlassCard>
        </div>

        {/* Right Output Column */}
        <div className="md:col-span-6">
          <OutputPanel
            output={output}
            setOutput={setOutput}
            T={T}
          />
        </div>

      </div>
    </div>
  );
}
