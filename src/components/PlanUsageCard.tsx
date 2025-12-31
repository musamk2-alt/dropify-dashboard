"use client";

import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

interface PlanUsageCardProps {
  login: string | null;
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

type CheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

export default function PlanUsageCard({ login }: PlanUsageCardProps) {
  const [data, setData] = useState<PlanApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    const safeLogin = (login ?? "").toLowerCase();
    if (!safeLogin) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `${API_URL}/api/plan/${encodeURIComponent(safeLogin)}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Failed to load usage");
        const json = (await res.json()) as PlanApiResponse;

        if (!json.ok) throw new Error(json.error || "Bad response");

        setData(json);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
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

  // If no limit, show a full bar if there's usage (so it doesn’t look “empty”)
  const viewerPct =
    viewerLimit && viewerLimit > 0
      ? Math.min(100, Math.round((viewerUsed / viewerLimit) * 100))
      : viewerUsed > 0
      ? 100
      : 0;

  const globalPct =
    globalLimit && globalLimit > 0
      ? Math.min(100, Math.round((globalUsed / globalLimit) * 100))
      : globalUsed > 0
      ? 100
      : 0;

  async function handleUpgrade(plan: "pro" | "creator" = "pro") {
    const safeLogin = (login ?? "").toLowerCase();
    if (!safeLogin) return;

    try {
      setUpgradeLoading(true);
      setUpgradeError(null);

      const res = await fetch(`${API_URL}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: safeLogin,
          plan, // "pro" or "creator"
        }),
      });

      const json = (await res.json()) as CheckoutResponse;

      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || "Failed to start checkout.");
      }

      window.location.href = json.url;
    } catch (err: any) {
      console.error("Upgrade error:", err);
      setUpgradeError(err?.message || "Upgrade failed.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  const planLabel = data?.plan ? data.plan : "—";

  return (
    <div className="w-full rounded-xl border border-white/5 bg-slate-950/70 px-5 py-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Plan & usage this month
          </p>
          <p className="mt-1 text-[12px] text-slate-300">
            Track your monthly usage for viewer & global drops.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200">
            {planLabel === "free_beta" ? "Free" : planLabel}
          </span>

          {/* Stripe Upgrade CTA */}
          <button
            type="button"
            onClick={() => handleUpgrade("pro")}
            disabled={!login || upgradeLoading}
            className={[
              "inline-flex items-center justify-center rounded-lg px-3 py-2 text-[11px] font-medium transition",
              "bg-violet-600/20 text-violet-200 hover:bg-violet-600/30",
              "disabled:opacity-60 disabled:hover:bg-violet-600/20",
            ].join(" ")}
            title="Upgrade your plan"
          >
            {upgradeLoading ? "Redirecting…" : "Upgrade"}
          </button>
        </div>
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

          {/* thicker bar */}
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-900">
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

          {/* thicker bar */}
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-900">
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
          View plans
        </a>
      </div>

      {loading && (
        <p className="mt-2 text-[11px] text-slate-400">Loading usage…</p>
      )}
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}

      {upgradeError && (
        <p className="mt-2 text-[11px] text-red-400">{upgradeError}</p>
      )}
    </div>
  );
}
