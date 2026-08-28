"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Camera, Upload, Trash2, 
  FileText, Clipboard, Download, CheckSquare, Sparkles, AlertCircle 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";

export default function OcrTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [mode, setMode] = useState<"upload" | "camera">("upload");
  
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileTextContent, setFileTextContent] = useState<string>("");

  // Pipeline states
  const [selectedModel, setSelectedModel] = useState("Gemini Pro");
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [ocrOutput, setOcrOutput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Close camera on mode switch
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [mode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qUpload = params.get("upload");
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

  // Tab visibility changes, page unload and tab navigation cleanup listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab hidden, stopping camera immediately...");
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      console.log("Page unloading, stopping camera immediately...");
      stopCamera();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Cleanup camera streams on unmount/route change
      if (streamRef.current) {
        console.log("Component unmounting, releasing camera streams...");
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Stream binder to connect incoming media streams to the Video DOM Ref dynamically
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      console.log("MediaStream received");
      videoRef.current.srcObject = cameraStream;
      console.log("Video attached");
      videoRef.current.play()
        .then(() => {
          console.log("Video playing");
        })
        .catch((err) => {
          console.error("Error playing webcam video stream:", err);
        });
    }
  }, [cameraActive, cameraStream]);

  const startCamera = async () => {
    try {
      setErrorMsg("");
      console.log("Requesting camera permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      console.log("Camera permission granted");
      streamRef.current = stream;
      setCameraStream(stream);
      setCameraActive(true);
      setCameraPermission("granted");
      setCapturedImage(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraPermission("denied");
      
      // Detailed user-friendly errors
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMsg("Camera permission denied. Please allow camera access in browser settings.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMsg("No camera detected on this device. Please connect a webcam.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMsg("Camera already in use. Please close other applications using the camera.");
      } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        setErrorMsg("HTTPS security is required to access the camera on remote servers.");
      } else {
        setErrorMsg(`Failed to access camera: ${err.message || "Unknown error"}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped track via streamRef: ${track.label}`);
      });
      streamRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    console.log("Webcam released and preview reset");
    setCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        console.log("Frame captured");
        setCapturedImage(dataUrl);
        setFileBase64(dataUrl);
        setSelectedFile(null); // clears uploaded file when camera snapshot captured
        stopCamera();
      }
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setCapturedImage(null);
    setErrorMsg("");
    setOcrOutput("");

    // Limit check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg("File exceeds the 50MB size limit.");
      setSelectedFile(null);
      return;
    }

    const reader = new FileReader();

    if (
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md")
    ) {
      reader.onload = (event) => {
        setFileTextContent(event.target?.result as string || "");
        setFileBase64("");
      };
      reader.readAsText(file);
    } else {
      // PDF, Images, DOCX, etc.
      reader.onload = (event) => {
        setFileBase64(event.target?.result as string || "");
        setFileTextContent("");
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileBase64("");
    setFileTextContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerOcrTransform = async () => {
    if (mode === "upload" && !selectedFile) {
      alert("Please upload a file or drop one first.");
      return;
    }
    if (mode === "camera" && !capturedImage) {
      alert("Please take a camera snapshot first.");
      return;
    }

    setErrorMsg("");
    setStatus("processing");
    setStage("Uploading content matrix...");
    setProgress(20);

    try {
      await new Promise((r) => setTimeout(r, 600));
      setStage("Parsing file layout schemas...");
      setProgress(50);

      await new Promise((r) => setTimeout(r, 600));
      setStage("Running ACT OCR character mapping...");
      setProgress(80);

      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      let customFormat = "OCR Text";
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qPrompt = params.get("prompt");
        if (qPrompt) {
          customFormat = qPrompt;
        }
      }

      const payload = mode === "upload"
        ? {
            fileData: fileBase64 || undefined,
            text: fileTextContent || undefined,
            fileName: selectedFile?.name,
            fileType: selectedFile?.type,
            format: customFormat,
            model: selectedModel,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          }
        : {
            fileData: capturedImage || undefined,
            fileName: "Camera_Capture.jpeg",
            fileType: "image/jpeg",
            format: customFormat,
            model: selectedModel,
            apiKey: savedApiKey || null,
            openaiKey: savedOpenaiKey || null,
            cohereKey: savedCohereKey || null,
          };

      const data = await ApiClient.postTransform(payload);

      setStatus("done");
      setProgress(100);
      setStage("Output completed");
      setOcrOutput(data.output || "No output generated by OCR.");

      // Log to transform history
      saveToHistory({
        file: selectedFile ? selectedFile.name : "Camera_Capture.jpeg",
        action: `OCR to Text`,
        tokens: Math.floor((fileTextContent || ocrOutput || "").length / 4) + 180,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Failed to parse OCR stream or connect to AI engine.");
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <Camera className="h-6 w-6 text-purple-600" />
            OCR Document Scanner
          </h1>
          <p className="text-slate-600 text-xs mt-0.5" style={{ color: T.textSecondary }}>
            Upload PDFs/Images or snap live pictures using your webcam to extract editable text instantly.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode selectors */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit border" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
        <button
          onClick={() => setMode("upload")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: mode === "upload" ? T.bgActive : "transparent",
            color: mode === "upload" ? T.textActive : T.textSecondary
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          File Upload
        </button>
        <button
          onClick={() => setMode("camera")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{
            backgroundColor: mode === "camera" ? T.bgActive : "transparent",
            color: mode === "camera" ? T.textActive : T.textSecondary
          }}
        >
          <Camera className="h-3.5 w-3.5" />
          Webcam Capture
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Configuration Column */}
        <div className="md:col-span-6 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800" style={{ color: T.textPrimary }}>ACT OCR Configuration</h3>
                <p className="text-[10px] text-slate-500" style={{ color: T.textSecondary }}>Set processing target engine parameters</p>
              </div>
            </div>

            {/* Mode 1: File Upload */}
            {mode === "upload" ? (
              <div className="space-y-4">
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:border-purple-500/50"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                >
                  <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-xs font-bold" style={{ color: T.textPrimary }}>
                    {selectedFile ? selectedFile.name : "Drag & drop PDF / image here or click"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Supports PDF, PNG, JPG, JPEG, WebP (Max 50MB)</p>
                </div>

                {selectedFile && (
                  <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: T.textPrimary }}>{selectedFile.name}</p>
                      <p className="text-[9px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={removeSelectedFile} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Mode 2: Camera Capture
              <div className="space-y-4">
                {cameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden border aspect-video" style={{ borderColor: T.border }}>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <Button onClick={captureSnapshot} className="bg-purple-600 hover:bg-purple-700 text-xs px-4">
                        Capture Image
                      </Button>
                      <Button onClick={stopCamera} className="bg-slate-700 hover:bg-slate-800 text-xs px-4">
                        Turn Off Camera
                      </Button>
                    </div>
                  </div>
                ) : capturedImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center p-2">
                    <img src={capturedImage} alt="Captured preview" className="rounded-xl max-h-56 object-contain" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <Button onClick={startCamera} className="bg-purple-600 hover:bg-purple-700 text-xs px-4">
                        Take Another
                      </Button>
                      <Button onClick={() => { setCapturedImage(null); setFileBase64(""); }} className="bg-red-650 hover:bg-red-700 text-xs px-4">
                        Clear Photo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={startCamera}
                    className="p-10 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all hover:border-purple-500/50"
                    style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                  >
                    <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-bold" style={{ color: T.textPrimary }}>Click to Turn On Camera</p>
                    <p className="text-[10px] text-slate-400 mt-1">Requires webcam permission</p>
                  </div>
                )}
              </div>
            )}

            {/* Model Select */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide" style={{ color: T.textSecondary }}>Select OCR Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-purple-500 cursor-pointer shadow-sm font-semibold"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                <option value="Gemini Pro" style={{ backgroundColor: T.bgCard, color: T.textPrimary }}>Gemini Pro</option>
                <option value="GPT-4o" style={{ backgroundColor: T.bgCard, color: T.textPrimary }}>GPT-4o</option>
                <option value="Claude 3.5 Sonnet" style={{ backgroundColor: T.bgCard, color: T.textPrimary }}>Claude 3.5 Sonnet</option>
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
              <Button onClick={triggerOcrTransform} className="w-full text-xs">
                Trigger OCR Transform
                <RefreshCw className="ml-2 h-4 w-4" />
              </Button>
            )}

          </GlassCard>
        </div>

        {/* Output Panel */}
        <div className="md:col-span-6">
          <GlassCard className="h-[520px] flex flex-col justify-between border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
                <span className="text-xs font-bold text-slate-800" style={{ color: T.textPrimary }}>Extracted Text Result</span>
                <span className="text-[10px]" style={{ color: T.textSecondary }}>Format: Plain Text</span>
              </div>

              <div 
                className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                {ocrOutput ? (
                  ocrOutput
                ) : (
                  <span className="text-slate-400 italic">No text extracted yet. Load a source PDF or image, snap a photo, and click trigger.</span>
                )}
              </div>

            </div>

            {ocrOutput && (
              <div className="pt-4 border-t flex gap-2" style={{ borderColor: T.border }}>
                <Button 
                  onClick={() => { navigator.clipboard.writeText(ocrOutput); alert("Copied to clipboard!"); }}
                  className="flex-1 text-xs bg-slate-700 hover:bg-slate-800"
                >
                  <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                  Copy Text
                </Button>
                <Button 
                  onClick={() => {
                    const blob = new Blob([ocrOutput], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `OCR_Extracted_Output.txt`;
                    a.click();
                  }} 
                  className="flex-1 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download (.txt)
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
