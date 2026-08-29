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

// ─── Global User Storage Isolation Proxy ────────────────────────────────────

if (typeof window !== "undefined") {
  const originalGetItem = window.localStorage.getItem;
  const originalSetItem = window.localStorage.setItem;
  const originalRemoveItem = window.localStorage.removeItem;

  const getScopedKey = (key: string): string => {
    // Keys that do not need to be user-scoped
    const globalKeys = ["act_user", "act_theme", "act_biometric_user"];
    if (globalKeys.includes(key)) {
      return key;
    }

    try {
      const userRaw = originalGetItem.call(window.localStorage, "act_user");
      if (userRaw) {
        const userObj = JSON.parse(userRaw);
        if (userObj && userObj.email) {
          const userSuffix = userObj.email.replace(/[^a-zA-Z0-9]/g, "_");
          return `${key}_${userSuffix}`;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return key;
  };

  window.localStorage.getItem = function (key: string) {
    const scopedKey = getScopedKey(key);
    return originalGetItem.call(this, scopedKey);
  };

  window.localStorage.setItem = function (key: string, value: string) {
    const scopedKey = getScopedKey(key);
    originalSetItem.call(this, scopedKey, value);
  };

  window.localStorage.removeItem = function (key: string) {
    const scopedKey = getScopedKey(key);
    originalRemoveItem.call(this, scopedKey);
  };
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
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  const persist = useCallback((profile: UserProfile) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setUser(profile);
    window.dispatchEvent(new Event("userUpdate"));
    window.dispatchEvent(new Event("profileUpdate"));
  }, []);

  const login = useCallback((profile: UserProfile) => {
    const updated = { ...profile, lastLogin: new Date().toISOString() };
    persist(updated);

    // Initialize defaults if they don't exist for the scoped user
    if (typeof window !== "undefined") {
      const userSuffix = updated.email.replace(/[^a-zA-Z0-9]/g, "_");
      const setupDoneKey = `act_setup_done_${userSuffix}`;
      
      // Directly check original localStorage to see if setup completed for this specific user
      const rawSetup = window.localStorage.getItem(setupDoneKey);
      if (!rawSetup) {
        window.localStorage.setItem(`act_user_files_${userSuffix}`, JSON.stringify([]));
        window.localStorage.setItem(`act_transform_history_${userSuffix}`, JSON.stringify([]));
        window.localStorage.setItem(`act_assistant_projects_workspace_details_${userSuffix}`, JSON.stringify([]));
        window.localStorage.setItem(`act_onboarding_checklist_${userSuffix}`, JSON.stringify([
          { id: "step_proj", label: "Create your first Project", completed: false },
          { id: "step_file", label: "Upload your first File", completed: false },
          { id: "step_trans", label: "Run your first AI Transformation", completed: false },
          { id: "step_quick", label: "Use a Quick Action", completed: false },
          { id: "step_chat", label: "Chat with your documents", completed: false },
          { id: "step_exp", label: "Export your output", completed: false }
        ]));
        window.localStorage.setItem(setupDoneKey, "true");
      }
    }
  }, [persist]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        const userRaw = window.localStorage.getItem("act_user");
        if (userRaw) {
          const userObj = JSON.parse(userRaw);
          if (userObj && userObj.email) {
            const userSuffix = userObj.email.replace(/[^a-zA-Z0-9]/g, "_");
            
            // Clean up all local storage variables belonging to this specific user suffix
            const keysToRemove: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
              const key = window.localStorage.key(i);
              if (key && key.endsWith(`_${userSuffix}`)) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(k => window.localStorage.removeItem(k));
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // Destroy session configuration key
      window.localStorage.removeItem("act_user");

      // Clear session storage
      try {
        window.sessionStorage.clear();
      } catch (e) {}

      // Clear IndexedDB databases
      try {
        if (window.indexedDB) {
          window.indexedDB.databases().then((databases) => {
            databases.forEach((db) => {
              if (db.name) {
                window.indexedDB.deleteDatabase(db.name);
              }
            });
          });
        }
      } catch (e) {}

      // Clear cached Sw requests
      try {
        if (window.caches) {
          window.caches.keys().then((keys) => {
            keys.forEach((key) => {
              window.caches.delete(key);
            });
          });
        }
      } catch (e) {}
    }

    setUser(null);
  }, []);

  const updateUser = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
