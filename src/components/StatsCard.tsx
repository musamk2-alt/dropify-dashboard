"use client";

import Link from "next/link";

import {
  ArrowRight,
  BarChart3,
  Clock3,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

import React from "react";

import type { Stats } from "@/app/page";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

interface StatsCardProps {
  login: string | null;
  stats: Stats | null;
  loading: boolean;
  refreshing: boolean;
  refreshMessage: string | null;
  refreshError: boolean;
  onRefresh: () => void;
}

function formatNumber(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 0,
    }
  );
}

function formatMoney(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toLocaleString(
    undefined,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatSync(
  value:
    | string
    | null
) {
  if (!value) {
    return "Not synced yet";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not synced yet";
  }

  const minutes =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          date.getTime()
        ) /
          60_000
      )
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
}

const StatsCard:
  React.FC<StatsCardProps> = ({
    login,
    stats,
    loading,
    refreshing,
    refreshMessage,
    refreshError,
    onRefresh,
  }) => {
    return (
      <Card className="self-start overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
              <BarChart3 className="h-4 w-4" />
            </div>

            <div>
              <CardTitle className="text-sm sm:text-base">
                Analytics pulse
              </CardTitle>

              <CardDescription className="mt-0.5 text-[11px]">
                Latest synchronized Shopify performance.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
            <Clock3 className="h-3 w-3" />

            <span>
              {formatSync(
                stats?.lastSyncedAt ||
                  null
              )}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {refreshMessage && (
            <div
              className={[
                "rounded-xl border px-3 py-2.5 text-[10px]",
                refreshError
                  ? "border-red-500/20 bg-red-500/[0.05] text-red-300"
                  : "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300",
              ].join(" ")}
            >
              {refreshMessage}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map(
                (index) => (
                  <div
                    key={index}
                    className="h-[86px] animate-pulse rounded-xl border border-slate-800 bg-slate-950/40"
                  />
                )
              )}
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <PulseMetric
                  icon={
                    <MousePointerClick className="h-4 w-4" />
                  }
                  label="Lifetime uses"
                  value={
                    formatNumber(
                      stats.totalUsageCount
                    )
                  }
                />

                <PulseMetric
                  icon={
                    <TrendingUp className="h-4 w-4" />
                  }
                  label="Lifetime revenue"
                  value={
                    formatMoney(
                      stats.totalAttributedRevenue
                    )
                  }
                />

                <PulseMetric
                  icon={
                    <MousePointerClick className="h-4 w-4" />
                  }
                  label="Uses today"
                  value={
                    formatNumber(
                      stats.usageCountToday
                    )
                  }
                />

                <PulseMetric
                  icon={
                    <TrendingUp className="h-4 w-4" />
                  }
                  label="Revenue today"
                  value={
                    formatMoney(
                      stats.attributedRevenueToday
                    )
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-3">
                <p className="text-[10px] leading-5 text-slate-600">
                  Shopify usage can update asynchronously. These values reflect the latest successful analytics sync.
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-5 text-center">
              <p className="text-sm font-medium text-slate-300">
                No analytics yet
              </p>

              <p className="mt-1 text-[11px] text-slate-600">
                Analytics appear after Shopify discount activity is synchronized.
              </p>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={
                onRefresh
              }
              disabled={
                !login ||
                refreshing ||
                loading
              }
              className="inline-flex items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-2.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing
                ? "Syncing…"
                : "Refresh analytics"}
            </button>

            <Link
              href="/analytics"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-100"
            >
              View analytics

              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

function PulseMetric({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
      <div className="flex items-center gap-2 text-slate-600">
        {icon}

        <span className="text-[9px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>

      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default StatsCard;
