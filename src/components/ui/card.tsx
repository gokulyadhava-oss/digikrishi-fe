import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Card ────────────────────────────────────────────────────────────────────
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base structure
        "relative isolate overflow-hidden rounded-2xl",
        // Light: soft white + green tint; Dark: glass surface
        "bg-white/95 dark:bg-[#0f0f11]/80 backdrop-blur-xl",
        "shadow-[0_0_0_1px_rgba(34,197,94,0.04),0_4px_24px_-4px_rgba(0,0,0,0.08),0_0_32px_-6px_rgba(34,197,94,0.06)]",
        "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_-12px_rgba(0,0,0,0.8),0_0_40px_-8px_rgba(34,197,94,0.06)]",
        // Pseudo-element shine — very subtle green tint
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit]",
        "before:bg-[linear-gradient(135deg,rgba(34,197,94,0.02)_0%,transparent_50%,rgba(34,197,94,0.01)_100%)]",
        "dark:before:bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,transparent_50%,rgba(255,255,255,0.01)_100%)]",
        // Hover lift + very subtle green glow
        "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:-translate-y-0.5",
        "hover:shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_8px_32px_-6px_rgba(0,0,0,0.1),0_0_40px_-8px_rgba(34,197,94,0.1)]",
        "dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_24px_64px_-12px_rgba(0,0,0,0.85),0_0_48px_-8px_rgba(34,197,94,0.1)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

// ─── CardHeader ──────────────────────────────────────────────────────────────
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1.5 px-7 pt-7 pb-4",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// ─── CardTitle ───────────────────────────────────────────────────────────────
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-[system-ui] text-[1.35rem] font-semibold leading-tight tracking-[-0.02em]",
        "text-gray-900 dark:bg-gradient-to-br dark:from-white dark:via-white/90 dark:to-white/50 dark:bg-clip-text dark:text-transparent",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

// ─── CardDescription ─────────────────────────────────────────────────────────
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-[0.875rem] leading-relaxed tracking-[0.005em] text-gray-500 dark:text-white/40",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

// ─── CardContent ─────────────────────────────────────────────────────────────
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-7 py-4 text-sm leading-relaxed text-gray-700 dark:text-white/70",
        className
      )}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

// ─── CardFooter ──────────────────────────────────────────────────────────────
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 px-7 pt-2 pb-7 mt-2",
        "border-t border-gray-200 dark:border-white/[0.06]",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };