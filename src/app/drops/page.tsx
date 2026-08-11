"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  CircleDollarSign,
  Gift,
  Info,
  ShoppingBag,
} from "lucide-react";

import ExportButton from "@/components/ExportButton";
import RecentDropsCard from "@/components/RecentDropsCard";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useStreamerSession } from "@/hooks/use-streamer-session";
import { apiFetch } from "@/lib/api-fetch";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

interface DropsPageStats {
  totalDrops: number;
  totalRedeemedCodes: number;
  totalAttributedRevenue: number;
  redemptionRate: number;
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

function formatPercent(
  value: number
) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${(
    value * 100
  ).toFixed(1)}%`;
}

function isAbortError(
  error: unknown
) {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading: boolean;
  featured?: boolean;
}

function MetricCard({
  label,
  value,
  description,
  icon,
  loading,
  featured = false,
}: MetricCardProps) {
  return (
    <div
      className={[
        "relative min-h-36 overflow-hidden rounded-2xl border p-5",
        featured
          ? "border-violet-500/30 bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(11,15,23,0.96)_60%)]"
          : "border-slate-800/90 bg-[#0b0f17]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-800" />
          ) : (
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              {value}
            </p>
          )}
        </div>

        <div
          className={[
            "flex h-9 w-9 items-center justify-center rounded-xl",
            featured
              ? "bg-violet-500/15 text-violet-300"
              : "bg-slate-900 text-slate-400",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default function DropsPage() {
  const {
    streamer,
    loading,
    error,
    authenticated,
  } =
    useStreamerSession();

  const [
    stats,
    setStats,
  ] =
    useState<DropsPageStats | null>(
      null
    );

  const [
    statsLoading,
    setStatsLoading,
  ] =
    useState(false);

  const [
    statsError,
    setStatsError,
  ] =
    useState<string | null>(
      null
    );

  const login =
    streamer?.twitchLogin ||
    null;

  useEffect(() => {
    if (!login) {
      setStats(null);
      return;
    }

    const currentLogin: string =
      login;

    const controller =
      new AbortController();

    async function loadStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}`,
            {
              signal:
                controller.signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok ||
          !data?.stats
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Unable to load drop metrics."
          );
        }

        setStats({
          totalDrops:
            Number(
              data.stats
                .totalDrops
            ) || 0,

          totalRedeemedCodes:
            Number(
              data.stats
                .totalRedeemedCodes
            ) || 0,

          totalAttributedRevenue:
            Number(
              data.stats
                .totalAttributedRevenue
            ) || 0,

          redemptionRate:
            Number(
              data.stats
                .redemptionRate
            ) || 0,
        });
      } catch (
        statsRequestError: unknown
      ) {
        if (
          isAbortError(
            statsRequestError
          )
        ) {
          return;
        }

        console.error(
          "[DROPS PAGE] Unable to load metrics:",
          statsRequestError
        );

        setStatsError(
          statsRequestError instanceof Error
            ? statsRequestError.message
            : "Unable to load drop metrics."
        );
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats();

    return () => {
      controller.abort();
    };
  }, [login]);

  return (
    <DashboardShell>
      <DashboardNavbar
        login={login}
        displayName={
          streamer?.displayName ||
          null
        }
      />

      <DashboardPage>
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-violet-400">
              <Gift className="h-4 w-4" />
              Discount activity
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Drops
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review viewer codes and global drops created through your Twitch
              channel.
            </p>
          </div>

          {login && (
            <ExportButton
              twitchLogin={login}
            />
          )}
        </section>

        {loading && (
          <section className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

            <div className="h-[34rem] animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
          </section>
        )}

        {!loading &&
          !authenticated && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                  <Gift className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-100">
                  Connect Twitch to view drops
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Sign in through the Overview page before accessing private
                  channel activity.
                </p>

                <Link
                  href="/"
                  className="mt-5 inline-flex h-9 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500"
                >
                  Return to Overview
                </Link>
              </CardContent>
            </Card>
          )}

        {!loading &&
          error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />

              <span>{error}</span>
            </div>
          )}

        {!loading &&
          login && (
            <>
              <section>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-medium text-violet-400">
                      Channel performance
                    </p>

                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
                      Drop metrics
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600">
                    Lifetime totals for{" "}
                    <span className="font-mono text-slate-400">
                      @{login}
                    </span>
                  </p>
                </div>

                {statsError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs text-amber-200">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />

                    <span>
                      {statsError}
                    </span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    featured
                    label="Total drops"
                    value={
                      formatNumber(
                        stats?.totalDrops ||
                          0
                      )
                    }
                    description="All viewer and global discount codes created."
                    loading={statsLoading}
                    icon={
                      <Gift className="h-4 w-4" />
                    }
                  />

                  <MetricCard
                    label="Redeemed codes"
                    value={
                      formatNumber(
                        stats
                          ?.totalRedeemedCodes ||
                          0
                      )
                    }
                    description="Unique codes with detected Shopify usage."
                    loading={statsLoading}
                    icon={
                      <ShoppingBag className="h-4 w-4" />
                    }
                  />

                  <MetricCard
                    label="Redemption rate"
                    value={
                      formatPercent(
                        stats
                          ?.redemptionRate ||
                          0
                      )
                    }
                    description="The share of created drops that were redeemed."
                    loading={statsLoading}
                    icon={
                      <BarChart3 className="h-4 w-4" />
                    }
                  />

                  <MetricCard
                    label="Attributed revenue"
                    value={
                      formatMoney(
                        stats
                          ?.totalAttributedRevenue ||
                          0
                      )
                    }
                    description="Revenue associated with synchronized discount usage."
                    loading={statsLoading}
                    icon={
                      <CircleDollarSign className="h-4 w-4" />
                    }
                  />
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <RecentDropsCard
                  login={login}
                  limit={50}
                  title="Drop history"
                />

                <aside className="space-y-4">
                  <Card>
                    <CardContent>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        Drop types
                      </p>

                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            Viewer drops
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Personal, single-use codes requested through{" "}
                            <code className="font-mono text-violet-300">
                              !discount
                            </code>
                            .
                          </p>
                        </div>

                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-sm font-medium text-slate-200">
                            Global drops
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Stream-wide promotions created by the broadcaster
                            with{" "}
                            <code className="font-mono text-violet-300">
                              !drop
                            </code>
                            .
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5">
                    <p className="text-sm font-medium text-violet-200">
                      Privacy-first activity
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Dropify shows discount activity without exposing Shopify
                      customer identity or complete order details.
                    </p>
                  </div>
                </aside>
              </section>
            </>
          )}
      </DashboardPage>
    </DashboardShell>
  );
}
