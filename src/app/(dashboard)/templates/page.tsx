"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkles, FileText, Zap, BookOpen, HeartPulse, Scale, Code, 
  Megaphone, Folder, Search, Star, History, Video, Music, 
  ArrowRight, Briefcase, GraduationCap 
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";

interface QuickAction {
  id: string;
  category: "Documents" | "Images" | "Audio" | "Video" | "Code" | "Business" | "Education" | "Healthcare" | "Marketing";
  title: string;
  desc: string;
  time: string;
  types: string;
  target: string;
  preset: string;
  prompt: string;
  icon: any;
}

const QUICK_ACTIONS: QuickAction[] = [
  // DOCUMENTS
  {
    id: "doc_exec_summary",
    category: "Documents",
    title: "PDF → Executive Summary",
    desc: "Extract details and generate an executive summary report from PDFs or documents.",
    time: "15s",
    types: "PDF, DOCX, TXT, PPT",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Generate a detailed executive summary focusing on key objectives, SLA details, dates, and conclusions.",
    icon: FileText
  },
  {
    id: "doc_study_notes",
    category: "Documents",
    title: "PDF → Study Notes",
    desc: "Converts text files into structured academic review study notes.",
    time: "15s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Transform this text into clean, structured lecture/study notes with headings, summaries, and bullet points.",
    icon: BookOpen
  },
  {
    id: "doc_flashcards",
    category: "Documents",
    title: "PDF → Flashcards",
    desc: "Generate question and answer memory flashcards from reference materials.",
    time: "20s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Generate a list of 10 key Q&A flashcards for studying this material. Format clearly as Question: and Answer:.",
    icon: Sparkles
  },
  {
    id: "doc_faq",
    category: "Documents",
    title: "PDF → FAQ Generator",
    desc: "Extract common questions and formulate detailed answers.",
    time: "15s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Analyze the text and generate a comprehensive Frequently Asked Questions (FAQ) document.",
    icon: FileText
  },
  {
    id: "doc_markdown",
    category: "Documents",
    title: "PDF → Markdown",
    desc: "Convert documents into clean, semantic Markdown layouts.",
    time: "10s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "markdown",
    prompt: "Format this document's text into clean and semantic Markdown representation.",
    icon: Code
  },
  {
    id: "doc_plain",
    category: "Documents",
    title: "PDF → Plain Text",
    desc: "Extract readable text from standard or scanned PDF documents.",
    time: "10s",
    types: "PDF",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Clean up and output standard readable plain text from this document.",
    icon: FileText
  },
  {
    id: "doc_compare",
    category: "Documents",
    title: "Document Comparison",
    desc: "Upload files to inspect changes, differences, and missing sections.",
    time: "20s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Perform a document comparison analysis. Highlight differences, changes, and missing sections between the segments.",
    icon: Scale
  },

  // IMAGES
  {
    id: "img_ocr",
    category: "Images",
    title: "Image OCR",
    desc: "Extract visible text from images while preserving formatting.",
    time: "5s",
    types: "PNG, JPG, JPEG, WEBP",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "Extract all visible text preserving formatting.",
    icon: FileText
  },
  {
    id: "img_caption",
    category: "Images",
    title: "Image Caption",
    desc: "Generate a short, concise description and alt caption for an image.",
    time: "5s",
    types: "PNG, JPG, JPEG",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "Generate a short, descriptive alt caption for this image.",
    icon: Sparkles
  },
  {
    id: "img_desc",
    category: "Images",
    title: "Image Description",
    desc: "Get a detailed semantic description of image contents.",
    time: "8s",
    types: "PNG, JPG, JPEG",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "Provide a detailed semantic description of all objects, text, and scenes visible in this image.",
    icon: Sparkles
  },
  {
    id: "img_md",
    category: "Images",
    title: "Image to Markdown",
    desc: "Convert visual chart or layout information into structured markdown.",
    time: "8s",
    types: "PNG, JPG, JPEG",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "Translate the visual layout, charts, or diagrams in this image into semantic Markdown code.",
    icon: Code
  },
  {
    id: "img_trans",
    category: "Images",
    title: "Image Translation",
    desc: "OCR visual text and automatically translate it to English.",
    time: "8s",
    types: "PNG, JPG, JPEG",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "Detect and extract all foreign text from this image and translate it into clean English.",
    icon: Megaphone
  },

  // AUDIO
  {
    id: "aud_transcript",
    category: "Audio",
    title: "Audio Transcript",
    desc: "Run speech recognition to extract speech to text dialogue.",
    time: "15s",
    types: "MP3, WAV, M4A",
    target: "/transform/audio",
    preset: "transcript",
    prompt: "Provide a clean chronological dialogue transcript from this audio recording.",
    icon: Music
  },
  {
    id: "aud_minutes",
    category: "Audio",
    title: "Meeting Minutes",
    desc: "Convert discussions into formatted meeting minutes.",
    time: "15s",
    types: "MP3, WAV, M4A",
    target: "/transform/audio",
    preset: "minutes",
    prompt: "Summarize this meeting audio into structured meeting minutes including participants, discussions, and items.",
    icon: FileText
  },
  {
    id: "aud_podcast",
    category: "Audio",
    title: "Podcast Summary",
    desc: "Draft a summary podcast highlight report from audio streams.",
    time: "15s",
    types: "MP3, WAV",
    target: "/transform/audio",
    preset: "summary",
    prompt: "Generate a concise summary of the podcast episode highlighting key themes discussed.",
    icon: Sparkles
  },
  {
    id: "aud_notes",
    category: "Audio",
    title: "Lecture Notes",
    desc: "Generate lecture outlines directly from recordings.",
    time: "15s",
    types: "MP3, WAV",
    target: "/transform/audio",
    preset: "notes",
    prompt: "Transcribe and reorganize this academic lecture audio into clean study notes.",
    icon: BookOpen
  },
  {
    id: "aud_actions",
    category: "Audio",
    title: "Action Items",
    desc: "Extract tasks and key deliverables from meeting transcripts.",
    time: "10s",
    types: "MP3, WAV",
    target: "/transform/audio",
    preset: "actions",
    prompt: "Extract action items, deliverables, and deadlines from this meeting audio.",
    icon: Zap
  },

  // VIDEO
  {
    id: "vid_transcript",
    category: "Video",
    title: "Video Transcript",
    desc: "Extract audio and perform dialogue speech recognition.",
    time: "20s",
    types: "MP4, MOV, AVI, WEBM",
    target: "/transform/video",
    preset: "plain",
    prompt: "Transcribe all spoken dialogue sequentially with timestamp tags.",
    icon: Video
  },
  {
    id: "vid_summary",
    category: "Video",
    title: "Video Summary",
    desc: "Summarize visual and audio events into a concise report.",
    time: "20s",
    types: "MP4, MOV, AVI, WEBM",
    target: "/transform/video",
    preset: "summary",
    prompt: "Generate a concise professional summary of this uploaded video including key events, important discussions and conclusions.",
    icon: Sparkles
  },
  {
    id: "vid_notes",
    category: "Video",
    title: "Lecture Notes",
    desc: "Convert lecture video frames and audio into structured slides/notes.",
    time: "25s",
    types: "MP4, MOV, AVI",
    target: "/transform/video",
    preset: "notes",
    prompt: "Generate structured lecture study notes from this classroom video combining transcripts and slide slides.",
    icon: BookOpen
  },
  {
    id: "vid_minutes",
    category: "Video",
    title: "Meeting Minutes",
    desc: "Compile video conference streams into minutes of meeting.",
    time: "20s",
    types: "MP4, MOV, AVI",
    target: "/transform/video",
    preset: "minutes",
    prompt: "Convert the video stream into meeting minutes focusing on dialogue, agendas, and outcomes.",
    icon: FileText
  },
  {
    id: "vid_timeline",
    category: "Video",
    title: "Timeline",
    desc: "Create chronological summaries linked with timestamp tags.",
    time: "20s",
    types: "MP4, MOV, WEBM",
    target: "/transform/video",
    preset: "timeline",
    prompt: "Create a chronological timeline list of events with exact timestamp coordinates.",
    icon: History
  },
  {
    id: "vid_ocr",
    category: "Video",
    title: "OCR Frames",
    desc: "Extract text from presentation slides or screens inside videos.",
    time: "20s",
    types: "MP4, MOV",
    target: "/transform/video",
    preset: "highlights",
    prompt: "Run high-resolution screen OCR on extracted frames to extract all presentation slide text.",
    icon: Code
  },
  {
    id: "vid_actions",
    category: "Video",
    title: "Action Items",
    desc: "Find deadlines and tasks discussed in recorded sprint logs.",
    time: "20s",
    types: "MP4, MOV",
    target: "/transform/video",
    preset: "actions",
    prompt: "Extract action items, assignees, deadlines, and deliverables from this video track.",
    icon: Zap
  },

  // CODE
  {
    id: "code_explain",
    category: "Code",
    title: "Explain Code",
    desc: "Perform a comprehensive source code analysis and walkthrough.",
    time: "10s",
    types: "JS, TS, PY, JAVA, CPP, GO, RS",
    target: "/transform/code",
    preset: "explain",
    prompt: "Perform a code walkthrough. Explain the classes, functions, design patterns, and complexity.",
    icon: Code
  },
  {
    id: "code_docs",
    category: "Code",
    title: "Generate API Docs",
    desc: "Generate complete API specifications and return schemas.",
    time: "12s",
    types: "JS, TS, PY, GO",
    target: "/transform/code",
    preset: "docs",
    prompt: "Generate comprehensive API documentation including parameter lists, request formats, and response schemas.",
    icon: FileText
  },
  {
    id: "code_tests",
    category: "Code",
    title: "Generate Unit Tests",
    desc: "Create robust Jest, PyTest, or JUnit unit test cases automatically.",
    time: "15s",
    types: "JS, TS, PY, JAVA",
    target: "/transform/code",
    preset: "tests",
    prompt: "Analyze the functions and generate robust unit tests with edge case assertions.",
    icon: Zap
  },
  {
    id: "code_optimize",
    category: "Code",
    title: "Optimize Code",
    desc: "Suggest performance enhancements and reduce algorithmic complexity.",
    time: "10s",
    types: "JS, TS, PY, CPP",
    target: "/transform/code",
    preset: "optimize",
    prompt: "Refactor this code to optimize runtime performance, memory usage, and structural readability.",
    icon: Sparkles
  },
  {
    id: "code_bugs",
    category: "Code",
    title: "Detect Bugs",
    desc: "Locate memory leaks, syntax warnings, and logical vulnerabilities.",
    time: "10s",
    types: "JS, TS, PY, JAVA, CPP",
    target: "/transform/code",
    preset: "bugs",
    prompt: "Perform code security and static analysis to detect bugs, memory leaks, or race conditions.",
    icon: Scale
  },
  {
    id: "code_flowchart",
    category: "Code",
    title: "Flowchart Generator",
    desc: "Generate flowchart explanations mapping logic steps.",
    time: "12s",
    types: "JS, TS, PY",
    target: "/transform/code",
    preset: "flowchart",
    prompt: "Explain the program flow step-by-step and write a flowchart blueprint matching the logical blocks.",
    icon: History
  },

  // BUSINESS
  {
    id: "biz_exec_report",
    category: "Business",
    title: "Executive Report",
    desc: "Transform business decks into action metrics reports.",
    time: "15s",
    types: "PDF, DOCX, PPTX",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Create a formal Executive Report summarizing organizational performance, goals, and strategic action plans.",
    icon: Briefcase
  },
  {
    id: "biz_sales",
    category: "Business",
    title: "Sales Dashboard Insights",
    desc: "Analyze spreadsheets and financial trends.",
    time: "15s",
    types: "CSV, XLSX, PDF",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Perform a sales data analysis. Highlight key volume drivers, customer growth trends, and conversion bottlenecks.",
    icon: Briefcase
  },
  {
    id: "biz_finance",
    category: "Business",
    title: "Financial Summary",
    desc: "Summarize balance sheets and statements.",
    time: "15s",
    types: "PDF, XLSX",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Extract financial metrics, cash flow trends, liabilities, and profitability calculations into a structured summary.",
    icon: Scale
  },
  {
    id: "biz_ats",
    category: "Business",
    title: "Resume ATS Optimizer",
    desc: "Review and rewrite resumes to rank higher in ATS screeners.",
    time: "10s",
    types: "PDF, DOCX",
    target: "/transform/pdf",
    preset: "actions",
    prompt: "Critique this resume based on industry ATS keywords, structure, and formatting. Suggest specific edits to improve match scores.",
    icon: Briefcase
  },
  {
    id: "biz_email",
    category: "Business",
    title: "Email Generator",
    desc: "Draft formal professional outreach emails from summaries.",
    time: "8s",
    types: "TXT, PDF",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Draft professional, clear outreach emails matching the key objectives described in the text.",
    icon: Megaphone
  },

  // EDUCATION
  {
    id: "edu_notes",
    category: "Education",
    title: "Study Notes",
    desc: "Converts text files into structured academic review study notes.",
    time: "15s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Generate comprehensive structured study notes from this educational material.",
    icon: GraduationCap
  },
  {
    id: "edu_flashcards",
    category: "Education",
    title: "Flashcards",
    desc: "Generate question and answer memory flashcards from reference materials.",
    time: "15s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Create a list of 10 key Q&A flashcards for exam review from these documents.",
    icon: Sparkles
  },
  {
    id: "edu_quiz",
    category: "Education",
    title: "Quiz Generator",
    desc: "Generate multiple-choice quiz questions with answer keys.",
    time: "15s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "notes",
    prompt: "Create a 5-question multiple choice (MCQ) quiz based on this text, complete with correct answers and explanations.",
    icon: GraduationCap
  },
  {
    id: "edu_summary",
    category: "Education",
    title: "Assignment Summary",
    desc: "Summarize coursework and project task specs.",
    time: "10s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Summarize assignment details, formatting constraints, rubrics, and deadlines into a checklist.",
    icon: FileText
  },
  {
    id: "edu_research",
    category: "Education",
    title: "Research Paper Summary",
    desc: "Generate structured abstracts from research papers.",
    time: "15s",
    types: "PDF",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Generate a structured review summary of this research paper focusing on methodology, outcomes, and research limitations.",
    icon: BookOpen
  },

  // HEALTHCARE
  {
    id: "health_record",
    category: "Healthcare",
    title: "Medical Record Summary",
    desc: "Summarize patient histories and chart data.",
    time: "15s",
    types: "PDF, DOCX",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Summarize patient clinical logs, medical histories, diagnoses, and lab results into a highly structured clinical summary.",
    icon: HeartPulse
  },
  {
    id: "health_prescription",
    category: "Healthcare",
    title: "Prescription OCR",
    desc: "Perform OCR on prescriptions and compile dosage tables.",
    time: "8s",
    types: "PNG, JPG, PDF",
    target: "/transform/ocr",
    preset: "ocr",
    prompt: "OCR this prescription. Output a clean table containing the medicine name, dosage, frequency, and duration.",
    icon: Code
  },
  {
    id: "health_timeline",
    category: "Healthcare",
    title: "Clinical Timeline",
    desc: "Build timestamped clinical summaries of patient logs.",
    time: "15s",
    types: "PDF, DOCX",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Create a chronological clinical timeline of patient diagnoses, symptoms, prescriptions, and consult logs.",
    icon: History
  },
  {
    id: "health_simplifier",
    category: "Healthcare",
    title: "Patient Report Simplifier",
    desc: "Translate complex diagnostic jargon into patient-friendly language.",
    time: "12s",
    types: "PDF, DOCX",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Translate this medical test/diagnostic report into plain English, explaining all medical jargon and key metrics in simple terms.",
    icon: HeartPulse
  },

  // MARKETING
  {
    id: "mkt_social",
    category: "Marketing",
    title: "Press Release → Social Posts",
    desc: "Turn corporate releases into engagement social copy.",
    time: "8s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Reorganize this press release into 3 social media announcements for LinkedIn, Facebook, and Instagram.",
    icon: Megaphone
  },
  {
    id: "mkt_linkedin",
    category: "Marketing",
    title: "Blog → LinkedIn",
    desc: "Summarize articles into high-converting professional posts.",
    time: "8s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Create a high-converting, professional LinkedIn post summarizing the key lessons from this blog post.",
    icon: Briefcase
  },
  {
    id: "mkt_twitter",
    category: "Marketing",
    title: "Blog → Twitter Thread",
    desc: "Compress articles into styled, cohesive Twitter threads.",
    time: "8s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Format this blog post into a cohesive, hook-driven Twitter thread (5-8 tweets) with numbered bullet structures.",
    icon: Megaphone
  },
  {
    id: "mkt_ad",
    category: "Marketing",
    title: "Ad Copy Generator",
    desc: "Generate ad headlines and descriptions matching products.",
    time: "8s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "plain",
    prompt: "Draft 3 Google Search Ads headlines and descriptions and 2 Facebook Ad copy sets from this product overview.",
    icon: Megaphone
  },
  {
    id: "mkt_seo",
    category: "Marketing",
    title: "SEO Summary",
    desc: "Draft meta descriptions and headings from blog outlines.",
    time: "8s",
    types: "PDF, DOCX, TXT",
    target: "/transform/pdf",
    preset: "summary",
    prompt: "Generate an SEO optimization report: recommend title tags, meta descriptions, primary headings, and secondary keywords.",
    icon: Search
  }
];

