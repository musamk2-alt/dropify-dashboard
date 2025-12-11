"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import type { Stats } from "@/app/page";

interface StatsCardProps {
  login: string | null;
  stats: Stats | null;
  loading: boolean;
}

function formatPercent(value: number) {
  if (!isFinite(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number) {
  if (!isFinite(value)) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatCurrency(value: number) {
  if (!value || !isFinite(value)) return "—";
  return value.toFixed(2);
}

const StatsCard: React.FC<StatsCardProps> = ({ login, stats, loading }) => {
  const hasData = !!stats;

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-xs font-bold text-white shadow-lg shadow-emerald-500/40">
            📊
          </span>
          <div>
            <CardTitle className="text-sm sm:text-base">
              Stream performance
            </CardTitle>
            <CardDescription className="text-[11px]">
              How your drops are turning into orders.
            </CardDescription>
          </div>
        </div>
        {stats?.period?.now && (
          <span className="text-[10px] text-slate-500">
            Updated{" "}
            {new Date(stats.period.now).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {loading && (
          <p className="text-sm text-slate-400">Loading stats…</p>
        )}

        {!loading && !hasData && (
          <p className="text-sm text-slate-400">
            No stats yet for{" "}
            <span className="font-mono text-[11px] text-slate-100">
              {login || "this channel"}
            </span>
            . Once viewers start using{" "}
            <code className="text-[10px]">!discount</code> and those codes are
            redeemed on Shopify, we&apos;ll show performance here.
          </p>
        )}

        {!loading && hasData && stats && (
          <>
            {/* Today focus */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Drops today
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {formatNumber(stats.dropsToday)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Viewers who claimed a code.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Orders today
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {formatNumber(stats.redemptionsToday)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Shopify orders using Dropify codes.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Conversion rate
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {formatPercent(stats.redemptionRate)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Orders / drops for today.
                </div>
              </div>
            </div>

            {/* Value view */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Discount given today
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {formatCurrency(stats.discountValueToday)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Total discount value applied today.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Revenue influenced (24h)
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {formatCurrency(stats.revenue24h)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Total discount value in the last 24 hours.
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Dropify tracks how often viewers claim codes (
              <code className="text-[10px]">!discount</code>) and how often
              those codes turn into Shopify orders. Use this to see if your
              drops are actually driving sales, not just chat spam.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
