"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Upload, FileText, Download, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Copy, Check, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";

// --- SUB-COMPONENTS ---

// 1. PDF UPLOADER COMPONENT
interface PdfUploaderProps {
  onFileLoaded: (file: File, arrayBuffer: ArrayBuffer) => void;
  isProcessing: boolean;
  T: any;
}
function PdfUploader({ onFileLoaded, isProcessing, T }: PdfUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      alert("Invalid file type. Please upload a PDF document.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        onFileLoaded(file, e.target.result);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="application/pdf"
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
        className={`p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
          dragActive ? "border-purple-500 bg-purple-500/5" : "hover:border-purple-500/40"
        } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ backgroundColor: T.bgInput, borderColor: T.border }}
      >
        <FileText className="h-10 w-10 text-purple-500 mx-auto mb-3 animate-pulse" />
        <span className="text-xs font-bold block mb-1" style={{ color: T.textPrimary }}>
          Drag & drop PDF here or click to browse
        </span>
        <span className="text-[10px] text-slate-400 block" style={{ color: T.textSecondary }}>
          Supports all standard and scanned PDF documents up to 50MB
        </span>
      </div>
    </div>
  );
}

// 2. PDF PREVIEW COMPONENT
interface PdfPreviewProps {
  pdfDoc: any; // pdfjs document instance
  pageNumber: number;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  T: any;
}
function PdfPreview({ 
  pdfDoc, pageNumber, setPageNumber, scale, setScale, rotation, setRotation, T 
}: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    if (!pdfDoc) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cancel previous render tasks if running
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const viewport = page.getViewport({ scale, rotation });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF rendering error:", err);
        }
      }
    };

    renderPage();
  }, [pdfDoc, pageNumber, scale, rotation]);

  if (!pdfDoc) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-1.5">
          <Button 
            onClick={() => setPageNumber(p => Math.max(1, p - 1))} 
            disabled={pageNumber <= 1}
            variant="outline"
            className="p-1.5 h-auto rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[11px] font-bold" style={{ color: T.textPrimary }}>
            Page {pageNumber} of {pdfDoc.numPages}
          </span>
          <Button 
            onClick={() => setPageNumber(p => Math.min(pdfDoc.numPages, p + 1))} 
            disabled={pageNumber >= pdfDoc.numPages}
            variant="outline"
            className="p-1.5 h-auto rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))} 
            variant="outline" 
            className="p-1.5 h-auto rounded-lg"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-semibold" style={{ color: T.textSecondary }}>
            {Math.round(scale * 100)}%
          </span>
          <Button 
            onClick={() => setScale(s => Math.min(2.5, s + 0.25))} 
            variant="outline" 
            className="p-1.5 h-auto rounded-lg"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button 
            onClick={() => setRotation(r => (r + 90) % 360)} 
            variant="outline" 
            className="p-1.5 h-auto rounded-lg"
            title="Rotate Page"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div 
        className="w-full flex items-center justify-center p-3 rounded-xl border overflow-auto max-h-[360px]"
        style={{ backgroundColor: T.bgInput, borderColor: T.border }}
      >
        <canvas ref={canvasRef} className="shadow-lg max-w-full rounded-md" />
      </div>
    </div>
  );
}

// 3. PDF EXTRACTOR & PROGRESS DISPLAY
interface PdfExtractorProps {
  stage: string;
  progress: number;
  T: any;
}
function PdfExtractor({ stage, progress, T }: PdfExtractorProps) {
  return (
    <div className="space-y-3 p-4 rounded-xl border" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
      <div className="flex justify-between items-center text-[11px] font-bold">
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

// 4. PDF PROCESSOR SELECTOR
interface PdfProcessorProps {
  preset: string;
  setPreset: (val: string) => void;
  T: any;
}
function PdfProcessor({ preset, setPreset, T }: PdfProcessorProps) {
  const presets = [
    { id: "summary", label: "Summary" },
    { id: "minutes", label: "Minutes of Meeting" },
    { id: "actions", label: "Action Items" },
    { id: "notes", label: "Structured Notes" },
    { id: "markdown", label: "Markdown" },
    { id: "plain", label: "Plain Text" }
  ];

  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textSecondary }}>
        Target Content Preset
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            onClick={() => setPreset(item.id)}
            className="px-3 py-2 rounded-xl border text-center transition-all text-xs font-semibold"
            style={{
              backgroundColor: preset === item.id ? T.bgActive : T.bgInput,
              borderColor: preset === item.id ? T.primaryBright : T.border,
              color: preset === item.id ? T.textActive : T.textSecondary
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 5. OUTPUT DISPLAY PANEL
interface OutputPanelProps {
  output: string;
  setOutput: (val: string) => void;
  T: any;
}
function OutputPanel({ output, setOutput, T }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (format: "md" | "txt") => {
    const blob = new Blob([output], { type: format === "md" ? "text/markdown" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ACT_PDF_transformed.${format}`;
    a.click();
  };

  const handleDownloadPdf = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ACT Transformed PDF Output</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #111; line-height: 1.6; max-width: 800px; margin: 0 auto; }
              pre { white-space: pre-wrap; font-family: monospace; font-size: 13px; background: #f4f4f5; padding: 20px; border-radius: 8px; border: 1px solid #e4e4e7; }
            </style>
          </head>
          <body>
            <h2>ACT Converted Output</h2>
            <pre>${output}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <GlassCard className="h-[520px] flex flex-col justify-between border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
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
          placeholder="Target output markdown or document text will render here. Load a PDF, choose a preset, and click Trigger transform."
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
          <Button onClick={handleDownloadPdf} className="flex-1 text-xs py-2 rounded-lg bg-purple-650 hover:bg-purple-750">
            <Download className="h-3.5 w-3.5 mr-1" />
            Save as PDF
          </Button>
        </div>
      )}
    </GlassCard>
  );
}

