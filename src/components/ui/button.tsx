"use client";

import * as React from "react";

type ButtonBaseProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

/**
 * Reusable button component with Dropify styling.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-gradient-to-r from-[#a855f7] via-[#6366f1] to-[#22c55e] " +
        "text-slate-50 shadow-lg shadow-indigo-500/30 " +
        "hover:brightness-110 active:brightness-95 border border-white/10",
      secondary:
        "bg-slate-900/80 text-slate-100 border border-white/10 " +
        "hover:bg-slate-900 hover:border-white/20",
      ghost:
        "bg-transparent text-slate-200 hover:bg-slate-900/60 border border-transparent",
      outline:
        "bg-transparent text-slate-100 border border-slate-500/40 " +
        "hover:border-slate-300/70 hover:bg-slate-900/60",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-8 px-3 text-xs rounded-xl",
      md: "h-9 px-4 text-sm rounded-xl",
      lg: "h-11 px-5 text-sm sm:text-base rounded-2xl",
      icon: "h-9 w-9 rounded-full flex items-center justify-center",
    };

    const base =
      "inline-flex items-center justify-center gap-2 font-medium " +
      "transition-all duration-150 focus-visible:outline-none " +
      "focus-visible:ring-2 focus-visible:ring-offset-2 " +
      "focus-visible:ring-offset-slate-950 focus-visible:ring-indigo-500 " +
      "disabled:cursor-not-allowed disabled:opacity-60";

    const classes = [
      base,
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span
            className="inline-flex h-4 w-4 animate-spin rounded-full border-[2px] border-slate-100/60 border-t-transparent"
            aria-hidden="true"
          />
        )}
        <span className={isLoading ? "opacity-80" : undefined}>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
