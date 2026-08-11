"use client";

import OverviewQuickActions from "@/components/overview/OverviewQuickActions";
import OverviewCampaignSnapshot from "@/components/overview/OverviewCampaignSnapshot";


import { apiFetch } from "@/lib/api-fetch";

import { useEffect, useState } from "react";

import RecentRedemptionsCard from "../components/RecentRedemptionsCard";
import RecentDropsCard from "../components/RecentDropsCard";
import StatsCard from "../components/StatsCard";
import ExportButton from "../components/ExportButton";
import OverviewDashboard from "../components/overview/OverviewDashboard";

import { DashboardShell } from "../components/layout/dashboard-shell";
import { DashboardNavbar } from "../components/layout/dashboard-navbar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type StreamerInfo = {
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  email: string | null;
  connectedAt: string | null;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
  shopifyApiVersion?: string | null;
};

export type Stats = {
  // Lifetime metrics.
  totalDrops: number;
  totalRedeemedCodes: number;
  totalUsageCount: number;
  totalAttributedRevenue: number;
  redemptionRate: number;

  // Shopify-store calendar-day metrics.
  dropsToday: number;
  redeemedCodesToday: number;
  usageCountToday: number;
  attributedRevenueToday: number;

  lastSyncedAt: string | null;

  // Temporary compatibility aliases.
  redemptionsToday: number;
  attributedRevenue24h: number;
  revenue24h: number;

  period: {
    timezone: string;
    startOfToday: string;
    endOfToday: string;
    since24h: string;
    now: string;
  };
};

type WorkspaceStatusState =
  | "good"
  | "warning"
  | "neutral";

function WorkspaceStatus({
  label,
  value,
  state,
}: {
  label: string;
  value: string;
  state: WorkspaceStatusState;
}) {
  const stateClasses = {
    good:
      "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
    warning:
      "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
    neutral:
      "border-slate-700/80 bg-slate-900/60 text-slate-400",
  };

  const dotClasses = {
    good:
      "bg-emerald-400",
    warning:
      "bg-amber-400",
    neutral:
      "bg-slate-500",
  };

  return (
    <div
      className={[
        "inline-flex min-h-10 items-center gap-2.5 rounded-xl border px-3.5 py-2.5",
        stateClasses[state],
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 shrink-0 rounded-full",
          dotClasses[state],
        ].join(" ")}
      />

      <span className="text-[10px] font-medium text-slate-500">
        {label}
      </span>

      <span className="text-[11px] font-semibold tracking-tight">
        {value}
      </span>
    </div>
  );
}

