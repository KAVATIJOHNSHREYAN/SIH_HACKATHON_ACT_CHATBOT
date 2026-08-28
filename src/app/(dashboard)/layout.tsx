"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, RefreshCw, MessageSquare, FolderOpen, 
  FolderGit2, FileCode, History, BarChart3, Settings, User, 
  HelpCircle, Menu, X, Search, Bell, ChevronDown, LogOut, 
  Cpu, Crown, Sun, Moon
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

const NAVIGATION = [
  { name: "Dashboard",    href: "/dashboard",  icon: LayoutDashboard },
  { name: "Transform",    href: "/transform",  icon: RefreshCw },
  { name: "AI Workspace", href: "/chat",        icon: MessageSquare },
  { name: "My Files",     href: "/files",       icon: FolderOpen },
  { name: "Projects",     href: "/projects",    icon: FolderGit2 },
  { name: "Quick Actions", href: "/templates",  icon: FileCode },
  { name: "History",      href: "/history",     icon: History },
  { name: "Analytics",    href: "/analytics",   icon: BarChart3 },
  { name: "Settings",     href: "/settings",    icon: Settings },
  { name: "Profile",      href: "/profile",     icon: User },
  { name: "Help & Docs",  href: "/help",        icon: HelpCircle },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, getInitials, nameToColor } = useUser();
  const { isDark, toggleTheme } = useTheme();

  const T = isDark ? DARK : LIGHT;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeModel, setActiveModel] = useState("ACT Pro");
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Transformation complete: PDF → MCQ Notes", time: "2m ago" },
    { id: 2, text: "Audio transcription completed successfully",  time: "10m ago" },
    { id: 3, text: "Storage limit reaching 85% soon",            time: "1h ago" },
  ]);

  const models = ["Gemini Pro", "GPT-4o", "Cohere Command A+", "Claude 3.5 Sonnet", "Mistral Large"];

  const displayName   = user?.name  || "Guest";
  const displayInitials = getInitials(displayName);
  const displayPlan   = user?.plan  || "Free";
  const displayRole   = user?.role  || "User";
  const avatarColor   = nameToColor(displayName);
  const avatarUrl     = user?.avatar || "";

  const handleLogout = () => { logout(); router.push("/"); };

  // ── Reusable avatar element ──────────────────────────────────────────────
  const AvatarEl = ({ size = "sm" }: { size?: "sm" | "md" }) => {
    const dim = size === "md" ? "h-8 w-8" : "h-7 w-7";
    const txt = size === "md" ? "text-xs" : "text-[10px]";
    return avatarUrl ? (
      <img src={avatarUrl} alt={displayName} className={`${dim} rounded-full object-cover`} />
    ) : (
      <span className={`${dim} rounded-full flex items-center justify-center font-bold text-white ${txt}`} style={{ background: avatarColor }}>
        {displayInitials}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gradient-mesh" style={{ backgroundColor: T.bgMain }}>

      {/* ═══ Desktop Sidebar ═════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r"
        style={{ backgroundColor: T.bgSidebar, borderColor: T.border }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-2.5 border-b" style={{ borderColor: T.border }}>
          <div className="h-8 w-8 rounded-lg overflow-hidden border-2" style={{ borderColor: T.primaryBright }}>
            <img src="/logo.png" alt="ACT" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold text-lg" style={{ color: T.textPrimary }}>ACT Platform</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
          {NAVIGATION.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                data-active={isActive}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={isActive
                  ? { backgroundColor: T.bgActive, color: T.textActive, fontWeight: 600 }
                  : { color: T.textSecondary }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = T.bgHover;
                    (e.currentTarget as HTMLElement).style.color = T.textActive;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = T.textSecondary;
                  }
                }}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" style={{ color: isActive ? T.textActive : T.primaryMuted }} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user + plan */}
        <div className="p-4 border-t space-y-3" style={{ borderColor: T.border }}>
          {/* User */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: T.bgHover, border: `1px solid ${T.border}` }}>
            <AvatarEl />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{displayName}</p>
              <p className="text-[10px] truncate" style={{ color: T.primaryBright }}>{displayRole}</p>
            </div>
          </div>
          {/* Plan */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: T.bgHover, border: `1px solid ${T.border}` }}>
            <Crown className="h-4 w-4" style={{ color: T.primary }} />
            <div>
              <p className="text-xs font-bold" style={{ color: T.textPrimary }}>ACT {displayPlan} Plan</p>
              <p className="text-[10px]" style={{ color: T.primaryBright }}>Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ Main Content ════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-6 border-b z-30"
          style={{ backgroundColor: T.bgHeader, borderColor: T.border }}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile burger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: T.textSecondary }}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="relative max-w-md w-full hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center" style={{ color: T.primaryMuted }}>
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Global Search (Files, Chat, Templates...)"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all"
                style={{ backgroundColor: T.bgInput, border: `1.5px solid ${T.border}`, color: T.textPrimary }}
                onFocus={(e) => e.currentTarget.style.borderColor = T.primaryBright}
                onBlur={(e) => e.currentTarget.style.borderColor = T.border}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* ── Theme Toggle ──────────────────────────────────────────── */}
            <button
              onClick={toggleTheme}
              className="relative h-8 w-14 rounded-full flex items-center px-1 transition-all duration-300 focus:outline-none"
              style={{
                backgroundColor: isDark ? "#1e3a6e" : "#dcfce7",
                border: `1.5px solid ${T.border}`,
              }}
              title={isDark ? "Switch to Light Green" : "Switch to Dark Blue"}
            >
              {/* Track icons */}
              <Sun  className="absolute left-1.5 h-3.5 w-3.5 transition-all" style={{ color: isDark ? T.textMuted : "#16a34a", opacity: isDark ? 0.4 : 1 }} />
              <Moon className="absolute right-1.5 h-3.5 w-3.5 transition-all" style={{ color: isDark ? "#60a5fa" : T.primaryMuted, opacity: isDark ? 1 : 0.4 }} />
              {/* Thumb */}
              <span
                className="h-5 w-5 rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
                style={{
                  background: isDark ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "linear-gradient(135deg,#16a34a,#22c55e)",
                  transform: isDark ? "translateX(24px)" : "translateX(0px)",
                }}
              >
                {isDark ? <Moon className="h-3 w-3 text-white" /> : <Sun className="h-3 w-3 text-white" />}
              </span>
            </button>

            {/* ── Model Selector ────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: T.bgActive, border: `1.5px solid ${T.border}`, color: T.textActive }}
              >
                <Cpu className="h-3.5 w-3.5" style={{ color: T.primaryBright }} />
                <span>{activeModel}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {modelSelectorOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl shadow-2xl p-1.5 z-50" style={{ backgroundColor: T.bgCard, border: `1.5px solid ${T.border}` }}>
                  {models.map((m) => (
                    <button
                      key={m}
                      onClick={() => { setActiveModel(m); setModelSelectorOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                      style={{ color: T.textPrimary }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = T.bgActive; (e.currentTarget as HTMLElement).style.color = T.textActive; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = T.textPrimary; }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Notifications ─────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl relative transition-colors"
                style={{ color: T.textSecondary }}
                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = T.bgHover}
                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full pulse-green" style={{ backgroundColor: T.navDot }} />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl p-4 z-50" style={{ backgroundColor: T.bgCard, border: `1.5px solid ${T.border}` }}>
                  <div className="flex items-center justify-between pb-2 mb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <span className="text-xs font-bold" style={{ color: T.textPrimary }}>Notifications</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] font-semibold" style={{ color: T.primaryBright }}>Clear All</button>
                  </div>
                  <div className="space-y-2.5">
                    {notifications.length === 0
                      ? <p className="text-xs text-center py-4" style={{ color: T.primaryMuted }}>No new notifications</p>
                      : notifications.map((n) => (
                          <div key={n.id} className="text-xs">
                            <p style={{ color: T.textPrimary }}>{n.text}</p>
                            <span style={{ color: T.primaryMuted, fontSize: "10px" }}>{n.time}</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* ── Profile Avatar ─────────────────────────────────────────── */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white text-xs"
                style={{ background: avatarUrl ? "transparent" : avatarColor }}
                title={displayName}
              >
                <AvatarEl size="md" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl p-1.5 z-50" style={{ backgroundColor: T.bgCard, border: `1.5px solid ${T.border}` }}>
                  {/* User header */}
                  <div className="px-3 py-2.5 mb-1" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-2.5 mb-2">
                      <AvatarEl size="md" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{displayName}</p>
                        <p className="text-[10px] truncate" style={{ color: T.textSecondary }}>{user?.email || ""}</p>
                      </div>
                    </div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase" style={{ backgroundColor: T.bgActive, color: T.textActive }}>
                      {displayRole}
                    </span>
                  </div>
                  <Link href="/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: T.textPrimary }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = T.bgActive}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    <User className="h-3.5 w-3.5" style={{ color: T.primaryBright }} />
                    My Profile
                  </Link>
                  <Link href="/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: T.textPrimary }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = T.bgActive}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    <Settings className="h-3.5 w-3.5" style={{ color: T.primaryBright }} />
                    Settings
                  </Link>
                  <div className="my-1" style={{ borderTop: `1px solid ${T.border}` }} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
                    style={{ color: "#ef4444" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" style={{ backgroundColor: T.bgMain }}>
          {children}
        </main>
      </div>

      {/* ═══ Mobile Sidebar ══════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div className="fixed inset-y-0 left-0 w-64 p-5 flex flex-col" style={{ backgroundColor: T.bgSidebar, borderRight: `1.5px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="ACT" className="h-8 w-8 rounded-lg" />
                <span className="font-bold" style={{ color: T.textPrimary }}>ACT Platform</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg" style={{ color: T.textSecondary }}>
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
                    data-active={isActive}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={isActive ? { backgroundColor: T.bgActive, color: T.textActive } : { color: T.textSecondary }}
                  >
                    <item.icon className="h-4.5 w-4.5" style={{ color: isActive ? T.textActive : T.primaryMuted }} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile user + theme toggle */}
            <div className="pt-4 mt-4 space-y-3" style={{ borderTop: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ backgroundColor: T.bgHover }}>
                <AvatarEl />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate" style={{ color: T.textPrimary }}>{displayName}</p>
                  <p className="text-[10px]" style={{ color: T.primaryBright }}>{displayRole}</p>
                </div>
                {/* inline theme toggle for mobile */}
                <button onClick={toggleTheme} className="p-1.5 rounded-lg" style={{ backgroundColor: T.bgActive }}>
                  {isDark ? <Sun className="h-3.5 w-3.5" style={{ color: T.textActive }} /> : <Moon className="h-3.5 w-3.5" style={{ color: T.textActive }} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
