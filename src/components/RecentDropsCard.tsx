"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type Drop = {
  id: string;
  kind?: "viewer" | "global";
  viewerLogin: string;
  viewerDisplayName?: string;
  discountCode: string;
  discountType?: string | null;
  discountValue?: number | null;
  createdAt: string;
};

interface RecentDropsCardProps {
  login: string;
  limit?: number;
  kind?: "viewer" | "global" | "all";
  title?: string;
}

function formatDateTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const tabs = [
  { id: "all" as const, label: "All" },
  { id: "global" as const, label: "Global" },
  { id: "viewer" as const, label: "Viewer" },
];

const RecentDropsCard: React.FC<RecentDropsCardProps> = ({
  login,
  limit = 10,
  kind = "all",
  title,
}) => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter for pill switch
  const [filter, setFilter] = useState<"all" | "viewer" | "global">("all");

  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = `${API_URL}/api/drops/${encodeURIComponent(
          login
        )}/recent?limit=${limit}`;

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error (${res.status}): ${text}`);
        }

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed to load drops");

        setDrops(data.drops || []);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[RecentDropsCard] Failed to load", err);
        setError("Failed to load recent drops.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [login, limit]);

  // Apply filter
  const filteredDrops =
    filter === "all" ? drops : drops.filter((d) => d.kind === filter);

  const effectiveTitle =
    title ||
    (kind === "viewer"
      ? "Recent drops"
      : kind === "global"
      ? "Recent global drops"
      : "Recent drops");

  const activeIndex =
    tabs.findIndex((t) => t.id === filter) === -1
      ? 0
      : tabs.findIndex((t) => t.id === filter);

  const highlightWidth = 100 / tabs.length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/90 text-xs font-bold text-white shadow-lg shadow-violet-500/40">
            🎁
          </span>
          <CardTitle className="text-sm sm:text-base">
            {effectiveTitle}
          </CardTitle>
        </div>
        <CardDescription className="text-[11px]">
          Showing last {limit}
        </CardDescription>
      </CardHeader>

      {/* ANIMATED PILL SWITCH */}
      <div className="flex justify-center px-4 -mt-2 mb-3">
        <div className="relative inline-flex w-full max-w-xs rounded-full bg-slate-950/80 border border-slate-800/80 p-1 shadow-[0_0_0_1px_rgba(15,23,42,0.9)]">
          {/* Sliding highlight bar */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-violet-600/90 shadow-[0_0_20px_rgba(139,92,246,0.9)] transition-transform duration-300 ease-out"
            style={{
              width: `${highlightWidth}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />

          {/* Tabs */}
          <div className="relative z-10 flex w-full text-[11px] font-medium">
            {tabs.map((tab) => {
              const isActive = tab.id === filter;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 rounded-full px-3 py-1 text-center transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-slate-300 hover:text-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <CardContent className="space-y-4 text-sm">
        {loading && (
          <p className="text-sm text-slate-400">Loading recent drops…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && filteredDrops.length === 0 && (
          <p className="text-sm text-slate-400">
            {filter === "global"
              ? `No global drops yet. Trigger one with `
              : filter === "viewer"
              ? `No viewer discounts yet. Let viewers try `
              : `No drops yet. Let viewers try `}
            <code className="text-[10px]">
              {filter === "global" ? "!drop 10" : "!discount"}
            </code>
            .
          </p>
        )}

        {!loading && !error && filteredDrops.length > 0 && (
          <div className="space-y-3">
            {filteredDrops.map((d, idx) => {
              const isGlobal = d.kind === "global";

              return (
                <div
                  key={d.id}
                  className={`rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-3 transition-all duration-200 hover:border-violet-500/70 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.8)] ${
                    idx === 0
                      ? "shadow-[0_0_0_1px_rgba(139,92,246,0.35)]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {/* Top row: name + time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-200">
                          {isGlobal
                            ? "Global drop"
                            : d.viewerDisplayName || d.viewerLogin}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                            isGlobal
                              ? "border border-violet-500/70 bg-violet-900/70 text-violet-200"
                              : "bg-slate-900 text-slate-400"
                          }`}
                        >
                          {isGlobal ? "Global" : "Viewer"}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {formatDateTime(d.createdAt)}
                      </span>
                    </div>

                    {!isGlobal && (
                      <div className="text-xs text-slate-500">
                        @{d.viewerLogin}
                      </div>
                    )}

                    {/* Code + discount */}
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">
                        Code
                      </div>
                      <code className="font-mono text-xs text-violet-300">
                        {d.discountCode}
                      </code>
                      {d.discountValue != null && d.discountType && (
                        <p className="text-[11px] text-slate-400">
                          {d.discountType === "percentage"
                            ? `${d.discountValue}% off`
                            : `${d.discountValue} off`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentDropsCard;
