import * as React from "react";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Provides the dark background, gradients and basic layout for the dashboard.
 * Use this at the top of your /dashboard pages.
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      {/* Background gradients / glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500/25 via-indigo-500/15 to-emerald-400/25 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[-8rem] h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-purple-600/25 blur-3xl" />
      </div>

      <div className="min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
