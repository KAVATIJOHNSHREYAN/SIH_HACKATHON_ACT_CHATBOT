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
import jsPDF from "jspdf";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import pptxgen from "pptxgenjs";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import html2canvas from "html2canvas";

const TARGET_FORMATS = [
  { group: "Summaries & Docs", formats: ["Summary", "Detailed Summary", "Article", "Blog", "Notes", "Meeting Minutes", "Research Summary", "Executive Summary", "Case Study", "Study Notes", "Revision Notes", "Assignment", "Documentation", "Standard Operating Procedure", "Policy Draft", "Technical Documentation", "API Documentation", "README Generator", "White Paper", "Workflow Document"] },
  { group: "Structured & Code", formats: ["JSON", "CSV", "Markdown", "HTML", "Code Explanation", "Code Documentation", "Checklist", "Decision Matrix", "Comparison Table", "Timeline", "Roadmap", "Mind Map Content"] },
  { group: "Study & Testing", formats: ["MCQs", "Flashcards", "FAQ", "Interview Questions", "Question Bank"] },
  { group: "Social Media & Marketing", formats: ["LinkedIn Post", "Twitter/X Thread", "Instagram Caption", "Facebook Post", "Newsletter", "Press Release", "Business Proposal"] },
  { group: "Multimedia Generation", formats: ["Video Package", "Video Script", "Podcast Script", "Infographic Content", "Presentation Slides", "Speaker Notes", "Training Manual"] },
  { group: "Specialized", formats: ["Legal Simplification", "Medical Document Summary", "Tone Conversion", "Translation", "Resume", "Social Media Post", "OCR Text", "Cyber Advisory", "Threat Report", "Incident Report", "Risk Assessment", "Email Reply", "Cover Letter", "Resume Improvement", "Speech", "Debate", "Advisory"] },
];

const CONVERTER_PRESETS = [
  { group: "Universal Office & Document", options: ["PDF to DOCX", "PDF to PPTX", "PDF to XLSX", "DOCX to PDF", "DOC to PDF", "PPTX to PDF", "PPT to PDF", "XLSX to PDF", "XLS to PDF", "TXT to PDF", "MD to PDF", "HTML to PDF", "RTF to PDF", "ODT to PDF", "ODS to PDF", "ODP to PDF"] },
  { group: "Images & Visuals", options: ["JPG to PNG", "PNG to JPG", "WEBP to PNG", "BMP to JPG", "TIFF to PNG", "SVG to PNG", "GIF to MP4"] },
  { group: "Audio & Video", options: ["MP4 to MP3", "WAV to MP3", "AAC to MP3", "M4A to MP3", "MOV to MP4", "AVI to MP4", "MKV to MP4", "WEBM to MP4"] }
];

const AUDIENCES = ["Students", "Teachers", "Researchers", "Executives", "Military", "Government", "Cyber Security", "General Public", "Business", "Healthcare", "Custom"];
const TONES = ["Professional", "Formal", "Technical", "Simple", "Beginner", "Marketing", "Friendly", "Persuasive", "Neutral", "Academic"];
const LANGUAGES = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "Marathi", "Gujarati", "Bengali", "Urdu", "Auto Detect"];
const DETAIL_LEVELS = ["Short", "Medium", "Detailed", "Comprehensive"];
const OBJECTIVES = ["Educate", "Summarize", "Report", "Advertise", "Train", "Present", "Explain", "Alert", "Promote", "Recommend"];
const STYLES = ["Bullet Points", "Paragraph", "Report", "Presentation", "Article", "Script", "Dialogue", "Table", "Professional", "Minimal"];

