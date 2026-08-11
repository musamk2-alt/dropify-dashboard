"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Radio,
} from "lucide-react";

import { MobileNavigation } from "./mobile-navigation";

interface DashboardNavbarProps {
  login?: string | null;
  displayName?: string | null;
  loggingOut?: boolean;
  onLogout?: () => void;
}

function getPageInformation(
  pathname: string
) {
  if (
    pathname === "/drops" ||
    pathname.startsWith("/drops/")
  ) {
    return {
      title: "Drops",
      description:
        "Review viewer and global discount activity.",
    };
  }

  if (
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/")
  ) {
    return {
      title: "Analytics",
      description:
        "Understand redemptions and attributed performance.",
    };
  }

  if (
    pathname === "/campaign" ||
    pathname.startsWith("/campaign/")
  ) {
    return {
      title: "Campaign",
      description:
        "Configure DropifyBot discount behavior.",
    };
  }

  if (
    pathname === "/connections" ||
    pathname.startsWith("/connections/")
  ) {
    return {
      title: "Connections",
      description:
        "Manage Twitch and Shopify integrations.",
    };
  }

  if (
    pathname === "/billing" ||
    pathname.startsWith("/billing/")
  ) {
    return {
      title: "Billing",
      description:
        "Manage your DropifyBot plan, usage and subscription.",
    };
  }

  if (
    pathname === "/account" ||
    pathname.startsWith("/account/")
  ) {
    return {
      title: "Account",
      description:
        "Review your DropifyBot account and identity.",
    };
  }

  return {
    title: "Overview",
    description:
      "Monitor drops, revenue and connection health.",
  };
}

function getInitials(
  login?: string | null,
  displayName?: string | null
) {
  const source = displayName || login || "D";

  const parts = source
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function DashboardNavbar({
  login,
  displayName,
  loggingOut = false,
  onLogout,
}: DashboardNavbarProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const pageInformation =
    getPageInformation(pathname);

  const connected = Boolean(login);
  const initials = getInitials(login, displayName);
  const accountName = displayName || login || "Streamer";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-slate-800/80 bg-[#070a10]/95 backdrop-blur-xl lg:left-60">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 transition hover:border-slate-700 hover:text-white lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-100 sm:text-base">
                {pageInformation.title}
              </h1>

              <p className="hidden truncate text-xs text-slate-500 sm:block">
                {pageInformation.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className={[
                "hidden items-center gap-2 rounded-lg border px-3 py-2 text-xs sm:flex",
                connected
                  ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                  : "border-slate-800 bg-slate-950 text-slate-500",
              ].join(" ")}
            >
              <Radio className="h-3.5 w-3.5" />
              {connected ? "Account connected" : "Not connected"}
            </div>

            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-500 transition hover:border-slate-700 hover:text-slate-200"
            >
              <Bell className="h-[17px] w-[17px]" strokeWidth={1.8} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((current) => !current)}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1.5 pr-2 text-left transition hover:border-slate-700"
                aria-expanded={accountOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/15 text-[10px] font-bold text-violet-300">
                  {initials}
                </span>

                <span className="hidden max-w-36 min-w-0 sm:block">
                  <span className="block truncate text-xs font-medium text-slate-200">
                    {accountName}
                  </span>

                  <span className="block truncate text-[10px] text-slate-600">
                    {login ? `@${login}` : "Not signed in"}
                  </span>
                </span>

                <ChevronDown className="h-3.5 w-3.5 text-slate-600" />
              </button>

              {accountOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />

                  <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border border-slate-800 bg-[#0b0f17] p-1.5 shadow-2xl">
                    <div className="border-b border-slate-800 px-3 py-2.5">
                      <p className="truncate text-xs font-medium text-slate-200">
                        {accountName}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-slate-600">
                        {login ? `@${login}` : "No active session"}
                      </p>
                    </div>

                    {onLogout && connected && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          onLogout();
                        }}
                        disabled={loggingOut}
                        className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <LogOut className="h-4 w-4" />
                        {loggingOut ? "Signing out…" : "Sign out"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileNavigation
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
    </>
  );
}
