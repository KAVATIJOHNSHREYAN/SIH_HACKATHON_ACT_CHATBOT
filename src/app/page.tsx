"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  CheckCircle, 
  Zap, 
  Bot, 
  Database, 
  Languages, 
  ChevronDown, 
  Send,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Layers
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

// Demo transforms list
const DEMO_TRANSFORMS = [
  {
    id: "pdf-summary",
    title: "PDF → Summary",
    input: "Annual_Financial_Report_2026.pdf (48 pages, complex table cells and analytical prose)",
    output: "### Executive Summary\n- **Net revenue:** Increased by 18.4% YoY to $4.2M.\n- **Operating Margin:** Improved by 210bps, driven by automated operational efficiency.\n- **Forecast:** Growth expected to accelerate in Q3 due to new platform integrations."
  },
  {
    id: "text-linkedin",
    title: "Text → LinkedIn",
    input: "We released a new feature. Users can now convert PDFs to blog posts using AI in 5 seconds. It is very fast and easy to use.",
    output: "🚀 Big news! Content transformation just got 10x faster.\n\nToday, we are launching our automated PDF-to-Blog feature powered by **ACT**.\n\n✨ Turn dense documents into engaging content in under 5 seconds.\n\n👉 Try it today: [link]\n\n#GenerativeAI #ProductLaunch #ContentStrategy #AI"
  },
  {
    id: "audio-transcript",
    title: "Audio → Structured Data",
    input: "[Recorded call: 12 mins] 'Okay, so next Tuesday we should launch the billing modal. Sarah needs to send the assets...'",
    output: "{\n  \"meetingDate\": \"2026-08-25\",\n  \"keyTopics\": [\"Billing Modal Launch\", \"Asset Handoff\"],\n  \"actionItems\": [\n    { \"owner\": \"Sarah\", \"task\": \"Send creative assets\", \"due\": \"2026-08-25\" }\n  ]\n}"
  }
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(DEMO_TRANSFORMS[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is ACT?",
      a: "ACT (AI Content Transformation Assistant) is an enterprise-grade AI system integrated throughout our platform that transforms code, text, audio, and documents into summaries, structured JSON, templates, and multiple output formats."
    },
    {
      q: "Which models power ACT?",
      a: "ACT leverages a hybrid model switcher incorporating Google Gemini, OpenAI GPT, Anthropic Claude, and Mistral, selecting the optimal LLM dynamically based on the transformation task."
    },
    {
      q: "Is my data secure?",
      a: "Absolutely. All documents are processed inside sandbox storage, adhering to enterprise SOC2 guidelines. We do not use your proprietary documents to train base AI models."
    },
    {
      q: "Can I try it for free?",
      a: "Yes, our starter tier is free to try with up to 50 complimentary credits to explore all transformation features."
    }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20">
              <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              ACT
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2">
              Login
            </Link>
            <Link href="/auth/register">
              <Button size="sm">
                Get Started
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs font-semibold text-purple-300 mb-6 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Bot className="h-3.5 w-3.5" />
              Meet ACT — Your Intelligent Transformation Partner
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-5xl mx-auto leading-[1.1]">
              Automate Content Transformation with{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Generative AI
              </span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
              Upload documents, audio files, code, or raw data. ACT automatically chunks, embeds, reads, and transforms them into reports, summaries, templates, and high-fidelity structured outputs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Start Free Trial
                </Button>
              </Link>
              <a href="#showcase" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  See Transformation Demo
                </Button>
              </a>
            </div>

            {/* Glowing Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[90px] pointer-events-none -z-10" />
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" className="py-20 border-t border-white/5 relative bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Enterprise Features Built for Scale
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                No templates or rigid parser layouts needed. ACT processes and transforms files semantically with cognitive understanding.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <GlassCard>
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Multi-Model Framework</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Leverage Google Gemini, OpenAI Claude, and Mistral side-by-side. ACT switches models automatically to guarantee speed and cost-effectiveness.
                </p>
              </GlassCard>

              <GlassCard>
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                  <Database className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Automated Pinecone RAG</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every uploaded file is parsed, chunked, and embedded into a dedicated vector space for interactive citation-backed QA queries.
                </p>
              </GlassCard>

              <GlassCard>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Comprehensive OCR</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Transform scanned PDFs, diagrams, and low-res screenshots into clean, structured markdown, reports, or legal simplifications.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Interactive Transformation Showcase */}
        <section id="showcase" className="py-20 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Watch ACT Transform in Real Time
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Select a configuration below to preview ACT's transformation capabilities.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
                {DEMO_TRANSFORMS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => setActiveDemo(demo)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                      activeDemo.id === demo.id
                        ? "bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-500/5"
                        : "bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-900/80 hover:text-white"
                    }`}
                  >
                    <span className="font-semibold text-sm">{demo.title}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ))}
              </div>

              <div className="lg:col-span-8">
                <GlassCard className="h-full flex flex-col p-0 overflow-hidden border-white/10">
                  <div className="border-b border-white/10 px-6 py-4 bg-slate-950/80 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Transformation Environment
                    </span>
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 flex-1 min-h-[300px]">
                    <div className="p-6 bg-slate-950/20">
                      <div className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">
                        Input Content
                      </div>
                      <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {activeDemo.input}
                      </pre>
                    </div>

                    <div className="p-6 bg-slate-950/40">
                      <div className="text-xs font-semibold text-cyan-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-cyan-400" />
                        ACT Output Preview
                      </div>
                      <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                        {activeDemo.output}
                      </pre>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </section>

        {/* Supported formats */}
        <section className="py-20 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">Supported Formats</h2>
              <p className="text-slate-400 text-sm">Flexible input to output mapping across any medium.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {["PDF", "DOCX", "CSV", "PPTX", "Markdown", "HTML", "TXT", "JSON", "Audio MP3", "Scanned JPG", "Email templates", "Flashcards", "MCQs", "Legal documents", "Academic papers"].map((fmt) => (
                <span key={fmt} className="px-4 py-2 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 font-medium">
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 border-t border-white/5 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">How ACT Simplifies Operations</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Transform assets into pipeline resources in three quick configurations.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-6">
                  <span className="text-lg font-bold">1</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Upload Your Source</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Drag and drop a PDF file, paste code snippets, upload audio briefings, or link remote databases.
                </p>
              </div>

              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto mb-6">
                  <span className="text-lg font-bold">2</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select Target Format</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Choose from Summaries, FAQs, structured JSON schema, translated blocks, or study flashcards.
                </p>
              </div>

              <div className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-6">
                  <span className="text-lg font-bold">3</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Verify & Export</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Review the transformation pipeline outputs, chat directly with the context, and download or export.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Placeholders */}
        <section id="pricing" className="py-20 border-t border-white/5 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Flexible Pricing for Any Scale</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Simple usage-based credit tiers built for independent creators up to enterprise workflows.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
              <GlassCard className="flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2">Starter</h3>
                <p className="text-slate-400 text-xs mb-6">Perfect for testing ACT features.</p>
                <div className="text-3xl font-bold text-white mb-6">
                  $0 <span className="text-sm font-normal text-slate-400">/ forever</span>
                </div>
                <ul className="text-sm text-slate-300 space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> 50 transformation credits</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> 10MB max file size</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Standard AI Model Access</li>
                </ul>
                <Link href="/auth/register" className="w-full">
                  <Button variant="outline" className="w-full">Try for Free</Button>
                </Link>
              </GlassCard>

              <GlassCard className="flex flex-col border-purple-500/40 bg-purple-950/10 shadow-[0_0_30px_rgba(139,92,246,0.15)] relative">
                <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider">
                  Popular
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Pro</h3>
                <p className="text-slate-400 text-xs mb-6">For power users and professionals.</p>
                <div className="text-3xl font-bold text-white mb-6">
                  $29 <span className="text-sm font-normal text-slate-400">/ mo</span>
                </div>
                <ul className="text-sm text-slate-300 space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> 1,500 transformation credits</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> 100MB max file size</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Access to Gemini Pro & GPT-4o</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Pinecone Vector Storage RAG</li>
                </ul>
                <Link href="/auth/register" className="w-full">
                  <Button className="w-full">Subscribe Now</Button>
                </Link>
              </GlassCard>

              <GlassCard className="flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2">Enterprise</h3>
                <p className="text-slate-400 text-xs mb-6">For large teams and companies.</p>
                <div className="text-3xl font-bold text-white mb-6">
                  Custom
                </div>
                <ul className="text-sm text-slate-300 space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Unlimited volume</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Custom model fine-tuning</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> Dedicated Pinecone indices</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-purple-400" /> SSO & Audit Logs</li>
                </ul>
                <Link href="/auth/register" className="w-full">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* FAQ Accordions */}
        <section id="faq" className="py-20 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-sm">Have any queries? We have compiled common questions here.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <GlassCard
                  key={idx}
                  className="p-5 cursor-pointer border-white/5 hover:border-purple-500/20"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <div className="flex justify-between items-center text-white">
                    <span className="font-semibold text-base flex items-center gap-2.5">
                      <HelpCircle className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </div>
                  {openFaq === idx && (
                    <p className="mt-3 text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </p>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 border-t border-white/5 relative">
          <div className="max-w-xl mx-auto px-6">
            <GlassCard className="p-8">
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Contact ACT Support</h2>
              <p className="text-slate-400 text-sm text-center mb-6">Need tailored enterprise setup or assistance? Drop us a message.</p>
              
              <form onSubmit={(e) => { e.preventDefault(); alert("Message sent successfully!"); }} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can our transformation engine help your pipeline?"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </GlassCard>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg overflow-hidden">
              <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
            </div>
            <span className="font-bold text-white">ACT Platform</span>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ACT Inc. All rights reserved. Powered by ACT AI.
          </p>

          <div className="flex gap-6 text-xs text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
