import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
  hoverGlow?: boolean;
}

export function GlassCard({
  children,
  className = "",
  glow = false,
  hoverGlow = true,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 ${
        glow ? "shadow-[0_0_30px_rgba(139,92,246,0.15)] border-purple-500/20" : ""
      } ${hoverGlow ? "glow-card" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
