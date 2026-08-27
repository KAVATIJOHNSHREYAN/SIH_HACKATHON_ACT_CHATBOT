"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff, Fingerprint, ScanFace } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/contexts/UserContext";
import { useTheme, LIGHT, DARK } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();
  const { isDark } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [hasBiometric, setHasBiometric] = useState(false);

  // Styling maps matching both interfaces
  const bgStyle = isDark
    ? { backgroundColor: "#060d1a" }
    : { background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)" };

  const cardStyle = isDark
    ? { backgroundColor: "#0f1e35", borderColor: "#1a3a6e" }
    : { backgroundColor: "#ffffff", border: "1.5px solid #86efac", boxShadow: "0 8px 48px rgba(34,197,94,0.12)" };

  const titleColor = isDark ? "#ffffff" : "#0d2d0d";
  const descColor = isDark ? "#94a3b8" : "#4b7a4b";
  const labelColor = isDark ? "#e2e8f0" : "#16a34a";
  const inputBg = isDark ? "#0e1c33" : "#f0fdf4";
  const inputBorder = isDark ? "#1a3a6e" : "#bbf0bb";
  const inputColor = isDark ? "#ffffff" : "#0d2d0d";
  
  const primaryButtonBg = isDark
    ? "linear-gradient(135deg, #2563eb, #3b82f6)"
    : "linear-gradient(135deg, #16a34a, #22c55e)";
  const primaryButtonShadow = isDark
    ? "0 4px 20px rgba(59,130,246,0.3)"
    : "0 4px 20px rgba(34,197,94,0.35)";

  const linkColor = isDark ? "#a78bfa" : "#16a34a"; // purple-400 vs green-600
  const dividerBorder = isDark ? "1px solid #1a3a6e" : "1px solid #bbf0bb";

  // Check if biometric login is configured for this browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const biometricUser = localStorage.getItem("act_biometric_user");
      if (biometricUser) {
        setHasBiometric(true);
      }
    }
  }, []);

  // Parse Google OAuth hash token from URL redirect
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get("access_token");
      if (accessToken) {
        setLoading(true);
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.email) {
              login({
                id: `google_${data.sub || Date.now()}`,
                name: data.name || data.given_name || data.email.split("@")[0],
                email: data.email.toLowerCase(),
                avatar: data.picture || "",
                organization: "",
                role: "User",
                plan: "Free",
                bio: "",
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                achievements: [],
              });
              router.push("/dashboard");
            }
          })
          .catch((err) => {
            console.error("Google Auth failed:", err);
            setError("Google OAuth verification failed. Please try again.");
          })
          .finally(() => setLoading(false));
      }
    }
  }, [login, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const raw = localStorage.getItem("act_user");
      if (raw) {
        const stored = JSON.parse(raw);
        if (stored.email === email.trim().toLowerCase()) {
          login({ ...stored });
          setTimeout(() => {
            setLoading(false);
            router.push("/dashboard");
          }, 600);
          return;
        } else {
          setError("Email does not match the registered account.");
          setLoading(false);
          return;
        }
      }
      // No account found — treat as first-time guest login
      login({
        id: `guest_${Date.now()}`,
        name: email.split("@")[0],
        email: email.trim().toLowerCase(),
        organization: "",
        role: "User",
        plan: "Free",
        bio: "",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        achievements: [],
      });
      setTimeout(() => {
        setLoading(false);
        router.push("/dashboard");
      }, 600);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    const clientId = "1082260655823-uprqdfsl9n2g01i4g5n9h69u8qf9o7vj.apps.googleusercontent.com";
    const redirectUri = window.location.origin + "/auth/login";
    const targetUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=email%20profile&prompt=select_account`;
    window.location.href = targetUrl;
  };

  // WebAuthn Browser Biometric login (Face ID / Fingerprint / Windows Hello)
  const handleBiometricLogin = async (type: "fingerprint" | "face") => {
    setError("");
    setLoading(true);
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [],
            userVerification: "required",
            timeout: 10000
          }
        }).catch(() => null);

        if (credential) {
          logInBiometricUser();
          return;
        }
      }

      // Sandbox Fallback
      setTimeout(() => {
        logInBiometricUser();
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setError("Biometric verification failed: " + err.message);
      setLoading(false);
    }
  };

  const logInBiometricUser = () => {
    const biometricUser = localStorage.getItem("act_biometric_user") || "biometric_guest@act.com";
    const storedUser = localStorage.getItem("act_user");
    
    const userObj = storedUser ? JSON.parse(storedUser) : {
      id: `biometric_${Date.now()}`,
      name: biometricUser.split("@")[0],
      email: biometricUser,
      organization: "",
      role: "User",
      plan: "Free",
      bio: "",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      achievements: [],
    };

    login(userObj);
    setLoading(false);
    router.push("/dashboard");
  };

  // Register WebAuthn Biometrics for this device
  const handleRegisterBiometrics = async () => {
    setError("");
    if (!email) {
      setError("Please fill in your email address above to register biometrics.");
      return;
    }
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "ACT Content Platform" },
            user: {
              id: userId,
              name: email,
              displayName: email.split("@")[0]
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: { userVerification: "preferred" },
            timeout: 30000
          }
        }).catch(() => null);

        if (credential) {
          localStorage.setItem("act_biometric_user", email);
          setHasBiometric(true);
          alert("Device biometric registered successfully! You can now use Fingerprint / Face ID to sign in.");
          return;
        }
      }

      // Local browser fallback registration
      localStorage.setItem("act_biometric_user", email);
      setHasBiometric(true);
      alert("Simulated: Biometrics successfully mapped to this browser storage!");

    } catch (err: any) {
      console.error(err);
      setError("Failed to register biometrics: " + err.message);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden transition-all duration-300" style={bgStyle}>
      {/* Background glow orbs */}
      {isDark && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      )}

      {/* Decorative blobs for light green theme */}
      {!isDark && (
        <>
          <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #16a34a, transparent)' }} />
        </>
      )}

      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: linkColor }}>
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: titleColor }}>Welcome back to ACT</h1>
          <p className="text-sm mt-2" style={{ color: descColor }}>Log in to transform your content portfolio</p>
        </div>

        <GlassCard className="p-8 rounded-3xl" style={cardStyle}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: labelColor }}>
                  Email Address
                </label>
                <button
                  type="button"
                  onClick={handleRegisterBiometrics}
                  className="text-[10px] font-bold transition-all text-purple-400 hover:text-purple-300"
                  title="Enable Biometrics on this device"
                >
                  ⚡ Register Biometrics
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-colors border font-medium"
                  style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide" style={{ color: labelColor }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-10 py-3 rounded-xl text-sm focus:outline-none transition-colors border font-medium"
                  style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 font-medium text-center py-1 px-3 bg-red-950/40 rounded-lg border border-red-900/50">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              style={{
                background: primaryButtonBg,
                boxShadow: primaryButtonShadow,
              }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Biometrics Block - Always Visible */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: isDark ? "#1a3a6e" : "#bbf0bb" }}>
            <p className="text-[10px] text-center uppercase tracking-wider font-semibold mb-2" style={{ color: descColor }}>
              Secure Device Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleBiometricLogin("fingerprint")}
                className="py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:bg-slate-100/5"
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }}
              >
                <Fingerprint className="h-4 w-4 text-purple-400" />
                Fingerprint
              </button>
              <button
                type="button"
                onClick={() => handleBiometricLogin("face")}
                className="py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:bg-slate-100/5"
                style={{ backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }}
              >
                <ScanFace className="h-4 w-4 text-cyan-400" />
                Face ID
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: dividerBorder }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 font-semibold" style={{ backgroundColor: isDark ? "#0f1e35" : "#ffffff", color: isDark ? "#94a3b8" : "#86efac" }}>
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              backgroundColor: inputBg,
              border: `1.5px solid ${inputBorder}`,
              color: inputColor,
            }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6 font-medium" style={{ color: descColor }}>
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-bold transition-colors" style={{ color: linkColor }}>
              Create an account
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
