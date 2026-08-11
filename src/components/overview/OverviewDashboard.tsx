"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Cable,
  Check,
  Clock,
  CircleAlert,
  CircleDollarSign,
  Gift,
  RefreshCw,
  ShoppingBag,
  Store,
  Twitch,
  Zap,
} from "lucide-react";

import type { Stats } from "@/app/page";

import PlanUsageCard from "@/components/PlanUsageCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StreamerSummary {
  twitchLogin: string;
  displayName: string;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
}

interface OverviewDashboardProps {
  login: string | null;
  streamer: StreamerSummary | null;

  stats: Stats | null;
  statsLoading: boolean;

  twitchConnected: boolean;
  shopifyConnected: boolean;
  hasTestDrop: boolean;

  analyticsRefreshing: boolean;
  analyticsRefreshMessage: string | null;
  analyticsRefreshError: boolean;

  onConnectTwitch: () => void;
  onConnectShopify: () => void;
  onRefreshAnalytics: () => void;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

function formatMoney(value: number) {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "0.0%";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function formatLastSynced(value: string | null | undefined) {
  if (!value) {
    return "Not synchronized yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not synchronized yet";
  }

  const differenceMs =
    Date.now() -
    date.getTime();

  const minutes =
    Math.max(
      0,
      Math.floor(
        differenceMs /
          60_000
      )
    );

  if (minutes < 1) {
    return "Synced just now";
  }

  if (minutes < 60) {
    return `Synced ${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `Synced ${hours}h ago`;
  }

  return `Synced ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
  featured?: boolean;
}

function MetricCard({
  label,
  value,
  description,
  icon,
  loading = false,
  featured = false,
}: MetricCardProps) {
  return (
    <Card
      className={[
        "min-h-40",
        featured
          ? "border-violet-500/30 bg-[linear-gradient(135deg,rgba(124,58,237,0.13),rgba(11,15,23,0.96)_58%)]"
          : "",
      ].join(" ")}
    >
      <CardContent className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {label}
            </p>

            <div className="mt-3">
              {loading ? (
                <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-800" />
              ) : (
                <p className="text-3xl font-semibold tracking-tight text-slate-50">
                  {value}
                </p>
              )}
            </div>
          </div>

          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
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
      </CardContent>
    </Card>
  );
}

interface SetupStepProps {
  complete: boolean;
  number: number;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function SetupStep({
  complete,
  number,
  title,
  description,
  actionLabel,
  onAction,
}: SetupStepProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/45 p-3.5">
      <div
        className={[
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          complete
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-slate-800 text-slate-400",
        ].join(" ")}
      >
        {complete ? (
          <Check className="h-4 w-4" strokeWidth={2.2} />
        ) : (
          number
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">
              {title}
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              {description}
            </p>
          </div>

          {!complete && actionLabel && onAction && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAction}
              className="shrink-0 !inline-flex !flex-row items-center justify-center gap-2.5 whitespace-nowrap"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OverviewDashboard({
  login,
  streamer,
  stats,
  statsLoading,
  twitchConnected,
  shopifyConnected,
  hasTestDrop,
  analyticsRefreshing,
  analyticsRefreshMessage,
  analyticsRefreshError,
  onConnectTwitch,
  onConnectShopify,
  onRefreshAnalytics,
}: OverviewDashboardProps) {
  const completedSetupSteps = [
    twitchConnected,
    shopifyConnected,
    hasTestDrop,
  ].filter(Boolean).length;

  const setupProgress =
    Math.round(
      (
        completedSetupSteps /
        3
      ) *
        100
    );

  const setupComplete =
    completedSetupSteps === 3;

  const lastSyncedLabel =
    formatLastSynced(
      stats?.lastSyncedAt
    );

  const healthyWorkspaceChecks = [
    twitchConnected,
    shopifyConnected,
    setupComplete,
  ].filter(Boolean).length;

  const workspaceHealthPercent =
    Math.round(
      (healthyWorkspaceChecks / 3) * 100
    );

  const workspaceHealthLabel =
    workspaceHealthPercent === 100
      ? "Healthy"
      : workspaceHealthPercent >= 67
        ? "Needs attention"
        : "Action required";

  return (
    <div className="space-y-7">
      {/* KPI ROW */}
      <section>
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-violet-400">
              Performance overview
            </p>

            <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-100">
              Your Dropify impact
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Lifetime results with today&apos;s activity shown underneath.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
              <Clock className="h-3.5 w-3.5" />

              <span>
                {statsLoading
                  ? "Loading synchronization status…"
                  : lastSyncedLabel}
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onRefreshAnalytics}
              disabled={
                !shopifyConnected ||
                analyticsRefreshing
              }
              isLoading={analyticsRefreshing}
            >
              {!analyticsRefreshing && (
                <RefreshCw className="h-3.5 w-3.5 shrink-0 inline-block inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap h-4 w-4" />
              )}

              Refresh analytics
            </Button>
          </div>
        </div>

        {analyticsRefreshMessage && (
          <div
            className={[
              "mb-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-xs",
              analyticsRefreshError
                ? "border-red-500/20 bg-red-500/[0.07] text-red-300"
                : "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300",
            ].join(" ")}
          >
            {analyticsRefreshError ? (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
            )}

            <span>{analyticsRefreshMessage}</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            featured
            label="Total attributed revenue"
            value={
              stats
                ? formatMoney(
                    stats.totalAttributedRevenue
                  )
                : "0.00"
            }
            description="Revenue associated with synchronized Dropify discount usage."
            loading={statsLoading}
            icon={
              <CircleDollarSign className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Total drops"
            value={
              stats
                ? formatNumber(stats.totalDrops)
                : "0"
            }
            description="All viewer and global discount drops created."
            loading={statsLoading}
            icon={<Gift className="h-5 w-5" />}
          />

          <MetricCard
            label="Redeemed codes"
            value={
              stats
                ? formatNumber(
                    stats.totalRedeemedCodes
                  )
                : "0"
            }
            description="Unique discount codes with detected Shopify usage."
            loading={statsLoading}
            icon={
              <ShoppingBag className="h-5 w-5" />
            }
          />

          <MetricCard
            label="Lifetime redemption rate"
            value={
              stats
                ? formatPercent(
                    stats.redemptionRate
                  )
                : "0.0%"
            }
            description="The share of created drops that have been redeemed."
            loading={statsLoading}
            icon={<BarChart3 className="h-5 w-5" />}
          />
        </div>
      </section>

      {/* TODAY STRIP */}
      <section className="grid gap-3 rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
            <Zap className="h-4 w-4" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Drops today
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-100">
              {statsLoading
                ? "—"
                : formatNumber(
                    stats?.dropsToday || 0
                  )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border-y border-slate-800/70 px-2 py-4 sm:border-x sm:border-y-0 sm:px-5 sm:py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
            <Activity className="h-4 w-4" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Uses today
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-100">
              {statsLoading
                ? "—"
                : formatNumber(
                    stats?.usageCountToday || 0
                  )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-2 sm:px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
            <CircleDollarSign className="h-4 w-4" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Revenue today
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-100">
              {statsLoading
                ? "—"
                : formatMoney(
                    stats?.attributedRevenueToday ||
                      0
                  )}
            </p>
          </div>
        </div>
      </section>

      {/* SETUP + HEALTH */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        {!setupComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Finish setting up DropifyBot
              </CardTitle>

              <CardDescription>
                Complete these steps before using DropifyBot during a live stream.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-300">
                      Setup progress
                    </p>

                    <p className="mt-1 text-[11px] text-slate-600">
                      {completedSetupSteps} of 3 steps completed
                    </p>
                  </div>

                  <span className="text-sm font-semibold text-violet-300">
                    {setupProgress}%
                  </span>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label="DropifyBot setup progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={setupProgress}
                >
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width] duration-700 ease-out"
                    style={{
                      width:
                        `${setupProgress}%`,
                    }}
                  />
                </div>
              </div>

              <SetupStep
                complete={twitchConnected}
                number={1}
                title="Connect Twitch"
                description="Authenticate your channel so DropifyBot can recognize the broadcaster."
                actionLabel="Connect"
                onAction={onConnectTwitch}
              />

              <SetupStep
                complete={shopifyConnected}
                number={2}
                title="Connect Shopify"
                description="Authorize discount creation and privacy-first usage analytics."
                actionLabel="Connect"
                onAction={onConnectShopify}
              />

              <SetupStep
                complete={hasTestDrop}
                number={3}
                title="Run your first test"
                description="Type !discount in Twitch chat and complete the viewer claim flow."
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                Plan and monthly usage
              </CardTitle>

              <CardDescription>
                Track your viewer and global drop allowance.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {login ? (
                <PlanUsageCard login={login} />
              ) : (
                <p className="text-sm text-slate-500">
                  Connect Twitch to load plan usage.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>
                Workspace health
              </CardTitle>

              <CardDescription>
                Live readiness across your core DropifyBot setup.
              </CardDescription>
            </div>

            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    workspaceHealthPercent === 100
                      ? "bg-emerald-400"
                      : "bg-amber-400",
                  ].join(" ")}
                />

                <span
                  className={[
                    "text-xs font-semibold",
                    workspaceHealthPercent === 100
                      ? "text-emerald-300"
                      : "text-amber-300",
                  ].join(" ")}
                >
                  {workspaceHealthLabel}
                </span>
              </div>

              <p className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
                {workspaceHealthPercent}%
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                <Twitch className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">
                  Twitch
                </p>

                <p className="truncate text-xs text-slate-600">
                  {twitchConnected && streamer
                    ? `@${streamer.twitchLogin}`
                    : "Not connected"}
                </p>
              </div>

              <span
                className={[
                  "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em]",
                  twitchConnected
                    ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/[0.07] text-amber-300",
                ].join(" ")}
              >
                {twitchConnected
                  ? "Connected"
                  : "Attention"}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                <Store className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">
                  Shopify
                </p>

                <p
                  className="truncate text-xs text-slate-600"
                  title={
                    streamer?.shopifyStoreDomain ||
                    undefined
                  }
                >
                  {shopifyConnected &&
                  streamer?.shopifyStoreDomain
                    ? streamer.shopifyStoreDomain
                    : "Not connected"}
                </p>
              </div>

              <span
                className={[
                  "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em]",
                  shopifyConnected
                    ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/[0.07] text-amber-300",
                ].join(" ")}
              >
                {shopifyConnected
                  ? "Connected"
                  : "Attention"}
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                <Cable className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">
                  Workspace readiness
                </p>

                <p className="truncate text-xs text-slate-600">
                  {setupComplete
                    ? "Everything is configured"
                    : "Setup requires attention"}
                </p>
              </div>

              <span
                className={[
                  "inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em]",
                  setupComplete
                    ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                    : "border-amber-500/20 bg-amber-500/[0.07] text-amber-300",
                ].join(" ")}
              >
                {setupComplete
                  ? "Ready"
                  : "Incomplete"}
              </span>
            </div>

            <div className="pt-1">
              {!twitchConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={onConnectTwitch}
                >
                  Connect Twitch
                </Button>
              ) : !shopifyConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="w-full"
                  onClick={onConnectShopify}
                >
                  Connect Shopify
                </Button>
              ) : !hasTestDrop ? (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
                  <p className="text-xs font-medium text-violet-200">
                    One step remaining
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Type{" "}
                    <code className="font-mono text-violet-300">
                      !discount
                    </code>{" "}
                    in your Twitch chat and complete the viewer claim flow.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <Check className="h-4 w-4 shrink-0" />
                    Workspace ready
                  </div>

                  <p className="mt-1 pl-6 text-[11px] leading-5 text-slate-500">
                    Twitch, Shopify and your first DropifyBot test are complete. No further setup is required.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
