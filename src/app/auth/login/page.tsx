"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #16a34a, transparent)' }} />

      {/* Back to home */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#16a34a' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}
          >
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0d2d0d' }}>
            Welcome back to ACT
          </h1>
          <p className="text-sm mt-2 font-medium" style={{ color: '#4b7a4b' }}>
            Log in to transform your content portfolio
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #86efac',
            boxShadow: '0 8px 48px rgba(34,197,94,0.12)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-widest" style={{ color: '#16a34a' }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center" style={{ color: '#22c55e' }}>
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest" style={{ color: '#16a34a' }}>
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold transition-colors"
                  style={{ color: '#22c55e' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center" style={{ color: '#22c55e' }}>
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1.5px solid #bbf0bb',
                    color: '#0d2d0d',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#22c55e'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#bbf0bb'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                  style={{ color: '#86efac' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid #bbf0bb' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 font-semibold" style={{ backgroundColor: '#ffffff', color: '#86efac' }}>
                Or continue with
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setTimeout(() => { setLoading(false); router.push("/dashboard"); }, 800);
            }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: '#f0fdf4',
              border: '1.5px solid #bbf0bb',
              color: '#0d2d0d',
            }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#22c55e'}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = '#bbf0bb'}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Register link */}
          <p className="text-center text-xs mt-6 font-medium" style={{ color: '#4b7a4b' }}>
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="font-bold transition-colors"
              style={{ color: '#16a34a' }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
