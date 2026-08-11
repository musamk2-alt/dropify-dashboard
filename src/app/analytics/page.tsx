"use client";

import {
  BarChart3,
  Clock3,
  DollarSign,
  Gift,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { apiFetch } from "@/lib/api-fetch";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useStreamerSession } from "@/hooks/use-streamer-session";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

type AnalyticsStats = {
  totalDrops: number;
  totalRedeemedCodes: number;
  totalUsageCount: number;
  totalAttributedRevenue: number;
  redemptionRate: number;

  dropsToday: number;
  redeemedCodesToday: number;
  usageCountToday: number;
  attributedRevenueToday: number;

  lastSyncedAt: string | null;

  period: {
    timezone: string;
    startOfToday: string;
    endOfToday: string;
    since24h: string;
    now: string;
  };
};

type AnalyticsRange =
  | "7d"
  | "30d"
  | "90d";

type AnalyticsMetric =
  | "revenue"
  | "uses"
  | "drops";

type TimeSeriesPoint = {
  date: string;
  drops: number;
  redeemedCodes: number;
  uses: number;
  attributedRevenue: number;
};

type TimeSeriesResponse = {
  ok: true;
  range: AnalyticsRange;
  days: number;
  timezone: string;

  totals: {
    drops: number;
    redeemedCodes: number;
    uses: number;
    attributedRevenue: number;
  };

  points: TimeSeriesPoint[];
};

type TopDrop = {
  id: string;
  code: string | null;
  kind:
    | "viewer"
    | "global";
  discountType:
    | string
    | null;
  discountValue: number;
  uses: number;
  attributedRevenue: number;
  currency:
    | string
    | null;
  analyticsSyncedAt:
    | string
    | null;
  createdAt:
    | string
    | null;
};

type ActivityItem = {
  id: string;

  type:
    | "drop_created"
    | "usage_detected"
    | "analytics_synced";

  dropId: string;

  code:
    | string
    | null;

  kind:
    | "viewer"
    | "global";

  discountType:
    | string
    | null;

  discountValue:
    number;

  uses:
    number;

  attributedRevenue:
    number;

  currency:
    | string
    | null;

  occurredAt:
    string;
};

function formatNumber(
  value: number
) {
  return Number.isFinite(value)
    ? value.toLocaleString()
    : "0";
}

function formatPercent(
  value: number
) {
  return Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "0.0%";
}

function formatMoney(
  value: number
) {
  return Number.isFinite(value)
    ? value.toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      )
    : "0.00";
}

