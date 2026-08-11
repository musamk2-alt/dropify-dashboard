"use client";

import * as React from "react";

type ButtonBaseProps =
  React.ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

type ButtonSize =
  | "sm"
  | "md"
  | "lg"
  | "icon";

interface ButtonProps extends ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button =
  React.forwardRef<HTMLButtonElement, ButtonProps>(
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
      const variantStyles:
        Record<ButtonVariant, string> = {
        primary:
          "border border-violet-400/20 bg-violet-600 text-white " +
          "shadow-[0_8px_22px_rgba(124,58,237,0.2)] " +
          "hover:bg-violet-500 active:bg-violet-700",

        secondary:
          "border border-slate-700 bg-slate-900 text-slate-200 " +
          "hover:border-slate-600 hover:bg-slate-800",

        ghost:
          "border border-transparent bg-transparent text-slate-400 " +
          "hover:bg-slate-900 hover:text-slate-100",

        outline:
          "border border-slate-700 bg-transparent text-slate-300 " +
          "hover:border-slate-600 hover:bg-slate-900 hover:text-white",

        danger:
          "border border-red-500/20 bg-red-500/10 text-red-300 " +
          "hover:bg-red-500/15 hover:text-red-200",
      };

      const sizeStyles:
        Record<ButtonSize, string> = {
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-9 rounded-lg px-4 text-sm",
        lg: "h-10 rounded-xl px-4 text-sm",
        icon:
          "h-9 w-9 rounded-lg p-0",
      };

      const classes = [
        "inline-flex items-center justify-center gap-2 font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-violet-500/60 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#06080d]",
        "disabled:cursor-not-allowed disabled:opacity-50",
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
          disabled={
            disabled ||
            isLoading
          }
          {...props}
        >
          {isLoading && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
            />
          )}

          <span>
            {children}
          </span>
        </button>
      );
    }
  );

Button.displayName = "Button";
