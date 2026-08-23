"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sparkles, 
  LayoutDashboard, 
  RefreshCw, 
  MessageSquare, 
  FolderOpen, 
  FolderGit2, 
  FileCode, 
  History, 
  BarChart3, 
  Settings, 
  User, 
  HelpCircle,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Cpu
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

// Sidebar Navigation Configuration
const NAVIGATION = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transform", href: "/transform", icon: RefreshCw },
  { name: "AI Workspace", href: "/chat", icon: MessageSquare },
  { name: "My Files", href: "/files", icon: FolderOpen },
  { name: "Projects", href: "/projects", icon: FolderGit2 },
  { name: "Templates", href: "/templates", icon: FileCode },
  { name: "History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Help & Docs", href: "/help", icon: HelpCircle },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("Gemini Pro");

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Transformation complete: PDF → MCQ Notes", type: "success", time: "2m ago" },
    { id: 2, text: "Audio transcription completed successfully", type: "success", time: "10m ago" },
    { id: 3, text: "Storage limit reaching 85% soon", type: "warning", time: "1h ago" },
  ]);

  const models = ["Gemini Pro", "GPT-4o", "Cohere", "Claude 3.5 Sonnet", "Mistral Large"];

  return (
    <div className="flex min-h-screen bg-background bg-gradient-mesh text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="h-16 flex items-center px-6 gap-2 border-b border-white/5">
          <div className="h-8 w-8 rounded-lg overflow-hidden">
            <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-lg text-white">ACT Platform</span>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-600/15 border border-purple-500/20 text-white shadow-lg shadow-purple-500/5"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/40">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">John Doe</p>
              <p className="text-[10px] text-slate-500 truncate">john@company.com</p>
            </div>
            <button 
              onClick={() => router.push("/")}
              className="text-slate-500 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-white/5 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative max-w-md w-full hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Global Search (Files, Chat, Templates...)"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* AI Model switcher */}
            <div className="relative">
              <button
                onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900 text-xs text-slate-200 hover:bg-slate-800"
              >
                <Cpu className="h-3.5 w-3.5 text-purple-400" />
                <span>{activeModel}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {modelSelectorOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-950 border border-white/10 shadow-2xl p-1 z-50">
                  {models.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setActiveModel(model);
                        setModelSelectorOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Hub */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-purple-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-950 border border-white/10 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[10px] text-purple-400 hover:text-purple-300"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="text-xs">
                          <p className="text-slate-300 leading-relaxed">{n.text}</p>
                          <span className="text-[10px] text-slate-500">{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile context menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs border border-white/10"
              >
                JD
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-950 border border-white/10 shadow-2xl p-1.5 z-50">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    My Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-slate-400" />
                    Settings
                  </Link>
                  <div className="border-t border-white/5 my-1.5" />
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic child modules workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <div className="fixed inset-y-0 left-0 w-64 bg-slate-950 p-6 flex flex-col border-r border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden">
                  <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
                </div>
                <span className="font-bold text-white">ACT Platform</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {NAVIGATION.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-purple-600/15 border border-purple-500/20 text-white shadow-lg shadow-purple-500/5"
                        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <item.icon className="h-4.5 w-4.5 text-purple-400" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white text-xs">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">John Doe</p>
                  <p className="text-[10px] text-slate-500 truncate">john@company.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
