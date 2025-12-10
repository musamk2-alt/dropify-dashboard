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

type Stats = {
  dropsLast24h: number;
  redemptionsLast24h: number;
  estimatedRevenueLast24h: number;
  totalDropsLifetime: number;
  totalRedemptionsLifetime: number;
  conversionRateLast24h: number;
  lastUpdated?: string;
};

interface StatsCardProps {
  login: string | null;
}

function formatPercent(value: number) {
  if (!isFinite(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number) {
  if (!value || !isFinite(value)) return "—";
  // Keep it generic since stores can be any currency
  return value.toFixed(2);
}

const StatsCard: React.FC<StatsCardProps> = ({ login }) => {
  const [stats, setStats] = useState<Stats | null>(null);
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
          `${API_URL}/api/stats/${encodeURIComponent(login || "")}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error (${res.status}): ${text}`);
        }

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed to load stats");

        setStats(data.stats || null);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[StatsCard] Failed to load", err);
        setError("Failed to load stats.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [login]);

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
              How viewers are turning into orders.
            </CardDescription>
          </div>
        </div>
        {stats?.lastUpdated && (
          <span className="text-[10px] text-slate-500">
            Updated{" "}
            {new Date(stats.lastUpdated).toLocaleTimeString(undefined, {
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

        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && !stats && (
          <p className="text-sm text-slate-400">
            No data yet. Connect Shopify and let viewers try{" "}
            <code className="text-[10px]">!discount</code> during your next
            stream.
          </p>
        )}

        {!loading && !error && stats && (
          <>
            {/* Top row: today focus */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Drops today
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {stats.dropsLast24h}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Viewers who asked for a code.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Orders with Dropify
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {stats.redemptionsLast24h}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Shopify orders using your codes.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Conversion rate
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-50">
                  {formatPercent(stats.conversionRateLast24h)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Orders / drops in the last 24h.
                </div>
              </div>
            </div>

            {/* Second row: lifetime view */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Lifetime drops
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {stats.totalDropsLifetime}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Codes Dropify has created.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Lifetime orders
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {stats.totalRedemptionsLifetime}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Orders using Dropify discounts.
                </div>
              </div>

              <div className="rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 uppercase tracking-wide">
                  Discount value (24h)
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-50">
                  {formatCurrency(stats.estimatedRevenueLast24h)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500">
                  Total discount given in the last 24h.
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Dropify tracks how often viewers claim codes (
              <code className="text-[10px]">!discount</code>) and how often
              those codes turn into Shopify orders. Use this card to see if
              your drops are actually driving sales.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;