const CATEGORIES = [
  "All", "Documents", "Images", "Audio", "Video", "Code", "Business", "Education", "Healthcare", "Marketing"
] as const;

type Category = typeof CATEGORIES[number];

export default function QuickActionsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentActions, setRecentActions] = useState<string[]>([]);

  // Load favorites & recents on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedFavs = localStorage.getItem("act_favorite_quick_actions");
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
      const storedRecents = localStorage.getItem("act_recent_quick_actions");
      if (storedRecents) {
        setRecentActions(JSON.parse(storedRecents));
      }
    }
  }, []);

  const toggleFavorite = (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(actionId)
      ? favorites.filter(id => id !== actionId)
      : [...favorites, actionId];
    setFavorites(updated);
    localStorage.setItem("act_favorite_quick_actions", JSON.stringify(updated));
  };

  const launchAction = (action: QuickAction) => {
    // 1. Save to recent actions (max 3 unique)
    const filteredRecents = recentActions.filter(id => id !== action.id);
    const updatedRecents = [action.id, ...filteredRecents].slice(0, 3);
    setRecentActions(updatedRecents);
    localStorage.setItem("act_recent_quick_actions", JSON.stringify(updatedRecents));

    // 2. Preconfigure variables and navigate
    const encodedPrompt = encodeURIComponent(action.prompt);
    const destinationUrl = `${action.target}?preset=${action.preset}&prompt=${encodedPrompt}&upload=true`;
    router.push(destinationUrl);
  };

  // Filter actions
  const matchedActions = QUICK_ACTIONS.filter(action => {
    const matchesSearch = action.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          action.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || action.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Split into favorites and normal matched
  const favoriteActions = matchedActions.filter(a => favorites.includes(a.id));
  const otherMatchedActions = matchedActions.filter(a => !favorites.includes(a.id));

  // Get recently used action objects
  const recentActionObjects = QUICK_ACTIONS.filter(a => recentActions.includes(a.id))
    .sort((a, b) => recentActions.indexOf(a.id) - recentActions.indexOf(b.id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: T.textPrimary }}>Quick Actions</h1>
          <p className="text-xs mt-1" style={{ color: T.textSecondary }}>
            One-click AI workflows for every content type. Choose an action and upload your content.
          </p>
        </div>

        {/* Action search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quick actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-none border shadow-inner"
            style={{ backgroundColor: T.bgInput, borderColor: T.border, color: T.textPrimary }}
          />
        </div>
      </div>

      {/* Recent Actions Section */}
      {recentActionObjects.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <History className="h-4 w-4 text-purple-500" />
            <span>Recently Used</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentActionObjects.map(action => (
              <div
                key={action.id}
                onClick={() => launchAction(action)}
                className="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer hover:border-purple-500/30 hover:scale-[1.01] transition-all bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm"
                style={{ borderColor: T.border }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-400 shrink-0">
                    <action.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{action.title}</h4>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">{action.category}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category selector row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
              activeCategory === cat
                ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-800"
            }`}
            style={activeCategory === cat ? { backgroundColor: T.bgActive, borderColor: T.primaryMuted, color: T.textActive } : {}}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid of Quick Actions */}
      <div className="space-y-6">
        
        {/* Favorites Sub-section */}
        {favoriteActions.length > 0 && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span>Starred Workflows</span>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {favoriteActions.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  isStarred={true}
                  onToggleStar={(e) => toggleFavorite(action.id, e)} 
                  onLaunch={() => launchAction(action)}
                  T={T} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Standard Actions Sub-section */}
        <div className="space-y-3.5">
          {favoriteActions.length > 0 && (
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>All Available Workflows</span>
            </div>
          )}
          
          {matchedActions.length === 0 ? (
            <div className="p-12 text-center border rounded-2xl" style={{ borderColor: T.border }}>
              <p className="text-xs text-slate-400 italic">No quick actions match your category or search query.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {otherMatchedActions.map(action => (
                <ActionCard 
                  key={action.id} 
                  action={action} 
                  isStarred={false}
                  onToggleStar={(e) => toggleFavorite(action.id, e)} 
                  onLaunch={() => launchAction(action)}
                  T={T} 
                />
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// Sub-card element to keep code clean and animate on hover
interface ActionCardProps {
  action: QuickAction;
  isStarred: boolean;
  onToggleStar: (e: React.MouseEvent) => void;
  onLaunch: () => void;
  T: any;
}
function ActionCard({ action, isStarred, onToggleStar, onLaunch, T }: ActionCardProps) {
  return (
    <GlassCard 
      onClick={onLaunch}
      className="border-slate-200 bg-white shadow-sm flex flex-col justify-between h-60 hover:shadow-md hover:scale-[1.01] hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
      style={{ backgroundColor: T.bgCard, borderColor: T.border }}
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[9px] uppercase tracking-wider font-bold">
            {action.category}
          </span>
          <div className="flex items-center gap-2">
            {/* Star Icon */}
            <button 
              onClick={onToggleStar}
              className="p-1 rounded-lg hover:bg-slate-500/10 transition-colors"
            >
              <Star className={`h-4 w-4 ${isStarred ? "text-yellow-500 fill-yellow-500" : "text-slate-400"}`} />
            </button>
            <action.icon className="h-5 w-5 text-purple-500" />
          </div>
        </div>
        <h3 className="text-sm font-bold mb-1.5" style={{ color: T.textPrimary }}>{action.title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3 mb-2">{action.desc}</p>
      </div>

      <div className="space-y-3 pt-2 border-t" style={{ borderColor: T.border }}>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Supported: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{action.types}</strong></span>
          <span>Time: <strong className="text-purple-500 font-semibold">{action.time}</strong></span>
        </div>
        <Button 
          onClick={(e) => { e.stopPropagation(); onLaunch(); }} 
          variant="outline" 
          size="sm" 
          className="w-full text-[10px] py-1.5 shadow-sm rounded-xl"
        >
          Launch Action
          <Zap className="ml-1.5 h-3.5 w-3.5 fill-purple-500 text-purple-500" />
        </Button>
      </div>
    </GlassCard>
  );
}
