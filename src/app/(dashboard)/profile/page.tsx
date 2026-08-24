"use client";

import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Mail, Building, Briefcase, Award } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ProfilePage() {
  const [name, setName] = useState("John Doe");
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("John Doe");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("user_profile_name") || "John Doe";
      setName(storedName);
      setTempName(storedName);
    }
  }, []);

  const handleSave = () => {
    const finalName = tempName.trim() || "John Doe";
    setName(finalName);
    setTempName(finalName);
    setIsEditing(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("user_profile_name", finalName);
      window.dispatchEvent(new Event("profileUpdate"));
    }
  };

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return "JD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-purple-600" />
          My Profile
        </h1>
        <p className="text-slate-600 text-xs mt-1">Manage credentials, review achievements, and check user usage limits.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* User Card */}
        <GlassCard className="border-slate-200 bg-white shadow-sm md:col-span-1 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-2xl mx-auto border-2 border-purple-500/20 shadow-xl shadow-purple-500/5">
            {getInitials(name)}
          </div>
          <div className="space-y-2">
            {isEditing ? (
              <div className="space-y-2 px-2">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full text-center px-2 py-1.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-purple-500 shadow-sm"
                  placeholder="Enter name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") { setTempName(name); setIsEditing(false); }
                  }}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleSave}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setTempName(name); setIsEditing(false); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                  {name}
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[10px] text-purple-650 hover:text-purple-800 hover:underline font-normal"
                  >
                    (Edit)
                  </button>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Security & Integration Lead</p>
              </div>
            )}
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-semibold text-[10px] uppercase shadow-sm">
            Admin
          </span>
        </GlassCard>

        {/* Metadata Details */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Personal Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Email Address</span>
                <p className="text-slate-800 font-semibold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-purple-600" /> john@company.com</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Organization</span>
                <p className="text-slate-800 font-semibold flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-purple-600" /> Wolverine Inc.</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Role</span>
                <p className="text-slate-800 font-semibold flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-purple-600" /> Security Auditor</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-medium">Session Verification</span>
                <p className="text-emerald-600 font-semibold flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Multi-Factor Active</p>
              </div>
            </div>
          </GlassCard>

          {/* Achievements */}
          <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-purple-600" />
              Platform Achievements
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 shadow-sm">
                <p className="text-xs font-bold text-slate-800">OCR Champion</p>
                <p className="text-[10px] text-slate-500">Processed over 100 scanned files with OCR pipelines.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 shadow-sm">
                <p className="text-xs font-bold text-slate-800">RAG Index Master</p>
                <p className="text-[10px] text-slate-500">Connected 10+ custom vector namespaces for QA chat.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