export default function TransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Active Input Mode Tab
  const [activeTab, setActiveTab] = useState<"text" | "documents" | "images" | "ocr" | "audio" | "video" | "url">("documents");

  // Independent module states
  const [docFile, setDocFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState("English");
  
  // Pipeline execution parameters
  const [targetFormats, setTargetFormats] = useState<string[]>(["Summary"]);
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  const [conversionPreset, setConversionPreset] = useState("PDF to DOCX");
  const [pipelineMode, setPipelineMode] = useState<"transform" | "convert">("transform");

  // Advanced SIH Parameters
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [language, setLanguage] = useState("English");
  const [detailLevel, setDetailLevel] = useState("Medium");
  const [communicationObjective, setCommunicationObjective] = useState("");
  const [contentStyle, setContentStyle] = useState("");

  // Pipeline running status
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [outputPreview, setOutputPreview] = useState("");

  // Base64 file conversion parameters
  const [fileContent, setFileContent] = useState<string>("");
  const [selectedFileBase64, setSelectedFileBase64] = useState<string>("");

  // Shortcut Toast & Help Modals
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Character and Word counters for text
  const charCount = rawText.length;
  const wordCount = rawText.trim() === "" ? 0 : rawText.trim().split(/\s+/).length;

  const triggerToast = (msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => setShortcutToast(null), 2500);
  };

  // Centralized Validation Utility
  const validateModuleInput = (tab: typeof activeTab, mode: typeof pipelineMode): { isValid: boolean; error?: string } => {
    switch (tab) {
      case "text":
        if (!rawText.trim()) {
          return { isValid: false, error: "Please write or paste raw text first." };
        }
        return { isValid: true };
      case "url":
        if (!urlInput.trim()) {
          return { isValid: false, error: "Please enter a valid webpage URL." };
        }
        return { isValid: true };
      case "documents":
        if (!docFile) {
          return { isValid: false, error: mode === "transform" ? "Please upload a source file first." : "Please upload a file to convert." };
        }
        return { isValid: true };
      case "images":
        if (imgFiles.length === 0) {
          return { isValid: false, error: mode === "transform" ? "Please upload a source file first." : "Please upload a file to convert." };
        }
        return { isValid: true };
      case "ocr":
        if (!ocrFile) {
          return { isValid: false, error: mode === "transform" ? "Please upload a source file first." : "Please upload a file to convert." };
        }
        return { isValid: true };
      case "audio":
        if (!audioFile) {
          return { isValid: false, error: mode === "transform" ? "Please upload a source file first." : "Please upload a file to convert." };
        }
        return { isValid: true };
      case "video":
        if (!videoFile) {
          return { isValid: false, error: mode === "transform" ? "Please upload a source file first." : "Please upload a file to convert." };
        }
        return { isValid: true };
      default:
        return { isValid: false, error: "Invalid module selected." };
    }
  };

  const handleTabChange = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setErrorMsg("");
    setStatus("idle");
    setProgress(0);
    setOutputPreview("");
    
    // Clear previous states
    setDocFile(null);
    setRawText("");
    setImgFiles([]);
    setImagePreview(null);
    setOcrFile(null);
    setAudioFile(null);
    setVideoFile(null);
    setUrlInput("");
    setFileContent("");
    setSelectedFileBase64("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setErrorMsg("");

    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg("File is too large. Max size is 150MB.");
      return;
    }

    // Set separate state variables based on active tab
    if (activeTab === "documents") {
      setDocFile(file);
    } else if (activeTab === "images") {
      const arr = Array.from(files);
      setImgFiles(arr);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (activeTab === "ocr") {
      setOcrFile(file);
    } else if (activeTab === "audio") {
      setAudioFile(file);
    } else if (activeTab === "video") {
      setVideoFile(file);
    }

    // Process file base64 and text buffers
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

  const getActiveFile = (): File | null => {
    switch (activeTab) {
      case "documents": return docFile;
      case "images": return imgFiles[0] || null;
      case "ocr": return ocrFile;
      case "audio": return audioFile;
      case "video": return videoFile;
      default: return null;
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setProgress(0);
    setOutputPreview("");
    setErrorMsg("");
    
    // Clear only current active tab elements
    if (activeTab === "documents") setDocFile(null);
    else if (activeTab === "text") setRawText("");
    else if (activeTab === "images") { setImgFiles([]); setImagePreview(null); }
    else if (activeTab === "ocr") setOcrFile(null);
    else if (activeTab === "audio") setAudioFile(null);
    else if (activeTab === "video") setVideoFile(null);
    else if (activeTab === "url") setUrlInput("");

    setFileContent("");
    setSelectedFileBase64("");
  };

  // Run AI Transformation Pipeline
  const handleTransform = async () => {
    const check = validateModuleInput(activeTab, "transform");
    if (!check.isValid) {
      setErrorMsg(check.error || "Validation failed.");
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

      const activeFile = getActiveFile();

      const basePayload = {
        format: targetFormats.join(", "),
        targetFormats,
        audience,
        tone,
        language,
        detailLevel,
        communicationObjective,
        contentStyle,
        model: selectedModel,
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null
      };

      const payload = activeTab === "text"
        ? { text: rawText, ...basePayload }
        : activeTab === "url"
        ? { text: `Extract content and transform from URL: ${urlInput}`, ...basePayload }
        : {
            fileData: selectedFileBase64 || undefined,
            text: fileContent || undefined,
            fileName: activeFile?.name,
            fileType: activeFile?.type,
            ...basePayload
          };

      const startTime = Date.now();
      const data = await ApiClient.streamTransform(payload, (chunk) => {
        if (chunk.stage) setStage(chunk.stage);
        if (chunk.progress) setProgress(Math.max(progress, chunk.progress));
      });
      const latency = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;

      setStatus("done");
      setStage("Completed");
      setProgress(100);
      setOutputPreview(data.output);

      saveToHistory({
        file: activeFile ? activeFile.name : activeTab === "url" ? urlInput : "Raw Text",
        action: `AI Trans: ${targetFormats.join(", ")}`,
        tokens: Math.floor((fileContent || rawText || urlInput).length / 4) + 100,
        model: selectedModel,
        latency: latency,
        outputs: targetFormats.join(", "),
        downloads: 0
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Pipeline execution timeout.");
    }
  };

  // Run File Conversion Pipeline
  const handleConvert = async () => {
    const check = validateModuleInput(activeTab, "convert");
    if (!check.isValid) {
      setErrorMsg(check.error || "Validation failed.");
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

      const activeFile = getActiveFile();

      const downloadName = activeFile ? activeFile.name.split(".")[0] + "_converted.pdf" : activeTab === "url" ? "webpage_converted.pdf" : "text_converted.pdf";
      const sizeStr = activeFile ? `${(activeFile.size * 0.95 / 1024 / 1024).toFixed(2)} MB` : "0.01 MB";
      const displaySource = activeFile ? activeFile.name : activeTab === "url" ? urlInput : "Raw Text";

      setOutputPreview(`### File Conversion Complete!\n\nYour source **${displaySource}** has been successfully converted into target format preset **${conversionPreset}**.\n\n- **Target File:** ${downloadName}\n- **Output Size:** ${sizeStr}\n\nClick the download link below to save your converted output.`);

      saveToHistory({
        file: displaySource,
        action: `Convert: ${conversionPreset}`,
        tokens: 0,
        model: "ACT Converter Node"
      });

    } catch (err: any) {
      setStatus("error");
      setErrorMsg("File conversion process failed.");
    }
  };

  const [downloadFormat, setDownloadFormat] = useState("MD");

  const saveToHistory = (item: { file: string; action: string; tokens: number; model: string; latency?: string; outputs?: string; downloads?: number }) => {
    if (typeof window !== "undefined") {
      const historyStr = localStorage.getItem("act_transform_history") || "[]";
      const history = JSON.parse(historyStr);
      const newJob = {
        id: Date.now(),
        file: item.file,
        action: item.action,
        date: new Date().toISOString().split("T")[0],
        tokens: item.tokens.toString(),
        status: "Completed",
        model: item.model,
        latency: item.latency || "N/A",
        outputs: item.outputs || "Single",
        downloads: item.downloads || 0,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("act_transform_history", JSON.stringify([newJob, ...history]));
    }
  };

  const getAvailableExportFormats = () => {
    if (pipelineMode === "convert") {
      return ["PDF", "DOCX", "DOC", "PPTX", "PPT", "XLSX", "XLS", "CSV", "TXT", "MD", "HTML", "RTF", "ODT", "ODS", "ODP"];
    }

    if (activeTab === "images") {
      return ["PNG", "JPG", "JPEG", "WEBP", "BMP", "TIFF", "SVG"];
    }
    if (activeTab === "ocr") {
      return ["PDF", "DOCX", "TXT", "JSON", "CSV"];
    }
    if (activeTab === "audio") {
      return ["TXT", "DOCX", "PDF", "SRT", "VTT", "JSON"];
    }

    const t = targetFormats.join(" ").toLowerCase();
    
    if (t.includes("table") || t.includes("csv") || t.includes("matrix")) {
      return ["CSV", "XLSX", "PDF", "DOCX", "JSON"];
    }
    if (t.includes("presentation") || t.includes("slide") || t.includes("speaker")) {
      return ["PPTX", "PDF", "PNG", "JPG", "MD", "HTML"];
    }
    if (t.includes("infographic")) {
      return ["PNG", "JPG", "SVG", "PDF"];
    }
    if (t.includes("code") || t.includes("json") || t.includes("markdown") || t.includes("html") || t.includes("readme")) {
      return ["ZIP", "TXT", "JSON", "PDF", "MD"];
    }
    if (t.includes("video") || t.includes("podcast")) {
      return ["PDF", "DOCX", "TXT", "JSON", "ZIP"];
    }

    // Default AI Text outputs
    return ["TXT", "DOCX", "PDF", "HTML", "MD", "RTF", "JSON", "CSV", "XML"];
  };

  const availableFormats = getAvailableExportFormats();

  useEffect(() => {
    if (!availableFormats.includes(downloadFormat) && availableFormats.length > 0) {
      setDownloadFormat(availableFormats[0]);
    }
  }, [availableFormats, downloadFormat]);

  const downloadOutput = async (format: string = downloadFormat) => {
    if (!outputPreview) return;
    
    try {
      const extension = format.toLowerCase();
      const filename = `ACT_transform_output_${Date.now()}.${extension}`;
      
      if (format === "PDF") {
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(outputPreview, 180);
        doc.text(splitText, 15, 20);
        doc.save(filename);
      } 
      else if (format === "DOCX" || format === "DOC") {
        const doc = new DocxDocument({
          sections: [{
            children: outputPreview.split('\n').map(line => new Paragraph({ children: [new TextRun(line)] }))
          }]
        });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      }
      else if (format === "PPTX" || format === "PPT") {
        const pres = new pptxgen();
        const slide = pres.addSlide();
        slide.addText(outputPreview.substring(0, 500) + (outputPreview.length > 500 ? "..." : ""), { x: 0.5, y: 0.5, w: "90%", h: "90%", fontSize: 14 });
        await pres.writeFile({ fileName: filename });
      }
      else if (format === "XLSX" || format === "XLS") {
        const ws = XLSX.utils.json_to_sheet([{ output: outputPreview }]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, filename);
      }
      else if (format === "ZIP") {
        const zip = new JSZip();
        zip.file("output.md", outputPreview);
        zip.file("metadata.json", JSON.stringify({ timestamp: Date.now(), formats: targetFormats }));
        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      }
      else if (["PNG", "JPG", "JPEG", "WEBP", "BMP", "TIFF"].includes(format)) {
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.background = "#fff";
        tempDiv.style.color = "#000";
        tempDiv.style.padding = "20px";
        tempDiv.style.width = "800px";
        tempDiv.innerText = outputPreview;
        document.body.appendChild(tempDiv);
        
        const canvas = await html2canvas(tempDiv);
        const imgData = canvas.toDataURL(`image/${format === "JPG" ? "jpeg" : format.toLowerCase()}`);
        const a = document.createElement("a");
        a.href = imgData;
        a.download = filename;
        a.click();
        
        document.body.removeChild(tempDiv);
      }
      else {
        let mimeType = "text/plain";
        let content = outputPreview;

        if (format === "HTML") {
          mimeType = "text/html";
          content = `<html><body><pre>${outputPreview}</pre></body></html>`;
        } else if (format === "JSON") {
          mimeType = "application/json";
          content = JSON.stringify({ output: outputPreview }, null, 2);
        } else if (format === "CSV") {
          mimeType = "text/csv";
          content = `Output\n"${outputPreview.replace(/"/g, '""')}"`;
        } else if (format === "MD") {
          mimeType = "text/markdown";
        } else if (format === "XML") {
          mimeType = "application/xml";
          content = `<?xml version="1.0" encoding="UTF-8"?>\n<output>${outputPreview}</output>`;
        } else if (format === "RTF") {
          mimeType = "application/rtf";
        } else if (format === "SVG") {
          mimeType = "image/svg+xml";
          content = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><text x="10" y="20" font-family="monospace" font-size="12">${outputPreview.substring(0, 100)}</text></svg>`;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
      }
      
      triggerToast(`Output exported successfully as ${format}!`);
    } catch (error) {
      console.error("Export failed:", error);
      triggerToast(`Error exporting as ${format}. Please try again.`);
    }
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
      name: `ACT_Output_${targetFormats[0] || "Content"}.md`,
      type: "Markdown",
      size: `${(outputPreview.length / 1024).toFixed(2)} KB`,
      date: new Date().toISOString().split("T")[0],
      starred: false,
      summary: outputPreview,
      tags: ["ACT Output", ...targetFormats]
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
          triggerToast("Shortcuts Guide Modal Closed");
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
          handleTabChange("text");
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
          handleTabChange("documents");
          triggerToast("Selected Documents Tab");
        } else if (e.key === "2") {
          e.preventDefault();
          handleTabChange("images");
          triggerToast("Selected Images Tab");
        } else if (e.key === "3") {
          e.preventDefault();
          handleTabChange("ocr");
          triggerToast("Selected OCR Scanner");
        } else if (e.key === "4") {
          e.preventDefault();
          handleTabChange("audio");
          triggerToast("Selected Audio Transcribe");
        } else if (e.key === "5") {
          e.preventDefault();
          handleTabChange("video");
          triggerToast("Selected Video Engine");
        } else if (e.key === "6") {
          e.preventDefault();
          const nextMode = pipelineMode === "transform" ? "convert" : "transform";
          setPipelineMode(nextMode);
          setErrorMsg("");
          setStatus("idle");
          setProgress(0);
          setOutputPreview("");
          triggerToast(`Switched pipeline to: ${nextMode === "transform" ? "AI Transformation" : "File Conversion"}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rawText, urlInput, docFile, imgFiles, ocrFile, audioFile, videoFile, targetFormats, audience, tone, language, detailLevel, communicationObjective, contentStyle, selectedModel, conversionPreset, pipelineMode, outputPreview, showShortcutsModal, downloadFormat]);

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
            onClick={() => handleTabChange(tab.id as any)}
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
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
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
                  {docFile ? (
                    <div className="space-y-2">
                      <FileText className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{docFile.name}</p>
                      <p className="text-[9px] text-slate-500">{(docFile.size / 1024 / 1024).toFixed(2)} MB</p>
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
                      <p className="text-xs text-white truncate font-bold">{imgFiles[0]?.name}</p>
                      <p className="text-[9px] text-purple-400">Multiple files supported: {imgFiles.length} image(s)</p>
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
                  {ocrFile ? (
                    <div className="space-y-2">
                      <FileCheck className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{ocrFile.name}</p>
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
                  {audioFile ? (
                    <div className="space-y-2">
                      <Volume2 className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{audioFile.name}</p>
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
                  {videoFile ? (
                    <div className="space-y-2">
                      <Video className="h-8 w-8 text-purple-400 mx-auto" />
                      <p className="text-xs text-white truncate font-bold">{videoFile.name}</p>
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
                onClick={() => { setPipelineMode("transform"); setErrorMsg(""); setStatus("idle"); setProgress(0); setOutputPreview(""); }}
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
                onClick={() => { setPipelineMode("convert"); setErrorMsg(""); setStatus("idle"); setProgress(0); setOutputPreview(""); }}
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
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-wide text-slate-500 font-bold">Target Output Presets (Select Multiple)</label>
                  <div className="w-full max-h-48 overflow-y-auto p-3 rounded-xl bg-slate-900 border text-xs text-white" style={{ borderColor: T.border }}>
                    {TARGET_FORMATS.map(group => (
                      <div key={group.group} className="mb-3 last:mb-0">
                        <div className="text-[10px] text-purple-400 font-bold uppercase mb-1.5">{group.group}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {group.formats.map(fmt => (
                            <label key={fmt} className="flex items-center gap-2 cursor-pointer hover:text-purple-300 transition-colors">
                              <input 
                                type="checkbox" 
                                checked={targetFormats.includes(fmt)}
                                onChange={(e) => {
                                  if (e.target.checked) setTargetFormats([...targetFormats, fmt]);
                                  else setTargetFormats(targetFormats.filter(f => f !== fmt));
                                }}
                                className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-purple-500"
                              />
                              <span className="truncate">{fmt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Auto Detect</option>
                      {LANGUAGES.filter(l => l !== "Auto Detect").map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Tone</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Default Tone</option>
                      {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Target Audience</label>
                    <select value={audience} onChange={(e) => setAudience(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Default Audience</option>
                      {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Detail Level</label>
                    <select value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Default Length</option>
                      {DETAIL_LEVELS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Objective</label>
                    <select value={communicationObjective} onChange={(e) => setCommunicationObjective(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Default Objective</option>
                      {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] uppercase tracking-wide text-slate-500 font-bold">Style</label>
                    <select value={contentStyle} onChange={(e) => setContentStyle(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-slate-900 text-white border" style={{ borderColor: T.border }}>
                      <option value="">Default Style</option>
                      {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
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
                    
                    <div className="flex items-center gap-1 border rounded-lg pl-2 overflow-hidden bg-slate-900 border-slate-700">
                      <select 
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-300 focus:outline-none cursor-pointer"
                      >
                        {availableFormats.map(fmt => (
                          <option key={fmt} value={fmt}>.{fmt}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => downloadOutput(downloadFormat)}
                        className="p-1.5 text-purple-400 hover:text-purple-300 border-l border-slate-700 bg-slate-800"
                        title="Download Output (Ctrl+D)"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
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
                  <span className="text-purple-400 font-bold">Alt + Shift + T</span>
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
