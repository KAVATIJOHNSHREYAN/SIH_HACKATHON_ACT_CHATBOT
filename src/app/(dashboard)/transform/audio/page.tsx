"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Mic, Square, Play, Pause, 
  Upload, FileAudio, FileText, CheckSquare, ListPlus, Volume2, Trash2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { ApiClient } from "@/lib/apiClient";
import { OutputPanel } from "@/components/OutputPanel";
import { presetOptions, presetPrompts } from "@/lib/presets";
import { uploadFileMultipart } from "@/lib/uploadUtils";

// Speech Recognition Type definition for TypeScript
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
};

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export default function AudioTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Toggle modes: "upload" vs "record"
  const [mode, setMode] = useState<"upload" | "record">("upload");

  // Microphone state
  const [micPermission, setMicPermission] = useState<"prompt" | "checking" | "granted" | "denied">("prompt");

  // Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  const [status, setStatus] = useState<"idle" | "transcribing" | "processing" | "done">("idle");
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [preset, setPreset] = useState("txt");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up Speech Recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qPreset = params.get("preset");
      const qUpload = params.get("upload");
      if (qPreset) {
        setPreset(qPreset as any);
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

  // Handle timer ticks
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Check Mic Permission on mount
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((permissionStatus) => {
        setMicPermission(permissionStatus.state as any);
        permissionStatus.onchange = () => {
          setMicPermission(permissionStatus.state as any);
        };
      }).catch(err => console.log("Permission query unsupported:", err));
    }
  }, []);

  const requestMicPermission = async () => {
    setMicPermission("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicPermission("granted");
      return true;
    } catch {
      setMicPermission("denied");
      return false;
    }
  };

  const startRecording = async () => {
    const isGranted = micPermission === "granted" || await requestMicPermission();
    if (!isGranted) {
      alert("Microphone permission denied. Please allow camera/microphone access in your browser settings.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      setAudioUrl(null);

      // Start speech recognition on-demand
      const SpeechRecognitionClass = 
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: SpeechRecognitionEvent) => {
          if (!isRecordingRef.current) return;
          let finalTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i][0]) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }
          setTranscript(finalTranscript);
        };

        rec.onerror = (err: any) => {
          console.error("Speech Recognition Error:", err);
        };

        rec.onend = () => {
          if (isRecordingRef.current) {
            try { rec.start(); } catch (e) { /* ignore */ }
          }
        };

        recognitionRef.current = rec;
        rec.start();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initialize live microphone stream.");
    }
  };

  const stopRecording = () => {
    isRecordingRef.current = false;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 150 * 1024 * 1024) {
        alert("File exceeds 150MB size limit.");
        return;
      }
      setSelectedFile(file);
      setAudioUrl(URL.createObjectURL(file));
      setTranscript("");
    }
  };

  const removeUploadedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setAudioUrl(null);
    setFileBase64("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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

  const triggerAIProcess = async () => {
    setErrorMsg("");
    let currentTranscript = transcript;

    if (mode === "upload" && !selectedFile) {
      alert("Please select or drop an audio file first.");
      return;
    }
    if (mode === "record" && !transcript.trim()) {
      alert("Please record some audio with spoken words first.");
      return;
    }

    setStatus("processing");
    setOutput("");

    try {
      const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("gemini_api_key") : "";
      const savedOpenaiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : "";
      const savedCohereKey = typeof window !== "undefined" ? localStorage.getItem("cohere_api_key") : "";

      // Stage 1: Transcribe the uploaded file if we don't have a transcript yet
      if (mode === "upload" && !currentTranscript && selectedFile) {
        setTranscript("Transcribing audio file... Please wait.");
        
        const uploadedFileUrl = await uploadFileMultipart(selectedFile, (pct) => {});

        const extractPayload = {
          fileUrl: uploadedFileUrl,
          fileName: selectedFile?.name || "audio_file",
          fileType: selectedFile?.type || "audio/wav",
          format: "OCR Text",
          model: typeof window !== "undefined" ? localStorage.getItem("act_selected_model") || "Gemini Pro" : "Gemini Pro",
          apiKey: savedApiKey || null,
          openaiKey: savedOpenaiKey || null,
          cohereKey: savedCohereKey || null,
        };

        const extractData = await ApiClient.streamTransform(extractPayload, (chunk) => {
          if (chunk.stage) setStage("Extraction: " + chunk.stage);
          if (chunk.progress) setProgress(15 + Math.floor(chunk.progress * 0.4));
        });
        currentTranscript = extractData.output || "";
        setTranscript(currentTranscript);

        if (!currentTranscript.trim()) {
          throw new Error("Transcriber yielded empty content. Please try another audio file.");
        }
      }

      // Stage 2: Transform transcript using targeted prompts
      let targetFormat = presetPrompts[preset] || preset;

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qPrompt = params.get("prompt");
        if (qPrompt) {
          targetFormat = qPrompt;
        }
      }

      const transformPayload = {
        text: currentTranscript,
        format: targetFormat,
        model: typeof window !== "undefined" ? localStorage.getItem("act_selected_model") || "Gemini Pro" : "Gemini Pro",
        apiKey: savedApiKey || null,
        openaiKey: savedOpenaiKey || null,
        cohereKey: savedCohereKey || null,
      };

      const data = await ApiClient.streamTransform(transformPayload, (chunk) => {
        if (chunk.stage) setStage(chunk.stage);
        if (chunk.progress) setProgress(60 + Math.floor(chunk.progress * 0.35));
      });

      setStatus("done");
      setOutput(data.output || "No output generated.");

      // Save to transform history
      saveToHistory({
        file: selectedFile ? selectedFile.name : "Live_Voice_Recording.wav",
        action: `Audio to ${preset.charAt(0).toUpperCase() + preset.slice(1)}`,
        tokens: Math.floor((currentTranscript || "").length / 4) + 120,
      });

    } catch (err: any) {
      console.error(err);
      setStatus("idle");
      setErrorMsg(err.message || "Failed to process audio or transform transcription.");
      if (transcript.startsWith("Transcribing audio file")) {
        setTranscript("");
      }
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
            <Volume2 className="h-6 w-6 text-purple-600" />
            Audio Transform & Transcription
          </h1>
          <p className="text-xs mt-0.5" style={{ color: T.textSecondary }}>
            Transcribe files or record live speech to extract summaries, checklists, or minutes instantly.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode Toggle Switch */}
      <div className="flex gap-1.5 p-1 rounded-xl w-fit border" style={{ backgroundColor: T.bgInput, borderColor: T.border }}>
        <button
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all`}
          style={{
            backgroundColor: mode === "upload" ? T.bgActive : "transparent",
            color: mode === "upload" ? T.textActive : T.textSecondary
          }}
        >
          <Upload className="h-3.5 w-3.5" />
          File Upload
        </button>
        <button
          onClick={() => setMode("record")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all`}
          style={{
            backgroundColor: mode === "record" ? T.bgActive : "transparent",
            color: mode === "record" ? T.textActive : T.textSecondary
          }}
        >
          <Mic className="h-3.5 w-3.5" />
          Live Voice Recorder
        </button>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Left Interactive Control Area */}
        <div className="md:col-span-6 space-y-6">
          <GlassCard className="space-y-6 border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800" style={{ color: T.textPrimary }}>ACT Audio Parameters</h3>
                <p className="text-[10px] text-slate-500" style={{ color: T.textSecondary }}>Specify output layout and voice processor inputs</p>
              </div>
            </div>

            {/* Mode 1: File Upload Workspace */}
            {mode === "upload" ? (
              <div className="space-y-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="audio/*" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleFileChange({ target: { files: [file] } } as any);
                  }}
                  className="p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all hover:border-purple-500/50"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                >
                  <FileAudio className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-bounce" />
                  <span className="text-xs font-semibold block" style={{ color: T.textPrimary }}>
                    {selectedFile ? selectedFile.name : "Drag & drop audio files here or click to load"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block" style={{ color: T.textSecondary }}>
                    Supports WAV, MP3, M4A, WEBM (Max 150MB)
                  </span>
                </div>

                {selectedFile && (
                  <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: T.textPrimary }}>{selectedFile.name}</p>
                      <p className="text-[9px] text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button onClick={removeUploadedFile} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Mode 2: Live Mic Recording Workspace
              <div className="space-y-5">
                <div 
                  className="p-6 rounded-xl border text-center space-y-4"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                >
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    )}
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                        isRecording ? "bg-red-600 text-white" : "bg-purple-600 text-white"
                      }`}
                    >
                      <Mic className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-bold" style={{ color: T.textPrimary }}>
                      {isRecording ? "Recording Live..." : "Voice Recorder Ready"}
                    </p>
                    <p className="text-xs" style={{ color: T.textSecondary }}>
                      Mic Access: {micPermission === "granted" ? "Granted" : micPermission === "denied" ? "Blocked" : "Not Requested"}
                    </p>
                    <p className="text-lg font-mono font-bold" style={{ color: T.textPrimary }}>
                      {formatTime(recordingTime)}
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    {!isRecording ? (
                      <Button onClick={startRecording} className="text-xs px-4 bg-purple-600 hover:bg-purple-700">
                        <Mic className="h-3.5 w-3.5 mr-1.5" />
                        Start Record
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} className="text-xs px-4 bg-red-600 hover:bg-red-700">
                        <Square className="h-3.5 w-3.5 mr-1.5" />
                        Stop Record
                      </Button>
                    )}
                  </div>
                </div>

                {/* Live Speech transcript box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold" style={{ color: T.textSecondary }}>Live speech transcript</label>
                  <div 
                    className="p-3 rounded-xl border text-xs h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed"
                    style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
                  >
                    {transcript || interimTranscript ? (
                      <>
                        {transcript}
                        {interimTranscript && <span className="text-purple-400 italic">{interimTranscript}</span>}
                      </>
                    ) : (
                      <span className="text-slate-400 italic">No spoken words transcribed yet. Speak into the microphone...</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audio playback controls */}
            {audioUrl && (
              <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                <span className="text-[10px] font-bold" style={{ color: T.textPrimary }}>Audio Stream Preview:</span>
                <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
              </div>
            )}

            {/* Transform Target presets */}
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

            <Button onClick={triggerAIProcess} className="w-full text-xs" disabled={status === "processing"}>
              {status === "processing" 
                ? (transcript.startsWith("Transcribing audio file") 
                   ? "Transcribing audio..." 
                   : "Generating output...")
                : "Compile Transcription"}
              <RefreshCw className={`ml-2 h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`} />
            </Button>
          </GlassCard>
        </div>

        {/* Right Output Converted Preview Area */}
        <div className="md:col-span-6 space-y-6">
          <OutputPanel output={output} setOutput={setOutput} T={T} className="h-[520px]" />
        </div>

      </div>
    </div>
  );
}
