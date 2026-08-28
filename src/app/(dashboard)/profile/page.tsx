"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User, ShieldCheck, Mail, Building, Briefcase, Award, Pencil, Check, X, 
  Calendar, Clock, Tag, Zap, Camera, Trash2, Shield, Info, Database, Eye, 
  RefreshCcw, Share2, MoreVertical, HardDrive, Phone, MapPin, Globe, Link2, 
  Key, LogOut, CheckCircle, Smartphone, Sliders, Bell
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

interface Achievement {
  id: string;
  title: string;
  desc: string;
  progress: number;
  earned: boolean;
  icon: string;
}

interface UserProfile {
  fullName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  organization: string;
  department: string;
  designation: string;
  country: string;
  timezone: string;
  language: string;
  bio: string;
  website: string;
  linkedin: string;
  github: string;
  memberSince: string;
  lastLogin: string;
  lastActiveDevice: string;
  accountId: string;
  avatar: string;
}

export default function ProfilePage() {
  const { isDark, toggleTheme } = useTheme();
  const T = isDark ? DARK : LIGHT;

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "John Shreyan",
    username: "johnshreyan",
    email: "johnshreyan@act.platform",
    emailVerified: true,
    phone: "+91 98765 43210",
    organization: "ACT Platform Corp",
    department: "AI & Innovation Labs",
    designation: "Principal Architect",
    country: "India",
    timezone: "IST (GMT+5:30)",
    language: "English (US)",
    bio: "AI platform architect specializing in document transformation workflows, vector store RAG queries, and neural pipeline optimizations.",
    website: "https://act-platform.io",
    linkedin: "https://linkedin.com/in/johnshreyan",
    github: "https://github.com/johnshreyan",
    memberSince: "2026-08-01",
    lastLogin: new Date().toLocaleString(),
    lastActiveDevice: "Desktop Chrome (Windows 11)",
    accountId: "ACT_ACC_9821-4921",
    avatar: ""
  });

  // State hooks for sub-systems
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [profileProgress, setProfileProgress] = useState(85);
  
  // Custom API keys state
  const [apiKeys, setApiKeys] = useState<string[]>([
    "act_live_92149...x9f2"
  ]);

  // Notifications preferences
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(true);
  const [notifAlerts, setNotifAlerts] = useState(true);

  // Preference details
  const [accentColor, setAccentColor] = useState("#a855f7");
  const [compactMode, setCompactMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("act_user_profile_data");
      if (stored) {
        setProfile(JSON.parse(stored));
      } else {
        localStorage.setItem("act_user_profile_data", JSON.stringify(profile));
      }
    }
  }, []);

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated);
    localStorage.setItem("act_user_profile_data", JSON.stringify(updated));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      saveProfile({ ...profile, avatar: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    saveProfile({ ...profile, avatar: "" });
  };

  const handleSavePersonalInfo = () => {
    saveProfile(profile);
    setEditingPersonal(false);
    alert("Profile information saved successfully!");
  };

  // Achievements
  const achievements: Achievement[] = [
    { id: "ach_1", title: "First Transformation", desc: "Indexed and ran OCR/Transcription on your first document.", progress: 100, earned: true, icon: "Zap" },
    { id: "ach_2", title: "Knowledge Expert", desc: "Indexed 100 document files inside projects.", progress: 75, earned: false, icon: "Database" },
    { id: "ach_3", title: "AI Explorer", desc: "Sent over 1000 messages in workspace chat rooms.", progress: 100, earned: true, icon: "MessageSquare" },
    { id: "ach_4", title: "Power User", desc: "Executed 100 Quick Actions.", progress: 30, earned: false, icon: "Cpu" }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Hidden file selector for photo uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Banner / Header Card */}
      <GlassCard className="p-6 flex flex-col md:flex-row items-center gap-6" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
        
        {/* Circle avatar */}
        <div className="relative group shrink-0">
          {profile.avatar ? (
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              className="h-24 w-24 rounded-full object-cover border-4 border-purple-500/20 shadow-xl" 
            />
          ) : (
            <div className="h-24 w-24 rounded-full flex items-center justify-center font-bold text-white text-3xl bg-purple-650 border-4 border-purple-500/20 shadow-xl">
              {profile.fullName.split(" ").map(n => n[0]).join("")}
            </div>
          )}
          
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 cursor-pointer">
            <button onClick={() => fileInputRef.current?.click()} className="text-white text-[10px] font-bold flex items-center gap-1">
              <Camera className="h-3 w-3" />
              Upload
            </button>
            {profile.avatar && (
              <button onClick={removeAvatar} className="text-red-400 text-[10px] font-bold">Remove</button>
            )}
          </div>
        </div>

        {/* Username role information */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <h2 className="text-xl font-bold" style={{ color: T.textPrimary }}>{profile.fullName}</h2>
              {profile.emailVerified && (
                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Verified</span>
              )}
            </div>
            <p className="text-xs text-slate-400">@{profile.username} • {profile.designation}</p>
          </div>

          <div className="flex justify-center md:justify-start gap-2.5">
            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              ACT Enterprise Plan
            </span>
          </div>

          {/* Completion scale */}
          <div className="space-y-1 max-w-xs mx-auto md:mx-0">
            <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Profile Completion</span>
              <span>{profileProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-purple-650 h-full" style={{ width: `${profileProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto">
          {editingPersonal ? (
            <Button onClick={handleSavePersonalInfo} className="bg-purple-600 hover:bg-purple-700 text-xs py-2 w-full md:w-36">
              Save Changes
            </Button>
          ) : (
            <Button onClick={() => setEditingPersonal(true)} variant="outline" className="text-xs py-2 w-full md:w-36">
              Edit Profile
            </Button>
          )}
        </div>

      </GlassCard>

      {/* Split grid details */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* Personal Details Column */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Detailed Account fields */}
          <GlassCard className="p-5 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-2" style={{ borderColor: T.border }}>
              Personal Information
            </h3>

            {editingPersonal ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border text-white focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border text-white focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Country</label>
                  <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border text-white focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">TimeZone</label>
                  <input
                    type="text"
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border text-white focus:outline-none"
                    style={{ borderColor: T.border }}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bio / Abstract Summary</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full p-3 rounded-xl text-xs bg-slate-900 border text-white focus:outline-none h-24"
                    style={{ borderColor: T.border }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-400" />
                  <span>Email: {profile.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-400" />
                  <span>Phone: {profile.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-400" />
                  <span>Location: {profile.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-purple-400" />
                  <span>Timezone: {profile.timezone}</span>
                </div>
                <div className="sm:col-span-2 p-3.5 bg-slate-900/60 rounded-xl border leading-relaxed border-white/5">
                  <strong>Professional Bio:</strong> {profile.bio}
                </div>
              </div>
            )}
          </GlassCard>

          {/* Achievements Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Earned achievements</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {achievements.map(ach => (
                <GlassCard key={ach.id} className="p-4 space-y-3" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">{ach.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                      ach.earned ? "bg-emerald-500/10 text-emerald-400" : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {ach.earned ? "Unlocked" : "Locked"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{ach.desc}</p>
                  
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-purple-650 h-full" style={{ width: `${ach.progress}%` }} />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

        </div>

        {/* Preferences and Subscriptions column */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Subscription details */}
          <GlassCard className="p-4 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: T.border }}>
              Subscription Tier
            </h3>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Monthly Allocation</span>
                <span className="font-bold">Unlimited API</span>
              </div>
              <div className="flex justify-between">
                <span>Vector Size Quota</span>
                <span className="font-bold">500 MB</span>
              </div>
              <div className="flex justify-between">
                <span>Next Invoice Renewal</span>
                <span className="font-bold">Sep 01, 2026</span>
              </div>
            </div>
          </GlassCard>

          {/* Security details (Manage key generation) */}
          <GlassCard className="p-4 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: T.border }}>
              Security Center
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Personal API Keys</span>
                {apiKeys.map(key => (
                  <div key={key} className="flex justify-between items-center text-[10px] font-mono bg-slate-900 border p-2 rounded-xl" style={{ borderColor: T.border }}>
                    <span>{key}</span>
                    <button 
                      onClick={() => {
                        setApiKeys(apiKeys.filter(k => k !== key));
                        alert("Key revoked successfully.");
                      }}
                      className="text-red-400 font-bold"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => {
                  const newKey = `act_live_${Math.random().toString(36).substr(2, 9)}...x${Math.floor(Math.random() * 900 + 100)}`;
                  setApiKeys([...apiKeys, newKey]);
                  alert("New platform API key generated!");
                }}
                className="w-full text-[10px] py-1 border bg-slate-800"
              >
                Generate Key
              </Button>
            </div>
          </GlassCard>

          {/* Preferences switcher */}
          <GlassCard className="p-4 space-y-4" style={{ backgroundColor: T.bgCard, borderColor: T.border }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1" style={{ borderColor: T.border }}>
              Interface Preferences
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span>Dashboard Theme</span>
                <button 
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-lg border text-[10px] font-bold"
                  style={{ borderColor: T.border }}
                >
                  {isDark ? "Dark Theme" : "Light Theme"}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span>Compact Layout Mode</span>
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                  className="h-4 w-4 cursor-pointer text-purple-650"
                />
              </div>
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
