import type { ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.018)_1px,transparent_1px)] bg-[size:32px_32px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-60 top-0 hidden h-80 w-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_68%)] lg:block"
      />

      <AppSidebar />

      <div className="relative min-h-screen">
        {children}
      </div>
    </div>
  );
}