export default function HomePage() {
  const [login, setLogin] = useState<string | null>(null);
  const [streamer, setStreamer] = useState<StreamerInfo | null>(null);
  const [loadingStreamer, setLoadingStreamer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shopDomain, setShopDomain] = useState("");
  const [, setShopifyMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    analyticsRefreshing,
    setAnalyticsRefreshing,
  ] = useState(false);

  const [
    analyticsRefreshMessage,
    setAnalyticsRefreshMessage,
  ] = useState<string | null>(null);

  const [
    analyticsRefreshError,
    setAnalyticsRefreshError,
  ] = useState(false);

  const [
    analyticsRefreshKey,
    setAnalyticsRefreshKey,
  ] = useState(0);

  const twitchConnected = Boolean(login && streamer && !error);
  const shopifyConnected = Boolean(streamer?.shopifyConnected);



  // Load the authenticated streamer session.
  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        setLoadingStreamer(true);
        setError(null);

        const response = await apiFetch(
          `${API_URL}/api/auth/session`,
          {
            method: "GET",
            credentials: "include",
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          setLogin(null);
          setStreamer(null);
          return;
        }

        if (!response.ok) {
          const text = await response.text();

          throw new Error(
            `HTTP ${response.status} – ${text}`
          );
        }

        const data = await response.json();

        if (!data.ok || !data.streamer) {
          throw new Error(
            data.error ||
              data.message ||
              "Failed to load streamer session."
          );
        }

        const authenticatedStreamer =
          data.streamer as StreamerInfo;

        setStreamer(authenticatedStreamer);
        setLogin(
          authenticatedStreamer.twitchLogin
        );

        if (
          authenticatedStreamer.shopifyStoreDomain
        ) {
          setShopDomain(
            authenticatedStreamer.shopifyStoreDomain
          );
        }
      } catch (sessionError: unknown) {
        if (
          sessionError instanceof DOMException &&
          sessionError.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Streamer session error:",
          sessionError
        );

        setLogin(null);
        setStreamer(null);
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Failed to load your session."
        );
      } finally {
        setLoadingStreamer(false);
      }
    }

    loadSession();

    return () => {
      controller.abort();
    };
  }, []);

  // load stats
  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function loadStats(currentLogin: string) {
      try {
        setStatsLoading(true);
        setStats(null);

        const res = await apiFetch(
          `${API_URL}/api/stats/${encodeURIComponent(currentLogin)}`,
          {
            signal: controller.signal,
            credentials: "include",
          }
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }

        const data = await res.json();
        if (!data.ok || !data.stats) {
          throw new Error(data.error || "Failed to load stats.");
        }

        setStats(data.stats as Stats);
      } catch (err: unknown) {
        if (
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }

        console.error("Stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats(login);

    return () => controller.abort();
  }, [login]);


  const handleRefreshAnalytics =
    async () => {
      if (
        !login ||
        analyticsRefreshing
      ) {
        return;
      }

      try {
        setAnalyticsRefreshing(
          true
        );

        setAnalyticsRefreshMessage(
          null
        );

        setAnalyticsRefreshError(
          false
        );

        const refreshResponse =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              login
            )}/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
            }
          );

        const refreshData =
          await refreshResponse
            .json()
            .catch(() => null);

        if (
          !refreshResponse.ok ||
          !refreshData?.ok
        ) {
          throw new Error(
            refreshData?.message ||
            refreshData?.error ||
            "Analytics refresh failed."
          );
        }

        const statsResponse =
          await apiFetch(
            `${API_URL}/api/stats/${encodeURIComponent(
              login
            )}`
          );

        const statsData =
          await statsResponse
            .json()
            .catch(() => null);

        if (
          !statsResponse.ok ||
          !statsData?.ok ||
          !statsData?.stats
        ) {
          throw new Error(
            statsData?.message ||
            statsData?.error ||
            "Analytics refreshed, but the updated statistics could not be loaded."
          );
        }

        setStats(
          statsData.stats as Stats
        );

        setAnalyticsRefreshKey(
          (current) =>
            current + 1
        );

        const synced =
          Number(
            refreshData.summary
              ?.synced ||
            0
          );

        setAnalyticsRefreshMessage(
          `Analytics refreshed. ${synced} discount${
            synced === 1
              ? ""
              : "s"
          } synchronized.`
        );
      } catch (refreshError: unknown) {
        console.error(
          "Analytics refresh error:",
          refreshError
        );

        setAnalyticsRefreshError(
          true
        );

        setAnalyticsRefreshMessage(
          refreshError instanceof Error
            ? refreshError.message
            : "Analytics refresh failed."
        );
      } finally {
        setAnalyticsRefreshing(
          false
        );
      }
    };


  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      try {
        setLoggingOut(true);

        const response =
          await apiFetch(
            `${API_URL}/api/auth/logout`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
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
            "Logout failed."
          );
        }

        /*
         * Clear local state immediately, then perform
         * a clean page load. The next session request
         * should return 401 because the HttpOnly cookie
         * has been removed by the backend.
         */
        setLogin(null);
        setStreamer(null);
        setStats(null);
        setShopDomain("");
        setShopifyMessage(null);
        setAnalyticsRefreshMessage(null);
        setAnalyticsRefreshError(false);

        window.location.replace("/");
      } catch (logoutError: unknown) {
        console.error(
          "Logout error:",
          logoutError
        );

        setError(
          logoutError instanceof Error
            ? logoutError.message
            : "Could not log out. Please try again."
        );

        setLoggingOut(false);
      }
    };

  const handleConnectTwitch = () => {
    window.location.href = `${API_URL}/api/auth/twitch/login`;
  };

  const handleConnectShopify = () => {
    setShopifyMessage(null);

    if (!streamer) {
      setShopifyMessage(
        "Connect Twitch first so we know who you are."
      );
      return;
    }

    const domain =
      shopDomain ||
      window.prompt(
        "Enter your Shopify store domain (e.g. mystore.myshopify.com)"
      );

    if (!domain) {
      return;
    }

    window.location.href =
      `${API_URL}/api/shopify/auth/start?shop=${encodeURIComponent(
        domain.trim()
      )}`;
  };

  const navbarLogin = streamer?.twitchLogin ?? login;
  const navbarDisplayName = streamer?.displayName ?? null;

  // Onboarding is permanent once the streamer has created
  // at least one DropifyBot drop. Do NOT base this on today's
  // activity or the setup will reset every new store day.
  const hasCompletedFirstDrop =
    (stats?.totalDrops ?? 0) > 0;

  return (
    <DashboardShell>
      <DashboardNavbar
        login={navbarLogin}
        displayName={navbarDisplayName}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />

      <main className="min-h-screen pt-16 lg:pl-60">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-7 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          <section className="rounded-2xl border border-slate-800/80 bg-[linear-gradient(135deg,rgba(124,58,237,0.07),rgba(11,15,23,0.82)_38%,rgba(11,15,23,0.96))] px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span
                        className={[
                          "absolute inline-flex h-full w-full rounded-full opacity-30",
                          twitchConnected && shopifyConnected
                            ? "bg-emerald-400"
                            : "bg-amber-400",
                        ].join(" ")}
                      />

                      <span
                        className={[
                          "relative inline-flex h-2.5 w-2.5 rounded-full",
                          twitchConnected && shopifyConnected
                            ? "bg-emerald-400"
                            : "bg-amber-400",
                        ].join(" ")}
                      />
                    </span>

                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                      Live commerce workspace
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
                    {streamer
                      ? `Welcome back, ${streamer.displayName}.`
                      : "Welcome to DropifyBot."}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Monitor your live commerce operation from one DropifyBot workspace.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 xl:ml-10 xl:max-w-[680px] xl:justify-end">
                  <WorkspaceStatus
                    label="Twitch"
                    value={
                      twitchConnected
                        ? "Connected"
                        : "Needs attention"
                    }
                    state={
                      twitchConnected
                        ? "good"
                        : "warning"
                    }
                  />

                  <WorkspaceStatus
                    label="Shopify"
                    value={
                      shopifyConnected
                        ? "Connected"
                        : "Needs attention"
                    }
                    state={
                      shopifyConnected
                        ? "good"
                        : "warning"
                    }
                  />

                  <WorkspaceStatus
                    label="Analytics"
                    value={
                      stats?.lastSyncedAt
                        ? "Synced"
                        : "Waiting"
                    }
                    state={
                      stats?.lastSyncedAt
                        ? "good"
                        : "neutral"
                    }
                  />

                  <WorkspaceStatus
                    label="Workspace"
                    value={
                      twitchConnected &&
                      shopifyConnected &&
                      hasCompletedFirstDrop
                        ? "Ready"
                        : "Setup needed"
                    }
                    state={
                      twitchConnected &&
                      shopifyConnected &&
                      hasCompletedFirstDrop
                        ? "good"
                        : "warning"
                    }
                  />
                </div>
              </div>
            </section>

            {/* KPI-FIRST OVERVIEW */}
          <OverviewDashboard
            login={login}
            streamer={streamer}
            stats={stats}
            statsLoading={statsLoading}
            twitchConnected={twitchConnected}
            shopifyConnected={shopifyConnected}
            hasTestDrop={Boolean(hasCompletedFirstDrop)}
            analyticsRefreshing={analyticsRefreshing}
            analyticsRefreshMessage={analyticsRefreshMessage}
            analyticsRefreshError={analyticsRefreshError}
            onConnectTwitch={handleConnectTwitch}
            onConnectShopify={handleConnectShopify}
            onRefreshAnalytics={handleRefreshAnalytics}
          />

          {/* STREAM CONTROLS */}
          {login && (
            <>
              <OverviewQuickActions
                login={login}
                twitchConnected={twitchConnected}
                shopifyConnected={shopifyConnected}
                totalDrops={stats?.totalDrops ?? 0}
              />

              <OverviewCampaignSnapshot
                login={login}
              />
            </>
          )}

          {/* ACTIVITY + ANALYTICS */}
          {login && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-violet-400">
                    Live activity
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-slate-100">
                    Activity & analytics
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Recent DropifyBot activity and synchronized Shopify performance.
                  </p>
                </div>

                <ExportButton twitchLogin={login} />
              </div>

              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                <RecentDropsCard
                  login={login}
                  limit={10}
                  title="Recent drops"
                  compact
                />
                <RecentRedemptionsCard
                  login={login}
                  limit={10}
                  refreshKey={analyticsRefreshKey}
                />
                <StatsCard
                  login={login}
                  stats={stats}
                  loading={statsLoading}
                  refreshing={analyticsRefreshing}
                  refreshMessage={analyticsRefreshMessage}
                  refreshError={analyticsRefreshError}
                  onRefresh={handleRefreshAnalytics}
                />
              </div>
            </section>
          )}

          {/* COMMAND GUIDE */}
          {login && (
            <section className="space-y-4">
              <div>
                <p className="text-xs font-medium text-violet-400">
                  Command guide
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-100">
                  How DropifyBot behaves in chat
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Viewer offers and global drops use different rules. Here&apos;s the short version.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="overflow-hidden border-violet-500/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.08),rgba(11,15,23,0.97)_68%)]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-400">
                          Viewer offer
                        </p>

                        <CardTitle className="mt-2 text-base">
                          !discount
                        </CardTitle>

                        <CardDescription className="mt-1 text-[11px] leading-5">
                          Creates a personal discount for the viewer using your saved Viewer Campaign settings.
                        </CardDescription>
                      </div>

                      <span className="rounded-lg border border-violet-500/20 bg-violet-500/[0.07] px-2.5 py-1.5 font-mono text-[10px] text-violet-200">
                        personal
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Discount value
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-200">
                        Comes from Viewer Campaign
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Example
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        If your Viewer Campaign is 15 fixed off,{" "}
                        <code className="font-mono text-violet-300">
                          !discount
                        </code>{" "}
                        creates that 15 fixed viewer offer.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.06),rgba(11,15,23,0.97)_68%)]">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
                          Global drop
                        </p>

                        <CardTitle className="mt-2 text-base">
                          !drop X
                        </CardTitle>

                        <CardDescription className="mt-1 text-[11px] leading-5">
                          Creates a stream-wide percentage discount. The number in the command is the percentage.
                        </CardDescription>
                      </div>

                      <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-2.5 py-1.5 font-mono text-[10px] text-emerald-200">
                        global
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Discount value
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-200">
                        Comes directly from the command
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Examples
                      </p>

                      <div className="mt-1 space-y-1 text-[11px] text-slate-400">
                        <p>
                          <code className="font-mono text-emerald-300">
                            !drop 10
                          </code>{" "}
                          → 10% off globally
                        </p>

                        <p>
                          <code className="font-mono text-emerald-300">
                            !drop 25
                          </code>{" "}
                          → 25% off globally
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-400">
                      Help & discovery
                    </p>

                    <CardTitle className="mt-2 text-base">
                      !help
                    </CardTitle>

                    <CardDescription className="mt-1 text-[11px] leading-5">
                      Shows the available DropifyBot chat commands so viewers and broadcasters know what they can use.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Simple rule
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Viewer offer settings live under{" "}
                        <span className="font-semibold text-slate-200">
                          Campaign
                        </span>
                        . Global drop percentage is chosen in{" "}
                        <code className="font-mono text-emerald-300">
                          !drop X
                        </code>
                        .
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-3">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-600">
                        Requirements
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-slate-400">
                        Twitch and Shopify must both be connected for live discount creation.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {/* Optional debug */}
          {loadingStreamer && (
            <p className="text-[11px] text-slate-500">Loading streamer info…</p>
          )}
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      </main>
    </DashboardShell>
  );
}
