import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (s: string) => {
    const term = s.toLowerCase();
    if (["delivered", "completed", "paid", "active"].includes(term)) {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    if (["pending", "unpaid", "assigned"].includes(term)) {
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
    if (["cancelled", "failed", "offline"].includes(term)) {
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
    }
    return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20";
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
      getStatusConfig(status),
      className
    )}>
      {status}
    </span>
  );
};

interface TerminalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const TerminalButton: React.FC<TerminalButtonProps> = ({
  children,
  icon: Icon,
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200",
    secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
    outline: "bg-transparent border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[9px]",
    md: "px-4 py-2 text-[10px]",
    lg: "px-6 py-3 text-[11px]",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-[0.1em] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none italic",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
};

export const TerminalCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ 
  children, 
  className,
  title
}) => {
  return (
    <div className={cn("bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group", className)}>
      <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-500" />
      {title && (
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 italic mb-1">{title}</h3>
          <div className="h-px w-full bg-zinc-50" />
        </div>
      )}
      {children}
    </div>
  );
};
