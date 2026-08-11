"use client";

import { X } from "lucide-react";

import { AppSidebar } from "./app-sidebar";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNavigation({
  open,
  onClose,
}: MobileNavigationProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div className="relative h-full w-[min(86vw,19rem)] border-r border-slate-800 bg-[#080b12] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <AppSidebar
          mobile
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
