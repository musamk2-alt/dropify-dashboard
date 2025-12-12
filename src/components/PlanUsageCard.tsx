"use client";

import React, { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

interface PlanUsageCardProps {
  login: string;
}

type PlanApiResponse = {
  ok: boolean;
  plan: string;
  limits: {
    viewerDropsPerMonth: number | null;
    globalDropsPerMonth: number | null;
  };
  usage: {
    viewerDropsThisMonth: number;
    globalDropsThisMonth: number;
  };
  period: {
    monthStart: string;
    monthEnd: string;
    now: string;
  };
  error?: string;
};

export default function PlanUsageCard({ login }: PlanUsageCardProps) {
  const [data, setData] = useState<PlanApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/plan/${encodeURIComponent(login)}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to load usage");
        const json = (await res.json()) as PlanApiResponse;

        if (!json.ok) throw new Error(json.error || "Bad response");

        setData(json);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Plan usage error:", err);
          setError("Failed to load usage.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [login]);

  const limits = data?.limits;
  const usage = data?.usage;

  const viewerLimit = limits?.viewerDropsPerMonth ?? null;
  const globalLimit = limits?.globalDropsPerMonth ?? null;

  const viewerUsed = usage?.viewerDropsThisMonth ?? 0;
  const globalUsed = usage?.globalDropsThisMonth ?? 0;

  const viewerPct =
    viewerLimit && viewerLimit > 0
      ? Math.min(100, Math.round((viewerUsed / viewerLimit) * 100))
      : 0;

  const globalPct =
    globalLimit && globalLimit > 0
      ? Math.min(100, Math.round((globalUsed / globalLimit) * 100))
      : 0;

  return (
    <div className="w-full rounded-xl border border-white/5 bg-slate-950/70 px-5 py-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Plan & usage this month
          </p>
          <p className="mt-1 text-[12px] text-slate-300">
            Free beta plan with monthly limits on viewer & global drops.
          </p>
        </div>

        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200">
          {data?.plan === "free_beta" ? "Free" : data?.plan || "—"}
        </span>
      </div>

      <div className="my-4 h-px w-full bg-slate-800/70" />

      {/* Wide usage row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Viewer drops */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            <span>Viewer drops</span>
            <span className="text-slate-400 normal-case tracking-normal">
              {viewerLimit !== null
                ? `${viewerUsed}/${viewerLimit} used`
                : `${viewerUsed} used • No limit`}
            </span>
          </div>

          <div className="mt-2 h-3 w-full rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
              style={{ width: `${viewerPct}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Personal codes viewers claim with{" "}
            <code className="font-mono text-[10px] text-slate-200">
              !discount
            </code>
            .
          </p>
        </div>

        {/* Global drops */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            <span>Global drops</span>
            <span className="text-slate-400 normal-case tracking-normal">
              {globalLimit !== null
                ? `${globalUsed}/${globalLimit} used`
                : `${globalUsed} used • No limit`}
            </span>
          </div>

          <div className="mt-2 h-3 w-full rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
              style={{ width: `${globalPct}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Stream-wide codes you trigger with{" "}
            <code className="font-mono text-[10px] text-slate-200">
              !drop 10
            </code>
            .
          </p>
        </div>
      </div>

      {/* Footer / upgrade link */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span>Need more drops or higher limits?</span>
        <a
          href="https://dropifybot.com#pricing"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-violet-300 hover:text-violet-200"
        >
          Upgrade your plan on dropifybot.com
        </a>
      </div>

      {loading && (
        <p className="mt-2 text-[11px] text-slate-400">Loading usage…</p>
      )}
      {error && (
        <p className="mt-2 text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}
