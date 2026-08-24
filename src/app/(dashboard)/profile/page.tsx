"use client";

import React, { useState } from "react";
import {
  User, ShieldCheck, Mail, Building, Briefcase, Award,
  Pencil, Check, X, Calendar, Clock, Tag, Zap
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/contexts/UserContext";
import { UserProfile } from "@/types/user";

// ─── Inline editable field ──────────────────────────────────────────────────
function EditableField({
  label,
  value,
  onSave,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onSave(draft.trim() || value);
    setEditing(false);
  };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="space-y-1">
      <span className="text-slate-500 text-xs font-medium">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
            placeholder={placeholder}
            className="flex-1 px-2 py-1 rounded-lg border border-purple-400 text-slate-800 text-xs focus:outline-none"
          />
          <button onClick={commit} className="p-1 rounded-md bg-purple-600 text-white hover:bg-purple-700">
            <Check className="h-3 w-3" />
          </button>
          <button onClick={cancel} className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200">
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 group">
          <p className="text-slate-800 text-xs font-semibold">{value || <span className="text-slate-400 italic">Not set</span>}</p>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-purple-600 transition-all"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser, getInitials, nameToColor } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-semibold">No session found.</p>
          <p className="text-slate-400 text-xs mt-1">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const initials = getInitials(user.name || user.email);
  const avatarColor = nameToColor(user.name || user.email);

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  };

  const fmtTime = (iso: string) => {
    try { return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <User className="h-6 w-6 text-purple-600" />
          My Profile
        </h1>
        <p className="text-slate-600 text-xs mt-1">
          Hover any field to edit it inline. Changes sync everywhere instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">

        {/* ── Avatar Card ─────────────────────────────────── */}
        <GlassCard className="border-slate-200 bg-white shadow-sm md:col-span-1 text-center space-y-4">
          {/* Avatar */}
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center font-bold text-white text-2xl mx-auto border-4 border-white shadow-xl"
            style={{ background: avatarColor }}
          >
            {initials}
          </div>

          {/* Name (editable inline) */}
          <div>
            <div className="flex items-center justify-center gap-1.5 group">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">{user.name || "—"}</h2>
              <button
                onClick={() => {
                  const newName = window.prompt("Enter new name:", user.name);
                  if (newName && newName.trim()) updateUser({ name: newName.trim() });
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-purple-600 transition-all"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>

          {/* Role badge — from database, not hardcoded */}
          <span
            className="inline-block px-3 py-1 rounded-full font-semibold text-[10px] uppercase shadow-sm"
            style={{
              backgroundColor: user.role === "Admin" || user.role === "Super Admin" ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${user.role === "Admin" || user.role === "Super Admin" ? '#fcd34d' : '#bbf7d0'}`,
              color: user.role === "Admin" || user.role === "Super Admin" ? '#92400e' : '#15803d',
            }}
          >
            {user.role}
          </span>

          {/* Plan badge */}
          <div
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mx-auto w-fit shadow-sm"
            style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}
          >
            <Zap className="h-3.5 w-3.5" />
            ACT {user.plan} Plan
          </div>
        </GlassCard>

        {/* ── Details Column ───────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">

          {/* Personal Information */}
          <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Personal Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-5 text-xs">
              <div className="flex items-start gap-2">
                <Mail className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                <EditableField
                  label="Email Address"
                  value={user.email}
                  type="email"
                  placeholder="you@example.com"
                  onSave={(v) => updateUser({ email: v })}
                />
              </div>

              <div className="flex items-start gap-2">
                <Building className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                <EditableField
                  label="Organization"
                  value={user.organization}
                  placeholder="Your organization"
                  onSave={(v) => updateUser({ organization: v })}
                />
              </div>

              <div className="flex items-start gap-2">
                <Briefcase className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Role</span>
                  <p className="text-slate-800 text-xs font-semibold">{user.role}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Session Verification</span>
                  <p className="text-emerald-600 text-xs font-semibold">Active Session</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Member Since</span>
                  <p className="text-slate-800 text-xs font-semibold">{fmt(user.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-purple-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs font-medium">Last Login</span>
                  <p className="text-slate-800 text-xs font-semibold">{fmtTime(user.lastLogin)}</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="pt-3 border-t border-slate-100">
              <EditableField
                label="Bio"
                value={user.bio}
                placeholder="Write something about yourself..."
                onSave={(v) => updateUser({ bio: v })}
              />
            </div>
          </GlassCard>

          {/* Achievements */}
          <GlassCard className="border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-purple-600" />
              Platform Achievements
            </h3>

            {user.achievements.length === 0 ? (
              <div className="py-8 text-center">
                <Tag className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No achievements yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Start transforming documents to earn your first badge!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {user.achievements.map((a, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 shadow-sm">
                    <p className="text-xs font-bold text-slate-800">{a.title}</p>
                    <p className="text-[10px] text-slate-500">{a.desc}</p>
                    {a.earnedAt && (
                      <p className="text-[10px] text-purple-600 font-medium">
                        Earned {fmt(a.earnedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </div>
      </div>
    </div>
  );
}
