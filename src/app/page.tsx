"use client";

import { useEffect, useState } from "react";

import RecentRedemptionsCard from "../components/RecentRedemptionsCard";
import StreamerSettingsCard from "../components/StreamerSettingsCard";
import RecentDropsCard from "../components/RecentDropsCard";

import { DashboardShell } from "../components/layout/dashboard-shell";
import { DashboardNavbar } from "../components/layout/dashboard-navbar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

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

type Stats = {
  dropsToday: number;
  redemptionsToday: number;
  redemptionRate: number; // 0–1
  revenue24h: number;
  discountValueToday: number;
  period: {
    startOfToday: string;
    since24h: string;
    now: string;
  };
};

export default function HomePage() {
  const [login, setLogin] = useState<string | null>(null);
  const [streamer, setStreamer] = useState<StreamerInfo | null>(null);
  const [loadingStreamer, setLoadingStreamer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shopDomain, setShopDomain] = useState("");
  const [shopifyMessage, setShopifyMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const twitchConnected = Boolean(login && streamer && !error);
  const shopifyConnected = Boolean(streamer?.shopifyConnected);

  const connectedAtPretty =
    streamer?.connectedAt &&
    new Date(streamer.connectedAt).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatNumber = (value: number) =>
    value.toLocaleString(undefined, { maximumFractionDigits: 0 });

  // load streamer info
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get("login");

    if (!loginParam) {
      setLogin(null);
      setStreamer(null);
      return;
    }

    setLogin(loginParam);
    setLoadingStreamer(true);
    setError(null);

    fetch(`${API_URL}/api/streamers/${loginParam}/info`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          const s: StreamerInfo = data.streamer;
          setStreamer(s);
          if (s.shopifyStoreDomain) setShopDomain(s.shopifyStoreDomain);
        } else {
          setError(data.error || "Unknown error");
        }
      })
      .catch((err) => {
        console.error("Streamer info error:", err);
        setError(err.message);
      })
      .finally(() => setLoadingStreamer(false));
  }, []);

  // load stats
  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function loadStats(currentLogin: string) {
      try {
        setStatsLoading(true);
        setStats(null);

        const res = await fetch(
          `${API_URL}/api/stats/${encodeURIComponent(currentLogin)}`,
          { signal: controller.signal }
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
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadStats(login);

    return () => controller.abort();
  }, [login]);

  const handleConnectTwitch = () => {
    window.location.href = `${API_URL}/api/auth/twitch/login`;
  };

  const handleConnectShopify = () => {
    setShopifyMessage(null);
    const effectiveLogin =
      streamer?.twitchLogin || login || shopifyMessage || null;

    if (!effectiveLogin) {
      setShopifyMessage("Connect Twitch first so we know who you are.");
      return;
    }

    const domain =
      shopDomain ||
      window.prompt(
        "Enter your Shopify store domain (e.g. mystore.myshopify.com)"
      );

    if (!domain) return;

    window.location.href = `${API_URL}/api/shopify/auth/start?login=${encodeURIComponent(
      effectiveLogin.toLowerCase()
    )}&shop=${encodeURIComponent(domain.trim())}`;
  };

  const hasTestDrop = stats && stats.dropsToday > 0;

  const navbarLogin = streamer?.twitchLogin ?? login;
  const navbarDisplayName = streamer?.displayName ?? null;

  return (
    <DashboardShell>
      <DashboardNavbar login={navbarLogin} displayName={navbarDisplayName} />

      <main className="pt-20 sm:pt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-10 sm:px-6 lg:px-8">
          <p className="max-w-3xl text-xs sm:text-sm text-slate-300">
            Dropify watches your Twitch chat and creates single-use Shopify
            discounts in real time when viewers trigger commands like{" "}
            <span className="font-mono text-[11px] text-slate-100">!drop</span>.
          </p>

          {/* TOP ROW */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.35fr)]">
            {/* OVERVIEW CARD */}
            <Card>
              <CardHeader>
                <CardTitle>Dropify overview</CardTitle>
                <CardDescription>
                  High-level health of your Twitch and Shopify connections plus
                  today&apos;s performance.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Twitch • {twitchConnected ? "Connected" : "Not connected"}
                  </span>
                  <span
                    className={[
                      "inline-flex max-w-xs items-center gap-1 rounded-full bg-slate-900/80 px-3 py-1 text-[11px]",
                      shopifyConnected
                        ? "text-emerald-300"
                        : "text-yellow-300",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    title={
                      shopifyConnected && streamer?.shopifyStoreDomain
                        ? streamer.shopifyStoreDomain
                        : undefined
                    }
                  >
                    <span
                      className={[
                        "h-1.5 w-1.5 rounded-full",
                        shopifyConnected ? "bg-emerald-400" : "bg-yellow-400",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    <span className="truncate">
                      Shopify •{" "}
                      {shopifyConnected && streamer?.shopifyStoreDomain
                        ? `connected (${streamer.shopifyStoreDomain})`
                        : "not connected"}
                    </span>
                  </span>
                </div>

                {streamer && (
                  <div className="grid gap-4 text-xs sm:grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Twitch login
                      </p>
                      <p className="mt-1 font-mono text-sm text-slate-50">
                        {streamer.displayName} ({streamer.twitchLogin})
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Shopify store
                      </p>
                      <p
                        className="mt-1 truncate font-mono text-sm text-slate-50"
                        title={
                          shopifyConnected && streamer.shopifyStoreDomain
                            ? streamer.shopifyStoreDomain
                            : undefined
                        }
                      >
                        {shopifyConnected && streamer.shopifyStoreDomain
                          ? streamer.shopifyStoreDomain
                          : "Not connected"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                        Connected at
                      </p>
                      <p className="mt-1 text-sm text-slate-50">
                        {connectedAtPretty || "Not yet"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3 text-sm">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Active codes today
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">
                      {statsLoading
                        ? "…"
                        : stats
                        ? formatNumber(stats.dropsToday)
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3 text-sm">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Redemption rate
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">
                      {statsLoading
                        ? "…"
                        : stats
                        ? `${Math.round(stats.redemptionRate * 100)}%`
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-slate-950/70 px-4 py-3 text-sm">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                      Revenue influenced (24h)
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-50">
                      {statsLoading
                        ? "…"
                        : stats
                        ? formatNumber(stats.revenue24h)
                        : "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Store currency, last 24 hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CONNECTIONS CARD */}
            <Card>
              <CardHeader>
                <CardTitle>Connections</CardTitle>
                <CardDescription>
                  Make sure Twitch and Shopify are connected so Dropify can drop
                  codes live on stream.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm overflow-hidden">
                {/* Twitch */}
                <div className="space-y-2 rounded-xl border border-white/5 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#9146FF]/20 text-[11px] font-semibold text-[#9146FF]">
                        T
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-100">
                          Twitch
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {twitchConnected && streamer ? (
                            <>
                              Connected as{" "}
                              <span className="font-mono">
                                {streamer.displayName} (
                                {streamer.twitchLogin})
                              </span>
                            </>
                          ) : (
                            "Not connected yet."
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                        twitchConnected
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-300",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          twitchConnected ? "bg-emerald-400" : "bg-slate-500",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {twitchConnected ? "Connected" : "Not connected"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Dropify listens for commands like{" "}
                    <span className="font-mono text-[10px] text-slate-200">
                      !drop
                    </span>{" "}
                    in your Twitch chat.
                  </p>
                  <Button
                    onClick={handleConnectTwitch}
                    variant="primary"
                    size="lg"
                    className="mt-2 w-full"
                  >
                    {twitchConnected ? "Reconnect Twitch" : "Connect Twitch"}
                  </Button>
                </div>

                {/* Shopify */}
                <div className="space-y-2 rounded-xl border border-white/5 bg-slate-950/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                        S
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-100">
                          Shopify
                        </p>
                        <p
                          className="truncate text-[11px] text-slate-400 max-w-[210px] sm:max-w-[260px] lg:max-w-[320px]"
                          title={
                            shopifyConnected && streamer?.shopifyStoreDomain
                              ? streamer.shopifyStoreDomain
                              : undefined
                          }
                        >
                          {shopifyConnected && streamer?.shopifyStoreDomain
                            ? `Connected to ${streamer.shopifyStoreDomain}`
                            : "Not connected yet."}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                        shopifyConnected
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-slate-800 text-slate-300",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          shopifyConnected ? "bg-emerald-400" : "bg-slate-500",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {shopifyConnected ? "Connected" : "Not connected"}
                    </span>
                  </div>

                  {!shopifyConnected && (
                    <div className="space-y-1 text-left">
                      <label className="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        Shopify store domain
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="mystore.myshopify.com"
                        value={shopDomain}
                        onChange={(e) => setShopDomain(e.target.value)}
                      />
                    </div>
                  )}

                  {shopifyMessage && (
                    <p className="text-[11px] text-slate-300">
                      {shopifyMessage}
                    </p>
                  )}

                  <Button
                    onClick={handleConnectShopify}
                    variant="secondary"
                    size="lg"
                    className="mt-2 w-full"
                  >
                    {shopifyConnected ? "Reconnect Shopify" : "Connect Shopify"}
                  </Button>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Once Twitch and Shopify are connected, your{" "}
                    <code className="font-mono text-[10px] text-slate-200">
                      !discount
                    </code>{" "}
                    and{" "}
                    <code className="font-mono text-[10px] text-slate-200">
                      !drop
                    </code>{" "}
                    commands are ready to go.
                  </p>
                </div>

                {/* SETUP PROGRESS */}
                <div className="space-y-2 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                    Setup progress
                  </p>
                  <ol className="space-y-1.5 text-[11px] text-slate-200">
                    <li className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                        {twitchConnected ? "✓" : "1"}
                      </span>
                      Connect Twitch
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-300">
                        {shopifyConnected ? "✓" : "2"}
                      </span>
                      Connect Shopify
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                          hasTestDrop
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {hasTestDrop ? "✓" : "3"}
                      </span>
                      Run a test drop
                      {hasTestDrop && (
                        <span className="text-[11px] text-slate-400">
                          ({stats?.dropsToday || 0} drops today)
                        </span>
                      )}
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* STREAMER SETTINGS */}
          {login ? (
            <section>
              <StreamerSettingsCard login={login} />
            </section>
          ) : (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Streamer settings</CardTitle>
                  <CardDescription>
                    Connect with Twitch to unlock your Dropify settings and
                    recent drop activity.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-400">
                    Once Twitch is connected, you&apos;ll see your streamer
                    settings, viewer discounts and global drops here.
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* BOTTOM ROW: DROPS + REDEMPTIONS + ANALYTICS */}
          {login && (
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <RecentDropsCard
                login={login}
                limit={10}
                kind="viewer"
                title="Recent drops"
              />

              <RecentRedemptionsCard login={login} limit={10} />

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Today&apos;s performance and revenue influence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {statsLoading && (
                    <p className="text-xs text-slate-400">Loading…</p>
                  )}

                  {!statsLoading && stats && (
                    <div className="grid gap-3 text-xs">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Drops today
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-50">
                          {formatNumber(stats.dropsToday)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Redemptions today
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-50">
                          {formatNumber(stats.redemptionsToday)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Redemption rate today
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-50">
                          {Math.round(stats.redemptionRate * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                          Revenue influenced (24h)
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-50">
                          {formatNumber(stats.revenue24h)}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Store currency, last 24 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  {!statsLoading && !stats && (
                    <p className="text-xs text-slate-400">
                      No stats yet. Once you start dropping codes and viewers
                      redeem them, we&apos;ll show performance here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>
    </DashboardShell>
  );
}