// --- MAIN PAGE CONTAINER ---

export default function PdfTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [pdfLibLoaded, setPdfLibLoaded] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);

  // Preview options
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);

  // Pipeline execution
  const [preset, setPreset] = useState("summary");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [output, setOutput] = useState("");

  // Load PDF.js from CDN
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).pdfjsLib) {
      setPdfLibLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfLibLoaded(true);
      console.log("PDF.js library loaded dynamically");
    };
    script.onerror = () => {
      setErrorMsg("Failed to initialize PDF parsing dependencies from CDN.");
    };
    document.body.appendChild(script);
  }, []);

  const handleFileLoaded = async (file: File, buffer: ArrayBuffer) => {
    setErrorMsg("");
    setOutput("");
    setPdfDoc(null);
    setPageNumber(1);

    // Limit check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File exceeds the 50MB size limit.");
      return;
    }

    setFileDetails({
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    setArrayBuffer(buffer);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        throw new Error("PDF parser not initialized yet. Please try again.");
      }

      // Load PDF Document
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
    } catch (err: any) {
      console.error("PDF load error:", err);
      if (err.name === "PasswordException") {
        setErrorMsg("This PDF is password-protected. Please upload an unlocked PDF.");
      } else {
        setErrorMsg(err.message || "Failed to parse PDF file. The document may be corrupted.");
      }
      setFileDetails(null);
      setArrayBuffer(null);
    }
  };

  const triggerPdfTransform = async () => {
    if (!pdfDoc || !arrayBuffer) {
      alert("Please upload a PDF document first.");
      return;
    }

    setErrorMsg("");
    setStatus("processing");
    setStage("Reading PDF Pages...");
    setProgress(10);

    try {
      const pdfjsLib = (window as any).pdfjsLib;
      const numPages = pdfDoc.numPages;
      let extractedText = "";

      // 1. EXTRACT TEXT OR OCR SEQUENTIALLY TO AVOID FREEZING
      for (let i = 1; i <= numPages; i++) {
        setStage(`Reading Page ${i} of ${numPages}...`);
        setProgress(Math.round((i / numPages) * 50) + 10);

        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = textContent.items.map((item: any) => item.str).join(" ");

        // Scanned page check: if text is empty or too short, render to canvas and trigger OCR
        if (pageText.trim().length < 80) {
          setStage(`Running OCR on Page ${i}...`);
          
          // Render page to canvas at high scale for OCR accuracy
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const renderTask = page.render({ canvasContext: ctx, viewport });
            await renderTask.promise;
            const base64Image = canvas.toDataURL("image/jpeg");

            // Trigger Backend OCR
            const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
            const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
            const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

            const ocrPayload = {
              fileData: base64Image,
              fileName: `page_${i}.jpeg`,
              fileType: "image/jpeg",
              format: "OCR Text",
              model: "Gemini Pro",
              apiKey: savedApiKey || null,
              openaiKey: savedOpenaiKey || null,
              cohereKey: savedCohereKey || null,
            };

            const ocrData = await ApiClient.postTransform(ocrPayload);
            pageText = ocrData.output || "";
          }
        }

        extractedText += `[PAGE ${i}]\n${pageText}\n\n`;
        // Yield execution back to browser loop to prevent thread locking
        await new Promise((r) => setTimeout(r, 80));
      }

      if (!extractedText.trim()) {
        throw new Error("PDF yielded empty content. Text extraction and OCR failed to recover readable letters.");
      }

      // 2. TRIGGER TARGET AI TRANSFORMATION PRESETS
      setStage("Generating AI response...");
      setProgress(85);

      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      let targetPresetPrompt = "";
      if (preset === "summary") {
        targetPresetPrompt = "Summary (Generate a concise professional summary)";
      } else if (preset === "minutes") {
        targetPresetPrompt = "Minutes of Meeting (Convert the text into structured meeting minutes)";
      } else if (preset === "actions") {
        targetPresetPrompt = "Action Items (Extract only action items, owners if available, and deadlines)";
      } else if (preset === "notes") {
        targetPresetPrompt = "Structured Notes (Reorganize text into comprehensive structured study/project notes)";
      } else if (preset === "markdown") {
        targetPresetPrompt = "Markdown (Reformat document structure cleanly using semantic Markdown styles)";
      } else {
        targetPresetPrompt = "Plain Text (Transform text cleanly maintaining readable alignments)";
      }

      const transformPayload = {
        text: extractedText,
        format: targetPresetPrompt,
        model: "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      const data = await ApiClient.postTransform(transformPayload);

      setStatus("done");
      setProgress(100);
      setStage("Completed");
      setOutput(data.output || "No output generated by target model.");

      // Save to transform history logs
      saveToHistory({
        file: fileDetails?.name || "Transformed_Document.pdf",
        action: `PDF to ${preset.charAt(0).toUpperCase() + preset.slice(1)}`,
        tokens: Math.floor((extractedText || "").length / 4) + 150,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to transform PDF content or connect to AI engine.");
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

  const removePdfFile = () => {
    setFileDetails(null);
    setPdfDoc(null);
    setArrayBuffer(null);
    setPageNumber(1);
    setOutput("");
    setErrorMsg("");
    setStatus("idle");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <FileText className="h-6 w-6 text-purple-500" />
            PDF Content Transformation
          </h1>
          <p className="text-xs mt-0.5" style={{ color: T.textSecondary }}>
            Upload PDFs (selectable or scanned) to extract text and compile structured summaries or notes.
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
        
        {/* Left Side: Upload & Preview Controls */}
        <div className="md:col-span-6 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800" style={{ color: T.textPrimary }}>PDF Transform Workspace</h3>
                <p className="text-[10px] text-slate-500" style={{ color: T.textSecondary }}>Choose formats and inspect PDF pages</p>
              </div>
            </div>

            {/* Stage 1: Upload */}
            {!fileDetails ? (
              <PdfUploader 
                onFileLoaded={handleFileLoaded} 
                isProcessing={status === "processing"} 
                T={T} 
              />
            ) : (
              <div className="space-y-4">
                {/* File Details Bar */}
                <div className="p-3.5 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{fileDetails.name}</p>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">{fileDetails.size} • {pdfDoc ? `${pdfDoc.numPages} pages` : "Reading..."}</p>
                  </div>
                  {status !== "processing" && (
                    <button 
                      onClick={removePdfFile}
                      className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-4"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* PDF Page Preview */}
                {pdfDoc && (
                  <PdfPreview
                    pdfDoc={pdfDoc}
                    pageNumber={pageNumber}
                    setPageNumber={setPageNumber}
                    scale={scale}
                    setScale={setScale}
                    rotation={rotation}
                    setRotation={setRotation}
                    T={T}
                  />
                )}
              </div>
            )}

            {/* Target Template Preset Processor Selector */}
            <PdfProcessor preset={preset} setPreset={setPreset} T={T} />

            {/* Process Loader / Start Action */}
            {status === "processing" ? (
              <PdfExtractor stage={stage} progress={progress} T={T} />
            ) : (
              <Button 
                onClick={triggerPdfTransform} 
                className="w-full text-xs"
                disabled={!pdfDoc || !pdfLibLoaded}
              >
                Trigger Transform
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            )}

          </GlassCard>
        </div>

        {/* Right Side: Output Panel */}
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
