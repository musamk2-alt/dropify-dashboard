"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type PlanLimits = {
  viewerDropsPerMonth: number | null;
  globalDropsPerMonth: number | null;
};

type PlanUsage = {
  viewerDropsThisMonth: number;
  globalDropsThisMonth: number;
};

type PlanPeriod = {
  monthStart: string;
  monthEnd: string;
  now: string;
};

type PlanResponse = {
  ok: boolean;
  plan: string;
  limits: PlanLimits;
  usage: PlanUsage;
  period: PlanPeriod;
};

interface PlanUsageCardProps {
  login: string;
}

function formatMonthRange(period: PlanPeriod | null): string {
  if (!period) return "";
  const start = new Date(period.monthStart);
  const end = new Date(period.monthEnd);
  const month = start.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });
  const endDay = end.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
  return `${month} · resets ${endDay}`;
}

function pct(used: number, limit: number | null): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default function PlanUsageCard({ login }: PlanUsageCardProps) {
  const [data, setData] = useState<PlanResponse | null>(null);
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

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }

        const json = (await res.json()) as PlanResponse;

        if (!json.ok) {
          throw new Error((json as any).error || "Failed to load plan usage.");
        }

        setData(json);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[PlanUsageCard] error:", err);
        setError("Could not load plan usage.");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [login]);

  const plan = data?.plan || "free";
  const limits = data?.limits || {
    viewerDropsPerMonth: null,
    globalDropsPerMonth: null,
  };
  const usage = data?.usage || {
    viewerDropsThisMonth: 0,
    globalDropsThisMonth: 0,
  };

  const viewerPct = pct(usage.viewerDropsThisMonth, limits.viewerDropsPerMonth);
  const globalPct = pct(usage.globalDropsThisMonth, limits.globalDropsPerMonth);

  const monthLabel = formatMonthRange(data?.period || null);

  const hitLimitViewer =
    !!limits.viewerDropsPerMonth &&
    usage.viewerDropsThisMonth >= limits.viewerDropsPerMonth;
  const hitLimitGlobal =
    !!limits.globalDropsPerMonth &&
    usage.globalDropsThisMonth >= limits.globalDropsPerMonth;

  const nearLimit =
    !hitLimitViewer &&
    !hitLimitGlobal &&
    (viewerPct >= 80 || globalPct >= 80);

  let statusText: string | null = null;
  if (hitLimitViewer || hitLimitGlobal) {
    statusText = `This channel hit its ${plan} plan monthly drop limit.`;
  } else if (nearLimit) {
    statusText = `You're close to your ${plan} plan limits for this month.`;
  }

  const planLabel =
    plan === "creator"
      ? "Creator"
      : plan === "pro"
      ? "Pro"
      : plan === "free"
      ? "Free"
      : plan;

  const limitLabel = (limit: number | null) =>
    !limit || limit <= 0 ? "No limit" : `${limit.toLocaleString()} / month`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm sm:text-base">
              Plan & usage
            </CardTitle>
            <CardDescription className="text-[11px]">
              Monthly viewer & global drops for your current plan.
              {monthLabel && <span> {monthLabel}</span>}
            </CardDescription>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-slate-200">
            {planLabel}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {loading && (
          <p className="text-xs text-slate-400">Loading plan usage…</p>
        )}

        {!loading && error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {!loading && !error && data && (
          <>
            {/* Viewer drops */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">
                  Viewer drops
                </span>
                <span className="text-slate-400">
                  {usage.viewerDropsThisMonth.toLocaleString()} used ·{" "}
                  {limitLabel(limits.viewerDropsPerMonth)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-900/90">
                <div
                  className={`h-full rounded-full transition-all ${
                    hitLimitViewer
                      ? "bg-red-500"
                      : viewerPct >= 80
                      ? "bg-amber-400"
                      : "bg-violet-500"
                  }`}
                  style={{
                    width: limits.viewerDropsPerMonth ? `${viewerPct}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Global drops */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200">Global drops</span>
                <span className="text-slate-400">
                  {usage.globalDropsThisMonth.toLocaleString()} used ·{" "}
                  {limitLabel(limits.globalDropsPerMonth)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-900/90">
                <div
                  className={`h-full rounded-full transition-all ${
                    hitLimitGlobal
                      ? "bg-red-500"
                      : globalPct >= 80
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: limits.globalDropsPerMonth ? `${globalPct}%` : "0%",
                  }}
                />
              </div>
            </div>

            {statusText && (
              <p className="text-[11px] text-slate-300">{statusText}</p>
            )}

            <p className="text-[11px] text-slate-500">
              Need more drops or higher limits? Upgrade your plan on{" "}
              <a
                href="https://dropifybot.com/#pricing"
                target="_blank"
                rel="noreferrer"
                className="text-violet-300 hover:text-violet-200"
              >
                dropifybot.com
              </a>
              .
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
