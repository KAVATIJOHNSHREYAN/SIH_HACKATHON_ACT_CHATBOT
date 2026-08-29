"use client";

import React, { useState } from "react";
import { Settings, Shield, KeyRound, Bell, CreditCard, User } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [pineconeKey, setPineconeKey] = useState("");
  const [cohereKey, setCohereKey] = useState("");

  React.useEffect(() => {
    const fetchEnvKeys = async () => {
      try {
        const res = await fetch("/api/keys");
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP error ${res.status}`);
        }
        if (!contentType?.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but received: ${text}`);
        }
        const data = await res.json();
        
        if (typeof window !== "undefined") {
          const gemini = localStorage.getItem("gemini_api_key") || data.geminiKey || "";
          const openai = localStorage.getItem("openai_api_key") || data.openaiKey || "";
          const pinecone = localStorage.getItem("pinecone_api_key") || data.pineconeKey || "";
          const cohere = localStorage.getItem("cohere_api_key") || data.cohereKey || "";
          
          setGeminiKey(gemini);
          setOpenaiKey(openai);
          setPineconeKey(pinecone);
          setCohereKey(cohere);

          localStorage.setItem("gemini_api_key", gemini);
          localStorage.setItem("openai_api_key", openai);
          localStorage.setItem("pinecone_api_key", pinecone);
          localStorage.setItem("cohere_api_key", cohere);
        }
      } catch (err) {
        console.error("Failed to load environment default keys:", err);
      }
    };
    fetchEnvKeys();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", geminiKey);
      localStorage.setItem("openai_api_key", openaiKey);
      localStorage.setItem("pinecone_api_key", pineconeKey);
      localStorage.setItem("cohere_api_key", cohereKey);
    }
    alert("Settings updated successfully!");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-purple-600" />
          Settings Panel
        </h1>
        <p className="text-slate-600 text-xs mt-1">Configure credentials, notification triggers, and active workspaces.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Credentials */}
        <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <KeyRound className="h-4.5 w-4.5 text-purple-600" />
            API Keys Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter Gemini API Token"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">OpenAI API Key (Optional)</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="Enter OpenAI API Token"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Cohere API Key (Optional)</label>
              <input
                type="password"
                value={cohereKey}
                onChange={(e) => setCohereKey(e.target.value)}
                placeholder="Enter Cohere API Token"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Pinecone API Key (Optional)</label>
              <input
                type="password"
                value={pineconeKey}
                onChange={(e) => setPineconeKey(e.target.value)}
                placeholder="Enter Pinecone API Token"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>
          </div>
        </GlassCard>

        {/* Notifications & Toggles */}
        <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Bell className="h-4.5 w-4.5 text-cyan-600" />
            Notification Settings
          </h2>

          <div className="space-y-3">
            {[
              { title: "Transformation Completed", desc: "Notify via dashboard alerts when pipeline finishes." },
              { title: "Email Weekly Summaries", desc: "Send analytics digest report weekly to user inbox." },
              { title: "Quota Alerts", desc: "Warn when credits fall below 15%." },
            ].map((item, idx) => (
              <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 rounded border-slate-200 bg-white text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800 group-hover:text-purple-600 transition-colors">{item.title}</p>
                  <p className="text-[10px] text-slate-500">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </GlassCard>

        {/* Billing Placeholders */}
        <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <CreditCard className="h-4.5 w-4.5 text-emerald-600" />
            Subscription & Billing
          </h2>
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150 shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-800">Pro Plan Subscription</p>
              <p className="text-[10px] text-slate-500">Renews automatically on Sep 23, 2026</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-semibold text-[10px] uppercase shadow-sm">
              Active
            </span>
          </div>
        </GlassCard>

        <Button type="submit" className="shadow-md">Save Configurations</Button>
      </form>
    </div>
  );
}