export default function AnalyticsPage() {
  const {
    streamer,
    loading: sessionLoading,
  } =
    useStreamerSession();

  const login =
    streamer?.twitchLogin ||
    null;

  const [
    stats,
    setStats,
  ] =
    useState<AnalyticsStats | null>(
      null
    );

  const [
    range,
    setRange,
  ] =
    useState<AnalyticsRange>(
      "30d"
    );

  const [
    metric,
    setMetric,
  ] =
    useState<AnalyticsMetric>(
      "revenue"
    );

  const [
    timeSeries,
    setTimeSeries,
  ] =
    useState<TimeSeriesResponse | null>(
      null
    );

  const [
    timeSeriesLoading,
    setTimeSeriesLoading,
  ] =
    useState(false);

  const [
    topDrops,
    setTopDrops,
  ] =
    useState<TopDrop[]>(
      []
    );

  const [
    topDropsLoading,
    setTopDropsLoading,
  ] =
    useState(false);

  const [
    activity,
    setActivity,
  ] =
    useState<ActivityItem[]>(
      []
    );

  const [
    activityLoading,
    setActivityLoading,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const loadStats =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}`,
            {
              signal,
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
            data?.error ||
              "Unable to load analytics."
          );
        }

        setStats(
          data.stats as AnalyticsStats
        );
      },
      []
    );

  const loadTimeSeries =
    useCallback(
      async (
        currentLogin: string,
        currentRange: AnalyticsRange,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}/timeseries?range=${currentRange}`,
            {
              signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok ||
          !Array.isArray(
            data.points
          )
        ) {
          throw new Error(
            data?.error ||
              "Unable to load performance trends."
          );
        }

        setTimeSeries(
          data as TimeSeriesResponse
        );
      },
      []
    );

  const loadTopDrops =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}/top-drops?limit=8`,
            {
              signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok ||
          !Array.isArray(
            data.drops
          )
        ) {
          throw new Error(
            data?.error ||
              "Unable to load top-performing drops."
          );
        }

        setTopDrops(
          data.drops as TopDrop[]
        );
      },
      []
    );

  const loadActivity =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}/activity?limit=12`,
            {
              signal,
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok ||
          !Array.isArray(
            data.activity
          )
        ) {
          throw new Error(
            data?.error ||
              "Unable to load analytics activity."
          );
        }

        setActivity(
          data.activity as ActivityItem[]
        );
      },
      []
    );

  useEffect(() => {
    if (!login) {
      return;
    }

    const currentLogin =
      login;

    const controller =
      new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        await loadStats(
          currentLogin,
          controller.signal
        );
      } catch (
        loadError: unknown
      ) {
        if (
          loadError instanceof Error &&
          loadError.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    }

    load();

    return () =>
      controller.abort();
  }, [
    login,
    loadStats,
  ]);

  useEffect(() => {
    if (!login) {
      return;
    }

    const currentLogin =
      login;

    const controller =
      new AbortController();

    async function load() {
      try {
        setTimeSeriesLoading(
          true
        );

        await loadTimeSeries(
          currentLogin,
          range,
          controller.signal
        );
      } catch (
        loadError: unknown
      ) {
        if (
          loadError instanceof Error &&
          loadError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "[Analytics] time-series error",
          loadError
        );
      } finally {
        setTimeSeriesLoading(
          false
        );
      }
    }

    load();

    return () =>
      controller.abort();
  }, [
    login,
    range,
    loadTimeSeries,
  ]);

  useEffect(() => {
    if (!login) {
      return;
    }

    const currentLogin =
      login;

    const controller =
      new AbortController();

    async function load() {
      try {
        setTopDropsLoading(
          true
        );

        await loadTopDrops(
          currentLogin,
          controller.signal
        );
      } catch (
        loadError: unknown
      ) {
        if (
          loadError instanceof Error &&
          loadError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "[Analytics] top drops error",
          loadError
        );
      } finally {
        setTopDropsLoading(
          false
        );
      }
    }

    load();

    return () =>
      controller.abort();
  }, [
    login,
    loadTopDrops,
  ]);

  useEffect(() => {
    if (!login) {
      return;
    }

    const currentLogin =
      login;

    const controller =
      new AbortController();

    async function load() {
      try {
        setActivityLoading(
          true
        );

        await loadActivity(
          currentLogin,
          controller.signal
        );
      } catch (
        loadError: unknown
      ) {
        if (
          loadError instanceof Error &&
          loadError.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "[Analytics] activity error",
          loadError
        );
      } finally {
        setActivityLoading(
          false
        );
      }
    }

    load();

    return () =>
      controller.abort();
  }, [
    login,
    loadActivity,
  ]);

  const handleRefresh =
    async () => {
      if (
        !login ||
        refreshing
      ) {
        return;
      }

      const currentLogin =
        login;

      try {
        setRefreshing(
          true
        );

        setMessage(
          null
        );

        setError(
          null
        );

        const response =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              currentLogin
            )}/refresh`,
            {
              method:
                "POST",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Analytics refresh failed."
          );
        }

        await loadStats(
          currentLogin
        );

        await loadTimeSeries(
          currentLogin,
          range
        );

        await loadTopDrops(
          currentLogin
        );

        await loadActivity(
          currentLogin
        );

        setMessage(
          "Analytics synchronized."
        );
      } catch (
        refreshError: unknown
      ) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "Analytics refresh failed."
        );
      } finally {
        setRefreshing(
          false
        );
      }
    };

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
              <BarChart3 className="h-4 w-4" />
              Performance analytics
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Analytics
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Measure how DropifyBot discounts perform across your Twitch channel and Shopify store.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={
              handleRefresh
            }
            isLoading={
              refreshing
            }
            disabled={
              !login ||
              refreshing
            }
          >
            {!refreshing && (
              <RefreshCw className="h-4 w-4" />
            )}

            Refresh analytics
          </Button>
        </section>

        {message && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {(loading ||
          sessionLoading) && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]"
              />
            ))}
          </section>
        )}

        {!loading &&
          stats && (
            <>
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-violet-400">
                      Lifetime performance
                    </p>

                    <h3 className="mt-1 text-lg font-semibold text-slate-100">
                      DropifyBot impact
                    </h3>
                  </div>

                  {stats.lastSyncedAt && (
                    <p className="text-xs text-slate-600">
                      Last sync{" "}
                      {new Date(
                        stats.lastSyncedAt
                      ).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Attributed revenue"
                    value={formatMoney(
                      stats.totalAttributedRevenue
                    )}
                    description="Revenue associated with synchronized discount usage."
                    icon={
                      <DollarSign className="h-4 w-4" />
                    }
                    featured
                  />

                  <MetricCard
                    label="Total drops"
                    value={formatNumber(
                      stats.totalDrops
                    )}
                    description="All viewer and global discount drops created."
                    icon={
                      <Gift className="h-4 w-4" />
                    }
                  />

                  <MetricCard
                    label="Redeemed codes"
                    value={formatNumber(
                      stats.totalRedeemedCodes
                    )}
                    description="Unique codes with detected Shopify usage."
                    icon={
                      <ShoppingBag className="h-4 w-4" />
                    }
                  />

                  <MetricCard
                    label="Redemption rate"
                    value={formatPercent(
                      stats.redemptionRate
                    )}
                    description="Share of created drops that have been redeemed."
                    icon={
                      <TrendingUp className="h-4 w-4" />
                    }
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium text-violet-400">
                    Today
                  </p>

                  <h3 className="mt-1 text-base font-semibold text-slate-100">
                    Store-day performance
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Calculated using{" "}
                    <span className="text-slate-300">
                      {stats.period.timezone ||
                        "UTC"}
                    </span>
                    .
                  </p>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                  <SmallMetric
                    label="Drops today"
                    value={formatNumber(
                      stats.dropsToday
                    )}
                  />

                  <SmallMetric
                    label="Redeemed today"
                    value={formatNumber(
                      stats.redeemedCodesToday
                    )}
                  />

                  <SmallMetric
                    label="Uses today"
                    value={formatNumber(
                      stats.usageCountToday
                    )}
                  />

                  <SmallMetric
                    label="Revenue today"
                    value={formatMoney(
                      stats.attributedRevenueToday
                    )}
                  />
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                  <div>
                    <p className="text-xs font-medium text-violet-400">
                      Drop performance
                    </p>

                    <h3 className="mt-1 text-base font-semibold text-slate-100">
                      Top-performing drops
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Ranked by attributed revenue, then Shopify usage.
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Privacy-first discount data
                  </p>
                </div>

                {topDropsLoading ? (
                  <div className="space-y-3 p-5 sm:p-6">
                    {Array.from({
                      length: 4,
                    }).map(
                      (
                        _,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                          className="h-14 animate-pulse rounded-xl bg-[#050914]"
                        />
                      )
                    )}
                  </div>
                ) : topDrops.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                          <th className="px-5 py-3 sm:px-6">
                            Drop
                          </th>

                          <th className="px-4 py-3">
                            Type
                          </th>

                          <th className="px-4 py-3">
                            Offer
                          </th>

                          <th className="px-4 py-3 text-right">
                            Uses
                          </th>

                          <th className="px-5 py-3 text-right sm:px-6">
                            Attributed revenue
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {topDrops.map(
                          (
                            drop,
                            index
                          ) => (
                            <tr
                              key={
                                drop.id
                              }
                              className="border-b border-slate-800/60 transition last:border-0 hover:bg-slate-900/30"
                            >
                              <td className="px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={[
                                      "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-2 text-[10px] font-semibold",
                                      index ===
                                      0
                                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-300"
                                        : "bg-slate-900 text-slate-500",
                                    ].join(" ")}
                                  >
                                    {index ===
                                    0
                                      ? "★ 1"
                                      : index +
                                        1}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="max-w-[280px] truncate font-mono text-xs font-medium text-slate-200">
                                      {drop.code ||
                                        "Unknown code"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-slate-600">
                                      {drop.createdAt
                                        ? new Date(
                                            drop.createdAt
                                          ).toLocaleDateString()
                                        : "Unknown date"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={[
                                    "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                    drop.kind ===
                                    "global"
                                      ? "bg-violet-500/10 text-violet-300"
                                      : "bg-sky-500/10 text-sky-300",
                                  ].join(" ")}
                                >
                                  {drop.kind}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-xs text-slate-400">
                                <span className="font-medium text-slate-300">
                                  {drop.discountType ===
                                  "percentage"
                                    ? `${drop.discountValue}% OFF`
                                    : drop.discountValue >
                                        0
                                      ? `${formatMoney(
                                          drop.discountValue
                                        )} OFF`
                                      : "—"}
                                </span>
                              </td>

                              <td className="px-4 py-4 text-right text-sm font-medium text-slate-200">
                                {formatNumber(
                                  drop.uses
                                )}
                              </td>

                              <td className="px-5 py-4 text-right sm:px-6">
                                <p className="text-sm font-semibold text-slate-100">
                                  {formatMoney(
                                    drop.attributedRevenue
                                  )}
                                </p>

                                {drop.currency && (
                                  <p className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-700">
                                    {drop.currency}
                                  </p>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <Gift className="mx-auto h-6 w-6 text-slate-700" />

                    <p className="mt-3 text-sm font-medium text-slate-400">
                      No drop performance yet
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-600">
                      Once DropifyBot discounts are created and synchronized, their performance will appear here.
                    </p>
                  </div>
                )}
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
                <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                  <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                    <p className="text-xs font-medium text-violet-400">
                      Activity
                    </p>

                    <h3 className="mt-1 text-base font-semibold text-slate-100">
                      Latest DropifyBot activity
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Recent drop creation, detected usage and analytics synchronization.
                    </p>
                  </div>

                  {activityLoading ? (
                    <div className="space-y-3 p-5 sm:p-6">
                      {Array.from({
                        length: 5,
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <div
                            key={
                              index
                            }
                            className="h-14 animate-pulse rounded-xl bg-[#050914]"
                          />
                        )
                      )}
                    </div>
                  ) : activity.length > 0 ? (
                    <div className="divide-y divide-slate-800/70">
                      {activity.map(
                        (
                          item
                        ) => (
                          <ActivityRow
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <Clock3 className="mx-auto h-6 w-6 text-slate-700" />

                      <p className="mt-3 text-sm font-medium text-slate-400">
                        No analytics activity yet
                      </p>

                      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-600">
                        New DropifyBot events will appear here as discounts are created and synchronized.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-violet-500/20 bg-[linear-gradient(145deg,rgba(124,58,237,0.07),rgba(11,15,23,0.98)_55%)] p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                    Analytics coverage
                  </p>

                  <h3 className="mt-2 text-base font-semibold text-slate-100">
                    What DropifyBot currently measures
                  </h3>

                  <div className="mt-5 space-y-4">
                    <CoverageRow
                      title="Drop creation"
                      description="When viewer and global discount codes are created."
                    />

                    <CoverageRow
                      title="Discount usage"
                      description="When Shopify reports usage against a DropifyBot discount."
                    />

                    <CoverageRow
                      title="Attributed sales"
                      description="Sales associated with synchronized discount usage."
                    />

                    <CoverageRow
                      title="Privacy-first"
                      description="No complete Shopify customer identity is required for these analytics."
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]">
                <div className="rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                        <BarChart3 className="h-4 w-4" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                          Performance trends
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Attributed revenue grouped by the date each DropifyBot discount was created.
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-[#050914] p-1">
                      {(
                        [
                          "7d",
                          "30d",
                          "90d",
                        ] as AnalyticsRange[]
                      ).map(
                        (option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setRange(
                                option
                              )
                            }
                            className={[
                              "rounded-lg px-3 py-1.5 text-[11px] font-medium transition",
                              range ===
                              option
                                ? "bg-violet-500/15 text-violet-200"
                                : "text-slate-600 hover:text-slate-300",
                            ].join(" ")}
                          >
                            {option.toUpperCase()}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    {timeSeriesLoading ? (
                      <div className="h-72 animate-pulse rounded-xl border border-slate-800 bg-[#050914]" />
                    ) : timeSeries ? (
                      <RevenueChart
                        points={
                          timeSeries.points
                        }
                        metric={
                          metric
                        }
                        onMetricChange={
                          setMetric
                        }
                      />
                    ) : (
                      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#050914]">
                        <p className="text-sm text-slate-600">
                          No trend data available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-5">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-sky-300" />

                      <p className="text-sm font-semibold text-slate-200">
                        Analytics status
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <StatusRow
                        label="Data source"
                        value="Shopify"
                      />

                      <StatusRow
                        label="Total uses"
                        value={formatNumber(
                          stats.totalUsageCount
                        )}
                      />

                      <StatusRow
                        label="Timezone"
                        value={
                          stats.period.timezone ||
                          "UTC"
                        }
                      />

                      <StatusRow
                        label="Sync"
                        value={
                          stats.lastSyncedAt
                            ? "Synchronized"
                            : "Pending"
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
                    <p className="text-sm font-semibold text-violet-200">
                      Privacy-first analytics
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      DropifyBot measures discount usage and attributed sales without exposing complete Shopify customer or order details in the dashboard.
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
      </DashboardPage>
    </DashboardShell>
  );
}

function RevenueChart({
  points,
  metric,
  onMetricChange,
}: {
  points: TimeSeriesPoint[];
  metric: AnalyticsMetric;
  onMetricChange: (
    metric: AnalyticsMetric
  ) => void;
}) {
  const [
    hoveredIndex,
    setHoveredIndex,
  ] =
    useState<number | null>(
      null
    );

  const width =
    900;

  const height =
    280;

  const paddingX =
    28;

  const paddingTop =
    24;

  const paddingBottom =
    40;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const metricConfig = {
    revenue: {
      label:
        "Revenue",
      value: (
        point:
          TimeSeriesPoint
      ) =>
        point.attributedRevenue,
      format:
        formatMoney,
    },

    uses: {
      label:
        "Uses",
      value: (
        point:
          TimeSeriesPoint
      ) =>
        point.uses,
      format:
        formatNumber,
    },

    drops: {
      label:
        "Drops",
      value: (
        point:
          TimeSeriesPoint
      ) =>
        point.drops,
      format:
        formatNumber,
    },
  } satisfies Record<
    AnalyticsMetric,
    {
      label: string;
      value: (
        point:
          TimeSeriesPoint
      ) => number;
      format: (
        value: number
      ) => string;
    }
  >;

  const active =
    metricConfig[
      metric
    ];

  const values =
    points.map(
      active.value
    );

  const hasData =
    values.some(
      (value) =>
        value > 0
    );

  const maxValue =
    Math.max(
      1,
      ...values
    );

  const denominator =
    Math.max(
      points.length - 1,
      1
    );

  const coordinates =
    points.map(
      (
        point,
        index
      ) => {
        const value =
          active.value(
            point
          );

        const x =
          paddingX +
          (index /
            denominator) *
            (width -
              paddingX *
                2);

        const y =
          paddingTop +
          chartHeight -
          (value /
            maxValue) *
            chartHeight;

        return {
          x,
          y,
          value,
          point,
        };
      }
    );

  const linePath =
    coordinates
      .map(
        (
          coordinate,
          index
        ) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${coordinate.x} ${coordinate.y}`
      )
      .join(" ");

  const areaPath =
    coordinates.length
      ? [
          linePath,
          `L ${
            coordinates[
              coordinates.length -
                1
            ].x
          } ${
            paddingTop +
            chartHeight
          }`,
          `L ${
            coordinates[0].x
          } ${
            paddingTop +
            chartHeight
          }`,
          "Z",
        ].join(" ")
      : "";

  const totalRevenue =
    points.reduce(
      (
        total,
        point
      ) =>
        total +
        point.attributedRevenue,
      0
    );

  const totalUses =
    points.reduce(
      (
        total,
        point
      ) =>
        total +
        point.uses,
      0
    );

  const totalDrops =
    points.reduce(
      (
        total,
        point
      ) =>
        total +
        point.drops,
      0
    );

  const hovered =
    hoveredIndex !==
    null
      ? coordinates[
          hoveredIndex
        ]
      : null;

  const xLabelInterval =
    Math.max(
      1,
      Math.ceil(
        points.length /
          6
      )
    );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            {
              metric:
                "revenue" as AnalyticsMetric,
              label:
                "Period revenue",
              value:
                formatMoney(
                  totalRevenue
                ),
            },
            {
              metric:
                "uses" as AnalyticsMetric,
              label:
                "Uses",
              value:
                formatNumber(
                  totalUses
                ),
            },
            {
              metric:
                "drops" as AnalyticsMetric,
              label:
                "Drops",
              value:
                formatNumber(
                  totalDrops
                ),
            },
          ].map(
            (item) => {
              const selected =
                metric ===
                item.metric;

              return (
                <button
                  key={
                    item.metric
                  }
                  type="button"
                  onClick={() =>
                    onMetricChange(
                      item.metric
                    )
                  }
                  className={[
                    "min-w-28 rounded-xl border px-4 py-3 text-left transition",
                    selected
                      ? "border-violet-500/30 bg-violet-500/[0.07]"
                      : "border-transparent hover:border-slate-800 hover:bg-slate-900/30",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-[10px] font-medium uppercase tracking-[0.14em]",
                      selected
                        ? "text-violet-400"
                        : "text-slate-600",
                    ].join(" ")}
                  >
                    {
                      item.label
                    }
                  </p>

                  <p
                    className={[
                      "mt-1 font-semibold transition",
                      selected
                        ? "text-2xl text-slate-50"
                        : "text-lg text-slate-400",
                    ].join(" ")}
                  >
                    {
                      item.value
                    }
                  </p>
                </button>
              );
            }
          )}
        </div>

        <div className="inline-flex w-fit rounded-xl border border-slate-800 bg-slate-950 p-1">
          {(
            [
              "revenue",
              "uses",
              "drops",
            ] as AnalyticsMetric[]
          ).map(
            (
              option
            ) => (
              <button
                key={
                  option
                }
                type="button"
                onClick={() =>
                  onMetricChange(
                    option
                  )
                }
                className={[
                  "rounded-lg px-3 py-1.5 text-[11px] font-medium transition",
                  metric ===
                  option
                    ? "bg-violet-500/15 text-violet-200"
                    : "text-slate-600 hover:text-slate-300",
                ].join(" ")}
              >
                {
                  metricConfig[
                    option
                  ].label
                }
              </button>
            )
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#050914] p-3">
        {!hasData ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-center">
            <TrendingUp className="h-7 w-7 text-slate-700" />

            <p className="mt-3 text-sm font-medium text-slate-400">
              No {active.label.toLowerCase()} activity in this period
            </p>

            <p className="mt-1 max-w-md text-xs leading-5 text-slate-600">
              Try another metric or a longer date range to inspect other DropifyBot activity.
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label={`${active.label} trend`}
            onMouseLeave={() =>
              setHoveredIndex(
                null
              )
            }
          >
            <defs>
              <linearGradient
                id="analyticsArea"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  stopOpacity="0.18"
                />

                <stop
                  offset="100%"
                  stopColor="currentColor"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map(
              (
                fraction
              ) => {
                const y =
                  paddingTop +
                  chartHeight *
                    fraction;

                return (
                  <line
                    key={
                      fraction
                    }
                    x1={
                      paddingX
                    }
                    x2={
                      width -
                      paddingX
                    }
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.08"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }
            )}

            {areaPath && (
              <path
                d={
                  areaPath
                }
                fill="url(#analyticsArea)"
                className="text-violet-400"
              />
            )}

            {linePath && (
              <path
                d={
                  linePath
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className="text-violet-400"
              />
            )}

            {coordinates.map(
              (
                coordinate,
                index
              ) => {
                const showLabel =
                  index ===
                    0 ||
                  index ===
                    points.length -
                      1 ||
                  index %
                    xLabelInterval ===
                    0;

                return (
                  <g
                    key={
                      coordinate
                        .point
                        .date
                    }
                  >
                    <rect
                      x={
                        coordinate.x -
                        Math.max(
                          8,
                          (width -
                            paddingX *
                              2) /
                            Math.max(
                              points.length,
                              1
                            ) /
                            2
                        )
                      }
                      y={
                        paddingTop
                      }
                      width={Math.max(
                        16,
                        (width -
                          paddingX *
                            2) /
                          Math.max(
                            points.length,
                            1
                          )
                      )}
                      height={
                        chartHeight
                      }
                      fill="transparent"
                      onMouseEnter={() =>
                        setHoveredIndex(
                          index
                        )
                      }
                    />

                    {coordinate.value >
                      0 && (
                      <circle
                        cx={
                          coordinate.x
                        }
                        cy={
                          coordinate.y
                        }
                        r={
                          hoveredIndex ===
                          index
                            ? 5
                            : 3
                        }
                        fill="currentColor"
                        className="text-violet-300"
                      />
                    )}

                    {showLabel && (
                      <text
                        x={
                          coordinate.x
                        }
                        y={
                          height -
                          10
                        }
                        textAnchor="middle"
                        fontSize="10"
                        fill="currentColor"
                        className="text-slate-600"
                      >
                        {new Date(
                          `${coordinate.point.date}T12:00:00Z`
                        ).toLocaleDateString(
                          undefined,
                          {
                            month:
                              "short",
                            day:
                              "numeric",
                          }
                        )}
                      </text>
                    )}
                  </g>
                );
              }
            )}

            {hovered && (
              <>
                <line
                  x1={
                    hovered.x
                  }
                  x2={
                    hovered.x
                  }
                  y1={
                    paddingTop
                  }
                  y2={
                    paddingTop +
                    chartHeight
                  }
                  stroke="currentColor"
                  strokeOpacity="0.18"
                  strokeDasharray="4 4"
                  vectorEffect="non-scaling-stroke"
                />

                <circle
                  cx={
                    hovered.x
                  }
                  cy={
                    hovered.y
                  }
                  r="5"
                  fill="currentColor"
                  className="text-violet-300"
                />
              </>
            )}
          </svg>
        )}

        {hovered &&
          hasData && (
            <div
              className="pointer-events-none absolute z-20 min-w-36 rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 shadow-2xl backdrop-blur"
              style={{
                left: `${Math.min(
                  78,
                  Math.max(
                    5,
                    (hovered.x /
                      width) *
                      100
                  )
                )}%`,

                top: "18px",
              }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-600">
                {new Date(
                  `${hovered.point.date}T12:00:00Z`
                ).toLocaleDateString(
                  undefined,
                  {
                    month:
                      "short",
                    day:
                      "numeric",
                    year:
                      "numeric",
                  }
                )}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-100">
                {active.format(
                  hovered.value
                )}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {
                  active.label
                }
              </p>
            </div>
          )}
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-600">
        Revenue is attributed to the date the DropifyBot discount was created. It does not represent the exact Shopify order timestamp.
      </p>
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: ActivityItem;
}) {
  const config = {
    drop_created: {
      label:
        "Drop created",
      detail:
        item.kind ===
        "global"
          ? "Global discount created"
          : "Viewer discount created",
      badge:
        "Created",
    },

    usage_detected: {
      label:
        "Usage detected",
      detail:
        `${formatNumber(
          item.uses
        )} Shopify use${
          item.uses ===
          1
            ? ""
            : "s"
        } detected`,
      badge:
        "Used",
    },

    analytics_synced: {
      label:
        "Analytics synchronized",
      detail:
        "Shopify discount analytics updated",
      badge:
        "Synced",
    },
  }[
    item.type
  ];

  return (
    <div className="flex items-center gap-4 px-5 py-4 sm:px-6">
      <div
        className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          item.type ===
          "usage_detected"
            ? "bg-emerald-500/10 text-emerald-300"
            : item.type ===
                "analytics_synced"
              ? "bg-sky-500/10 text-sky-300"
              : "bg-violet-500/10 text-violet-300",
        ].join(" ")}
      >
        {item.type ===
        "usage_detected" ? (
          <ShoppingBag className="h-4 w-4" />
        ) : item.type ===
            "analytics_synced" ? (
          <RefreshCw className="h-4 w-4" />
        ) : (
          <Gift className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-slate-200">
            {config.label}
          </p>

          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            {config.badge}
          </span>
        </div>

        <p className="mt-1 truncate text-[11px] text-slate-500">
          {config.detail}

          {item.code && (
            <>
              {" · "}

              <span className="font-mono text-slate-400">
                {item.code}
              </span>
            </>
          )}
        </p>
      </div>

      <time className="shrink-0 text-right text-[10px] text-slate-600">
        {new Date(
          item.occurredAt
        ).toLocaleString(
          undefined,
          {
            month:
              "short",
            day:
              "numeric",
            hour:
              "2-digit",
            minute:
              "2-digit",
          }
        )}
      </time>
    </div>
  );
}

function CoverageRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />

      <div>
        <p className="text-xs font-medium text-slate-300">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  featured = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        featured
          ? "border-violet-500/30 bg-[linear-gradient(145deg,rgba(124,58,237,0.09),rgba(11,15,23,0.98)_55%)]"
          : "border-slate-800/90 bg-[#0b0f17]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-slate-500">
          {label}
        </p>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-slate-400">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-50">
        {value}
      </p>

      <p className="mt-5 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#050914] px-4 py-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span className="text-xs font-medium text-slate-300">
        {value}
      </span>
    </div>
  );
}
