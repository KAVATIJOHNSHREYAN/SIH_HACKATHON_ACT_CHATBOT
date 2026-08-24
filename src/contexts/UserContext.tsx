"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, DEFAULT_USER } from "@/types/user";

const STORAGE_KEY = "act_user";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getInitials(nameStr: string): string {
  const trimmed = nameStr.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[parts.length - 1][0];
}

/** Stable hue from a string so the same user always gets the same color */
export function nameToColor(nameStr: string): string {
  let hash = 0;
  for (let i = 0; i < nameStr.length; i++) {
    hash = nameStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 42%)`;
}

// ─── Context ────────────────────────────────────────────────────────────────

interface UserContextValue {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (profile: UserProfile) => void;
  logout: () => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  getInitials: (nameStr: string) => string;
  nameToColor: (nameStr: string) => string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  const persist = useCallback((profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
    // Notify any legacy listeners
    window.dispatchEvent(new Event("userUpdate"));
    window.dispatchEvent(new Event("profileUpdate"));
  }, []);

  const login = useCallback((profile: UserProfile) => {
    const updated = { ...profile, lastLogin: new Date().toISOString() };
    persist(updated);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("userUpdate"));
      window.dispatchEvent(new Event("profileUpdate"));
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        isLoggedIn: !!user?.id,
        login,
        logout,
        updateUser,
        getInitials,
        nameToColor,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx;
}
