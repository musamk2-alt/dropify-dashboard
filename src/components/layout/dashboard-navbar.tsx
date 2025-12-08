"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavbarProps {
  login?: string | null;
  displayName?: string | null;
}

const navItems = [
  {
    href: "/",
    label: "Dashboard",
  },
  // Later, when you build them:
  // { href: "/drops", label: "Drops" },
  // { href: "/analytics", label: "Analytics" },
  // { href: "/settings", label: "Settings" },
];

function getInitials(login?: string | null, displayName?: string | null) {
  const source = displayName || login || "";
  if (!source) return "D";

  const parts = source.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
  );
}

export function DashboardNavbar({ login, displayName }: DashboardNavbarProps) {
  const pathname = usePathname();

  const channelText = login ? `@${login}` : "Not connected";
  const initials = getInitials(login, displayName);

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-900/80 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Left: logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-emerald-400 text-sm font-semibold text-white shadow-lg shadow-violet-500/40">
            D
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-50">
              Dropify <span className="font-normal text-slate-400">bot</span>
            </span>
          </div>
        </div>

        {/* Center: nav pills (only Dashboard for now) */}
        <nav className="hidden rounded-full bg-slate-900/80 p-1 text-xs sm:flex sm:text-sm">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/" || pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "rounded-full px-4 py-1.5 transition",
                  isActive
                    ? "bg-slate-50 text-slate-900 shadow-sm"
                    : "text-slate-300 hover:text-slate-100",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: connected as */}
        <div className="flex items-center gap-3">
          <div className="hidden flex-col text-right text-[11px] leading-tight text-slate-400 sm:flex">
            <span>Connected as</span>
            <span className="font-mono text-slate-100">{channelText}</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-100">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
