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
  Cpu,
  Crown
} from "lucide-react";

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
  const [activeModel, setActiveModel] = useState("ACT Pro");

  const [notifications, setNotifications] = useState([
    { id: 1, text: "Transformation complete: PDF → MCQ Notes", type: "success", time: "2m ago" },
    { id: 2, text: "Audio transcription completed successfully", type: "success", time: "10m ago" },
    { id: 3, text: "Storage limit reaching 85% soon", type: "warning", time: "1h ago" },
  ]);

  const models = ["Gemini Pro", "GPT-4o", "Cohere Command A+", "Claude 3.5 Sonnet", "Mistral Large"];

  return (
    <div className="flex min-h-screen bg-gradient-mesh text-foreground" style={{ backgroundColor: '#f0faf0' }}>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r" style={{ backgroundColor: '#ffffff', borderColor: '#bbf0bb' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-2.5 border-b" style={{ borderColor: '#bbf0bb' }}>
          <div className="h-8 w-8 rounded-lg overflow-hidden border-2" style={{ borderColor: '#22c55e' }}>
            <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-lg" style={{ color: '#0d2d0d' }}>ACT Platform</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={isActive ? {
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  fontWeight: 600,
                } : {
                  color: '#4b7a4b',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdf4';
                    (e.currentTarget as HTMLElement).style.color = '#16a34a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = '#4b7a4b';
                  }
                }}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" style={{ color: isActive ? '#16a34a' : '#86efac' }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user + plan */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: '#bbf0bb' }}>
          {/* Issues badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer" style={{ backgroundColor: '#dcfce7' }}>
            <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: '#22c55e' }}>N</div>
            <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>1 Issue</span>
            <ChevronDown className="h-3 w-3 ml-auto" style={{ color: '#16a34a' }} />
          </div>
          {/* Plan badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf0bb' }}>
            <Crown className="h-4 w-4" style={{ color: '#16a34a' }} />
            <div>
              <p className="text-xs font-bold" style={{ color: '#0d2d0d' }}>ACT Pro Plan</p>
              <p className="text-[10px]" style={{ color: '#22c55e' }}>Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b z-30" style={{ backgroundColor: '#ffffff', borderColor: '#bbf0bb' }}>
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#4b7a4b' }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search */}
            <div className="relative max-w-md w-full hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center" style={{ color: '#86efac' }}>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Global Search (Files, Chat, Templates...)"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all"
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #bbf0bb',
                  color: '#0d2d0d',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#22c55e'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#bbf0bb'}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: '#dcfce7',
                  border: '1.5px solid #86efac',
                  color: '#16a34a',
                }}
              >
                <Cpu className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                <span>{activeModel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {modelSelectorOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl p-1.5 z-50" style={{ backgroundColor: '#ffffff', border: '1.5px solid #bbf0bb' }}>
                  {models.map((model) => (
                    <button
                      key={model}
                      onClick={() => { setActiveModel(model); setModelSelectorOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                      style={{ color: '#0d2d0d' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#dcfce7';
                        (e.currentTarget as HTMLElement).style.color = '#16a34a';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLElement).style.color = '#0d2d0d';
                      }}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl relative transition-colors"
                style={{ color: '#4b7a4b' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#f0fdf4'}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full pulse-green" style={{ backgroundColor: '#22c55e' }} />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl p-4 z-50" style={{ backgroundColor: '#ffffff', border: '1.5px solid #bbf0bb' }}>
                  <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: '1px solid #bbf0bb' }}>
                    <span className="text-xs font-bold" style={{ color: '#0d2d0d' }}>Notifications</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] font-semibold" style={{ color: '#22c55e' }}>
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: '#86efac' }}>No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="text-xs">
                          <p style={{ color: '#0d2d0d' }}>{n.text}</p>
                          <span style={{ color: '#86efac', fontSize: '10px' }}>{n.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-8 w-8 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
              >
                JD
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl p-1.5 z-50" style={{ backgroundColor: '#ffffff', border: '1.5px solid #bbf0bb' }}>
                  <Link href="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: '#0d2d0d' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#dcfce7'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <User className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                    My Profile
                  </Link>
                  <Link href="/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: '#0d2d0d' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#dcfce7'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <Settings className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
                    Settings
                  </Link>
                  <div className="my-1" style={{ borderTop: '1px solid #bbf0bb' }} />
                  <Link href="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: '#dc2626' }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: '#f0faf0' }}>
          {children}
        </main>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="fixed inset-y-0 left-0 w-64 p-5 flex flex-col" style={{ backgroundColor: '#ffffff', borderRight: '1.5px solid #bbf0bb' }}>
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid #bbf0bb' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden">
                  <img src="/logo.png" alt="ACT Logo" className="h-full w-full object-cover" />
                </div>
                <span className="font-bold" style={{ color: '#0d2d0d' }}>ACT Platform</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg" style={{ color: '#4b7a4b' }}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-0.5 overflow-y-auto">
              {NAVIGATION.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={isActive ? { backgroundColor: '#dcfce7', color: '#16a34a' } : { color: '#4b7a4b' }}
                  >
                    <item.icon className="h-4.5 w-4.5" style={{ color: isActive ? '#16a34a' : '#86efac' }} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
