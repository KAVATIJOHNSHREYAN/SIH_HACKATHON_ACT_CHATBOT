"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="absolute top-6 left-6">
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset your password</h1>
          <p className="text-sm text-slate-400 mt-2">We will send a secure reset link to your email</p>
        </div>

        <GlassCard className="p-8">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
                <KeyRound className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
                If an account exists for <strong>{email}</strong>, a recovery email has been sent.
              </div>
              <p className="text-xs text-slate-400">
                Please check your inbox and click the security link to set up a new password.
              </p>
              <Link href="/auth/login" className="inline-block mt-4">
                <Button variant="outline">Return to login</Button>
              </Link>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
