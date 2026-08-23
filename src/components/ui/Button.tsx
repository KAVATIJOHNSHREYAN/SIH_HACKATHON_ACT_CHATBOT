import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glow";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    primary:
      "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:brightness-110 shadow-lg shadow-purple-500/20",
    secondary:
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 shadow-lg shadow-cyan-500/20",
    outline:
      "border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-200",
    ghost: "hover:bg-white/5 text-slate-300 hover:text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20",
    glow: "border border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 hover:border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
