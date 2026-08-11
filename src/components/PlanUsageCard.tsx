"use client";

import { getErrorMessage, isAbortError } from "@/lib/error-utils";
import { apiFetch } from "@/lib/api-fetch";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

interface PlanUsageCardProps {
  login: string | null;
}

type PlanApiResponse = {
  ok: boolean;
  plan: string;

  // Billing + lifecycle state.
  hasBillingAccount?: boolean;
  hasSubscription?: boolean;
  billingStatus?: string;
  pendingPlan?: string | null;
  currentPeriodEnd?: string | null;

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

type PortalResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function daysUntil(nowIso?: string, endIso?: string) {
  if (!nowIso || !endIso) return null;
  const now = new Date(nowIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(now) || !Number.isFinite(end)) return null;
  const diffMs = end - now;
  if (diffMs <= 0) return 0;
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return days;
}

export default function PlanUsageCard({ login }: PlanUsageCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PlanApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  const safeLogin = useMemo(() => (login ?? "").toLowerCase(), [login]);

  const fetchUsage = useCallback(
    async (signal?: AbortSignal) => {
      if (!safeLogin) return;

      const res = await apiFetch(
        `${API_URL}/api/plan/${encodeURIComponent(safeLogin)}`,
        { signal }
      );

      if (!res.ok) throw new Error("Failed to load usage");
      const json = (await res.json()) as PlanApiResponse;

      if (!json.ok) throw new Error(json.error || "Bad response");
      setData(json);
    },
    [safeLogin]
  );

  // Initial load + when login changes
  useEffect(() => {
    if (!safeLogin) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        await fetchUsage(controller.signal);
      } catch (err: unknown) {
        if (!isAbortError(err)) {
          console.error("Plan usage error:", err);
          setError("Failed to load usage.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [safeLogin, fetchUsage]);

  // 🔁 Auto-refresh after Stripe success + remove ?upgrade=success from URL
  useEffect(() => {
    if (!safeLogin) return;

    const upgrade = searchParams?.get("upgrade");
    if (upgrade !== "success") return;

    const controller = new AbortController();

    (async () => {
      try {
        await fetchUsage(controller.signal);
      } catch (e) {
        console.error("Auto-refresh after upgrade failed:", e);
      }

      try {
        const current = new URL(window.location.href);
        current.searchParams.delete("upgrade");
        router.replace(`${current.pathname}?${current.searchParams.toString()}`);
      } catch {}
    })();

    return () => controller.abort();
  }, [safeLogin, searchParams, fetchUsage, router]);

  const limits = data?.limits;
  const usage = data?.usage;

  const viewerLimit = limits?.viewerDropsPerMonth ?? null;
  const globalLimit = limits?.globalDropsPerMonth ?? null;

  const viewerUsed = usage?.viewerDropsThisMonth ?? 0;
  const globalUsed = usage?.globalDropsThisMonth ?? 0;

  const viewerPct =
    viewerLimit && viewerLimit > 0
      ? clamp(Math.round((viewerUsed / viewerLimit) * 100), 0, 100)
      : viewerUsed > 0
      ? 100
      : 0;

  const globalPct =
    globalLimit && globalLimit > 0
      ? clamp(Math.round((globalUsed / globalLimit) * 100), 0, 100)
      : globalUsed > 0
      ? 100
      : 0;

  const resetsInDays = useMemo(() => {
    return daysUntil(data?.period?.now, data?.period?.monthEnd);
  }, [data?.period?.now, data?.period?.monthEnd]);

  const pendingPlan = (data?.pendingPlan ?? null) ? String(data?.pendingPlan).toLowerCase() : null;
  const pendingDays = useMemo(() => {
    if (!data?.period?.now || !data?.currentPeriodEnd) return null;
    return daysUntil(data.period.now, data.currentPeriodEnd);
  }, [data?.period?.now, data?.currentPeriodEnd]);

  // 🔔 80% warning (only if there is a numeric limit)
  const warnings = useMemo(() => {
    const list: { kind: "viewer" | "global"; pct: number; used: number; limit: number }[] = [];

    if (viewerLimit !== null && viewerLimit > 0) {
      const pct = (viewerUsed / viewerLimit) * 100;
      if (pct >= 80) list.push({ kind: "viewer", pct: Math.round(pct), used: viewerUsed, limit: viewerLimit });
    }

    if (globalLimit !== null && globalLimit > 0) {
      const pct = (globalUsed / globalLimit) * 100;
      if (pct >= 80) list.push({ kind: "global", pct: Math.round(pct), used: globalUsed, limit: globalLimit });
    }

    return list;
  }, [viewerLimit, globalLimit, viewerUsed, globalUsed]);

  async function handleUpgrade(plan: "pro" | "creator") {
    if (!safeLogin) return;

    try {
      setUpgradeLoading(true);
      setUpgradeError(null);

      const res = await apiFetch(`${API_URL}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: safeLogin,
          plan,
        }),
      });

      const json = (await res.json()) as CheckoutResponse;

      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || "Failed to start checkout.");
      }

      window.location.href = json.url;
    } catch (err: unknown) {
      console.error("Upgrade error:", err);
      setUpgradeError(
        getErrorMessage(
          err,
          "Upgrade failed."
        )
      );
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleManageBilling() {
    if (!safeLogin) return;

    try {
      setBillingLoading(true);
      setBillingError(null);

      const res = await apiFetch(`${API_URL}/api/stripe/create-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: safeLogin }),
      });

      const json = (await res.json()) as PortalResponse;

      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || "Failed to open billing portal.");
      }

      window.location.href = json.url;
    } catch (err: unknown) {
      console.error("Billing portal error:", err);
      setBillingError(
        getErrorMessage(
          err,
          "Billing portal failed."
        )
      );
    } finally {
      setBillingLoading(false);
    }
  }

  const planLabel = data?.plan ? data.plan : "—";
  const normalizedPlan = (data?.plan || "").toLowerCase();
  const isProOrAbove = normalizedPlan === "pro" || normalizedPlan === "creator";
  const isCreator = normalizedPlan === "creator";

  const hasBillingAccount =
    Boolean(
      data?.hasBillingAccount
    );

  const showPendingBanner =
    !!pendingPlan &&
    pendingPlan !== normalizedPlan &&
    (pendingDays !== null || !!data?.currentPeriodEnd);

  return (
    <div className="w-full rounded-xl border border-white/5 bg-slate-950/70 px-5 py-4">
      {/* 🕒 Pending plan change banner */}
      {showPendingBanner && (
        <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-[12px] font-medium text-sky-200">
            Plan change scheduled.
          </p>
          <p className="mt-1 text-[11px] text-sky-100/90">
            Your plan will change to{" "}
            <span className="font-medium">{pendingPlan}</span>
            {pendingDays !== null ? (
              <> in <span className="font-medium">{pendingDays}</span> day{pendingDays === 1 ? "" : "s"}.</>
            ) : (
              <> at the end of your billing period.</>
            )}
          </p>
        </div>
      )}

      {/* 🔔 80% warning banner */}
      {warnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-[12px] font-medium text-amber-200">
            You’re close to your monthly limit.
          </p>
          <div className="mt-1 space-y-1 text-[11px] text-amber-100/90">
            {warnings.map((w) => (
              <div key={w.kind} className="flex items-center justify-between gap-3">
                <span className="capitalize">
                  {w.kind} drops: <span className="font-medium">{w.used}/{w.limit}</span>
                </span>
                <span className="font-medium">{w.pct}%</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-amber-100/80">
              {resetsInDays !== null ? `Resets in ${resetsInDays} day${resetsInDays === 1 ? "" : "s"}` : ""}
            </span>
            <a
              href="https://dropifybot.com#pricing"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium text-amber-200 hover:text-amber-100"
            >
              Upgrade for higher limits
            </a>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Plan & usage this month
          </p>
          <p className="mt-1 text-[12px] text-slate-300">
            Track your monthly usage for viewer & global drops.
            {resetsInDays !== null && (
              <span className="ml-2 text-slate-400">
                • Resets in {resetsInDays} day{resetsInDays === 1 ? "" : "s"}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-200">
            {planLabel === "free_beta" ? "Free" : planLabel}
          </span>

          {/* Stripe controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleUpgrade("pro")}
              disabled={!login || upgradeLoading || isProOrAbove}
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-2 text-[11px] font-medium transition",
                "bg-violet-600/20 text-violet-200 hover:bg-violet-600/30",
                "disabled:opacity-60 disabled:hover:bg-violet-600/20",
              ].join(" ")}
              title={isProOrAbove ? "You already have Pro or higher" : "Upgrade to Pro"}
            >
              {upgradeLoading ? "Redirecting…" : "Pro"}
            </button>

            <button
              type="button"
              onClick={() => handleUpgrade("creator")}
              disabled={!login || upgradeLoading || isCreator}
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-2 text-[11px] font-medium transition",
                "bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30",
                "disabled:opacity-60 disabled:hover:bg-emerald-600/20",
              ].join(" ")}
              title={isCreator ? "You already have Creator" : "Upgrade to Creator"}
            >
              {upgradeLoading ? "Redirecting…" : "Creator"}
            </button>

            <button
              type="button"
              onClick={handleManageBilling}
              disabled={
                !login ||
                billingLoading ||
                !hasBillingAccount
              }
              className={[
                "inline-flex items-center justify-center rounded-lg px-3 py-2 text-[11px] font-medium transition",
                "bg-slate-800/60 text-slate-200 hover:bg-slate-800",
                "disabled:opacity-60 disabled:hover:bg-slate-800/60",
              ].join(" ")}
              title={
                hasBillingAccount
                  ? "Manage billing"
                  : "No Stripe billing account is linked"
              }
            >
              {billingLoading ? "Opening…" : "Manage"}
            </button>
          </div>
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

          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
              style={{ width: `${viewerPct}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Personal codes viewers claim with{" "}
            <code className="font-mono text-[10px] text-slate-200">!discount</code>.
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

          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
              style={{ width: `${globalPct}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            Stream-wide codes you trigger with{" "}
            <code className="font-mono text-[10px] text-slate-200">!drop 10</code>.
          </p>
        </div>
      </div>

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

      {loading && <p className="mt-2 text-[11px] text-slate-400">Loading usage…</p>}
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {upgradeError && <p className="mt-2 text-[11px] text-red-400">{upgradeError}</p>}
      {billingError && <p className="mt-2 text-[11px] text-red-400">{billingError}</p>}
    </div>
  );
}
