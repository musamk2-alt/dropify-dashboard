import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

interface CardProps extends DivProps {
  glow?: boolean;
}

/**
 * Base glassy card used across the Dropify dashboard.
 * All cards use the same hover / glow behaviour for consistency.
 */
export function Card({ className, glow = true, ...props }: CardProps) {
  const base =
    "relative rounded-2xl border border-white/5 bg-slate-950/60 " +
    "backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.65)] " +
    "transition-all duration-200 hover:-translate-y-[1px] hover:border-white/10";

  const glowClasses =
    glow &&
    " before:pointer-events-none before:absolute before:inset-px " +
      "before:rounded-[1rem] before:bg-gradient-to-b " +
      "before:from-white/10 before:to-transparent before:opacity-60";

  const merged = [base, glowClasses, className].filter(Boolean).join(" ");

  return <div className={merged} {...props} />;
}

export function CardHeader({ className, ...props }: DivProps) {
  const base = "flex flex-col gap-1 border-b border-white/5 px-5 pt-4 pb-4";
  const merged = [base, className].filter(Boolean).join(" ");
  return <div className={merged} {...props} />;
}

export function CardTitle({ className, ...props }: DivProps) {
  const base = "text-sm sm:text-base font-semibold tracking-tight text-slate-50";
  const merged = [base, className].filter(Boolean).join(" ");
  return <h3 className={merged} {...props} />;
}

export function CardDescription({ className, ...props }: DivProps) {
  const base = "text-xs sm:text-sm text-slate-400";
  const merged = [base, className].filter(Boolean).join(" ");
  return <p className={merged} {...props} />;
}

export function CardContent({ className, ...props }: DivProps) {
  const base = "px-5 pb-5 pt-4";
  const merged = [base, className].filter(Boolean).join(" ");
  return <div className={merged} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  const base =
    "flex items-center justify-between gap-3 px-5 pb-4 pt-3 border-t border-white/5";
  const merged = [base, className].filter(Boolean).join(" ");
  return <div className={merged} {...props} />;
}
