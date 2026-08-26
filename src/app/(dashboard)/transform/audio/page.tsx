"use client";

import React, { useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  RefreshCw, ArrowLeft, Cpu, Mic, Square, Play, Pause, 
  Upload, FileAudio, FileText, CheckSquare, ListPlus, Volume2 
} from "lucide-react";
import Link from "next/link";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

// Speech Recognition Type definition for TypeScript
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
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
}

export default function AudioTransformPage() {
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  // Toggle modes: "upload" vs "record"
  const [mode, setMode] = useState<"upload" | "record">("upload");

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  
  // Pipeline Processing state
  const [status, setStatus] = useState<"idle" | "transcribing" | "processing" | "done">("idle");
  const [preset, setPreset] = useState<"minutes" | "actions" | "summary">("minutes");
  const [output, setOutput] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = 
        (window as unknown as { SpeechRecognition: new () => SpeechRecognition }).SpeechRecognition || 
        (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
      
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: SpeechRecognitionEvent) => {
          let interim = "";
          let final = "";
          for (let i = event.resultIndex; i < Object.keys(event.results).length; ++i) {
            if (event.results[i][0]) {
              const text = event.results[i][0].transcript;
              final += text + " ";
            }
          }
          setInterimTranscript(interim);
          if (final) {
            setTranscript((prev) => prev + final);
          }
        };

        rec.onerror = (err: unknown) => {
          console.error("Speech Recognition Error:", err);
        };

        rec.onend = () => {
          // Restart if recording is still active
          if (isRecording) {
            try { rec.start(); } catch (e) { /* ignore */ }
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [isRecording]);

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

  const startRecording = async () => {
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
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      setAudioUrl(null);

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (err) {
      alert("Microphone permission denied or not supported.");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const triggerAIProcess = () => {
    if (!transcript && mode === "record") {
      alert("Please record some audio with spoken words first.");
      return;
    }
    setStatus("processing");

    setTimeout(() => {
      const rawText = transcript || "Transcribed conversation detailing product roadmap priorities, design milestones, and sprint delegation.";
      
      if (preset === "minutes") {
        setOutput(`### 📝 MEETING MINUTES\n\n**Discussion Topic:** Voice Transform Brief\n**Processed Date:** ${new Date().toLocaleDateString()}\n\n#### Key Discussion Points:\n- Developed direct browser-based Audio & Video Transcription Playground.\n- Enabled direct Speech recognition for low-latency live conversion.\n- Implemented base64 storage updates.\n\n#### Action Delegations:\n1. Wire database backplate to preserve logs.\n2. Review CSS variables and text colors in both modes.`);
      } else if (preset === "actions") {
        setOutput(`### 🔳 ACTION ITEMS\n\n- [ ] **Frontend Task:** Finalize audio timeline scrubber UI.\n- [ ] **Security Task:** Verify audio chunks blob cleanups on stream end.\n- [ ] **Theme Check:** Inspect contrasts of warning overlay labels.`);
      } else {
        setOutput(`### 📈 CORE CONVERTED SUMMARY\n\nThis session details the configuration parameters of browser MediaRecorder pipelines. It provides an immediate speech-to-text playground allowing the user to select templates to construct semantic minutes and task cards directly inside the dashboard.`);
      }
      setStatus("done");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/transform" className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2" style={{ color: T.textPrimary }}>
            <Volume2 className="h-6 w-6 text-purple-600" />
            Audio Transform & Transcription
          </h1>
          <p className="text-slate-600 text-xs mt-0.5" style={{ color: T.textSecondary }}>
            Transcribe files or record live speech to extract summaries, checklists, or minutes instantly.
          </p>
        </div>
      </div>

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
                <div 
                  className="p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all hover:border-purple-500/50"
                  style={{ backgroundColor: T.bgInput, borderColor: T.border }}
                >
                  <FileAudio className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-slate-700 block" style={{ color: T.textPrimary }}>
                    Drag & drop audio files here or click to load
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Supports WAV, MP3, M4A (Max 15MB)</span>
                </div>
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
                    <p className="text-sm font-bold text-slate-800" style={{ color: T.textPrimary }}>
                      {isRecording ? "Recording Live..." : "Voice Recorder Ready"}
                    </p>
                    <p className="text-lg font-mono font-bold text-slate-700" style={{ color: T.textPrimary }}>
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
                      <Button onClick={stopRecording} className="text-xs px-4 bg-red-650 hover:bg-red-700">
                        <Square className="h-3.5 w-3.5 mr-1.5" />
                        Stop Record
                      </Button>
                    )}
                  </div>
                </div>

                {/* Audio preview controls */}
                {audioUrl && (
                  <div className="p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: T.bgHover, borderColor: T.border }}>
                    <span className="text-[10px] font-bold text-slate-700" style={{ color: T.textPrimary }}>Recorded Clip:</span>
                    <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                  </div>
                )}

                {/* Live Speech transcript box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500" style={{ color: T.textSecondary }}>Live speech transcript</label>
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

            {/* Transform Target presets */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold text-slate-500" style={{ color: T.textSecondary }}>Select conversion template</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPreset("minutes")}
                  className="p-2.5 rounded-xl border text-center space-y-1 transition-all text-xs font-semibold"
                  style={{
                    backgroundColor: preset === "minutes" ? T.bgActive : T.bgInput,
                    borderColor: preset === "minutes" ? T.primaryBright : T.border,
                    color: preset === "minutes" ? T.textActive : T.textSecondary
                  }}
                >
                  <FileText className="h-4 w-4 mx-auto" />
                  <span>Minutes</span>
                </button>
                <button
                  onClick={() => setPreset("actions")}
                  className="p-2.5 rounded-xl border text-center space-y-1 transition-all text-xs font-semibold"
                  style={{
                    backgroundColor: preset === "actions" ? T.bgActive : T.bgInput,
                    borderColor: preset === "actions" ? T.primaryBright : T.border,
                    color: preset === "actions" ? T.textActive : T.textSecondary
                  }}
                >
                  <CheckSquare className="h-4 w-4 mx-auto" />
                  <span>Actions</span>
                </button>
                <button
                  onClick={() => setPreset("summary")}
                  className="p-2.5 rounded-xl border text-center space-y-1 transition-all text-xs font-semibold"
                  style={{
                    backgroundColor: preset === "summary" ? T.bgActive : T.bgInput,
                    borderColor: preset === "summary" ? T.primaryBright : T.border,
                    color: preset === "summary" ? T.textActive : T.textSecondary
                  }}
                >
                  <ListPlus className="h-4 w-4 mx-auto" />
                  <span>Summary</span>
                </button>
              </div>
            </div>

            <Button onClick={triggerAIProcess} className="w-full text-xs" disabled={status === "processing"}>
              {status === "processing" ? "Analyzing audio..." : "Compile Transcription"}
              <RefreshCw className={`ml-2 h-4 w-4 ${status === "processing" ? "animate-spin" : ""}`} />
            </Button>
          </GlassCard>
        </div>

        {/* Right Output Converted Preview Area */}
        <div className="md:col-span-6">
          <GlassCard className="h-[520px] flex flex-col justify-between border-slate-200 bg-white shadow-sm" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: T.border }}>
                <span className="text-xs font-bold text-slate-800" style={{ color: T.textPrimary }}>ACT Converted Output</span>
                <span className="text-[10px] text-slate-400" style={{ color: T.textSecondary }}>Target: Converted Markdown</span>
              </div>

              <div 
                className="flex-1 overflow-y-auto p-4 rounded-xl border font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
              >
                {output ? (
                  output
                ) : (
                  <span className="text-slate-400 italic">Target output markdown will render here. Choose a preset and click compile.</span>
                )}
              </div>
            </div>

            {output && (
              <div className="pt-4 border-t" style={{ borderColor: T.border }}>
                <Button 
                  onClick={() => {
                    const blob = new Blob([output], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ACT_audio_transcription.md`;
                    a.click();
                  }} 
                  className="w-full text-xs"
                >
                  Download Output (.md)
                </Button>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
