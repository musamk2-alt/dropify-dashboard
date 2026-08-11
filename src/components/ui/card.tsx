import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

interface CardProps extends DivProps {
  elevated?: boolean;
}

export function Card({
  className,
  elevated = false,
  ...props
}: CardProps) {
  const classes = [
    "relative overflow-hidden rounded-2xl border border-slate-800/90",
    "bg-[#0b0f17] text-slate-100",
    elevated
      ? "shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
      : "shadow-[0_8px_28px_rgba(0,0,0,0.16)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: DivProps) {
  return (
    <div
      className={[
        "flex flex-col gap-1.5 border-b border-slate-800/80 px-5 py-4 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: DivProps) {
  return (
    <h3
      className={[
        "text-sm font-semibold tracking-tight text-slate-100 sm:text-base",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: DivProps) {
  return (
    <p
      className={[
        "text-xs leading-5 text-slate-500 sm:text-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: DivProps) {
  return (
    <div
      className={[
        "px-5 py-5 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: DivProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 border-t border-slate-800/80 px-5 py-4 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
