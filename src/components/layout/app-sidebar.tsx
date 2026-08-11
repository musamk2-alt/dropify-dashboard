"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp, ExternalLink, Sparkles } from "lucide-react";

import {
  accountNavigation,
  dashboardNavigation,
  type DashboardNavigationItem,
} from "@/lib/navigation";

interface AppSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

function isItemActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/dashboard";
  }

  return pathname.startsWith(href);
}

function NavigationItem({
  item,
  pathname,
  onNavigate,
}: {
  item: DashboardNavigationItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isItemActive(pathname, item.href);

  if (!item.available) {
    return (
      <div
        title="Coming during the dashboard redesign"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-600"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />

        <span className="flex-1">{item.label}</span>

        <span className="rounded-md border border-slate-800 bg-slate-900/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-violet-500/12 text-violet-100"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-[18px] w-[18px]",
          active
            ? "text-violet-400"
            : "text-slate-500 group-hover:text-slate-300",
        ].join(" ")}
        strokeWidth={1.8}
      />

      <span className="flex-1 font-medium">{item.label}</span>

      {active && (
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
    </Link>
  );
}

export function AppSidebar({
  mobile = false,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "flex h-full flex-col bg-[#080b12]",
        mobile
          ? "w-full"
          : "fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-slate-800/80 lg:flex",
      ].join(" ")}
    >
      <div className="flex h-16 items-center border-b border-slate-800/80 px-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-sm font-bold text-white shadow-[0_8px_24px_rgba(139,92,246,0.22)]">
            D
          </div>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-50">
              Dropify
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-[0.17em] text-slate-600">
              Commerce control
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <div>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Workspace
          </p>

          <nav className="mt-2 space-y-1">
            {dashboardNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>

        <div className="mt-7">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Manage
          </p>

          <nav className="mt-2 space-y-1">
            {accountNavigation.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-800/80 p-3">
        <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
            <Sparkles className="h-3.5 w-3.5" />
            Dashboard redesign
          </div>

          <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
            New pages and controls will appear here as the launch dashboard is
            completed.
          </p>
        </div>

        <a
          href="mailto:support@dropifybot.com"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
        >
          <CircleHelp className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span className="flex-1">Support</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </aside>
  );
}
