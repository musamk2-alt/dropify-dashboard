"use client";

import Link from "next/link";

import {
  Bot,
  Clock3,
  ExternalLink,
  MessageSquare,
  Receipt,
  Tag,
  UserRound,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api-fetch";
import { isAbortError } from "@/lib/error-utils";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

type ClaimChatMode =
  | "reply_link"
  | "pinned"
  | "silent";

type CampaignSettings = {
  enabled: boolean;

  discountType:
    | "percentage"
    | "fixed_amount";

  discountValue: number;
  discountPrefix: string;

  maxPerViewerPerStream: number;
  globalCooldownSeconds: number;
  orderMinSubtotal: number;

  autoEnableOnStreamStart: boolean;

  claimChatMode:
    ClaimChatMode;
};

interface OverviewCampaignSnapshotProps {
  login: string | null;
}

function formatOffer(
  settings: CampaignSettings
) {
  if (
    settings.discountType ===
    "fixed_amount"
  ) {
    return `${settings.discountValue} off`;
  }

  return `${settings.discountValue}% off`;
}

function formatViewerLimit(
  value: number
) {
  if (
    !value ||
    value <= 0
  ) {
    return "Unlimited";
  }

  return `${value} per stream`;
}

function formatCooldown(
  seconds: number
) {
  if (
    !seconds ||
    seconds <= 0
  ) {
    return "None";
  }

  if (
    seconds < 60
  ) {
    return `${seconds}s`;
  }

  if (
    seconds % 60 === 0
  ) {
    return `${seconds / 60} min`;
  }

  return `${Math.floor(
    seconds / 60
  )}m ${seconds % 60}s`;
}

function formatMinimumOrder(
  value: number
) {
  if (
    !value ||
    value <= 0
  ) {
    return "No minimum";
  }

  return String(value);
}

function formatChatMode(
  value: ClaimChatMode
) {
  if (
    value === "pinned"
  ) {
    return "Pinned link";
  }

  if (
    value === "silent"
  ) {
    return "Silent";
  }

  return "Claim link";
}

export default function OverviewCampaignSnapshot({
  login,
}: OverviewCampaignSnapshotProps) {
  const [
    settings,
    setSettings,
  ] =
    useState<CampaignSettings | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
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

        const response =
          await apiFetch(
            `${API_URL}/api/settings/${encodeURIComponent(
              currentLogin
            )}`,
            {
              method: "GET",
              signal:
                controller.signal,
            }
          );

        const data =
          await response
            .json()
            .catch(
              () =>
                null
            );

        if (
          !response.ok ||
          !data?.ok ||
          !data?.settings
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load campaign."
          );
        }

        const value =
          data.settings;

        setSettings({
          enabled:
            Boolean(
              value.enabled
            ),

          discountType:
            value.discountType ===
            "fixed_amount"
              ? "fixed_amount"
              : "percentage",

          discountValue:
            Number(
              value.discountValue ??
                0
            ),

          discountPrefix:
            String(
              value.discountPrefix ||
                "DROP-"
            ),

          maxPerViewerPerStream:
            Number(
              value.maxPerViewerPerStream ??
                0
            ),

          globalCooldownSeconds:
            Number(
              value.globalCooldownSeconds ??
                0
            ),

          orderMinSubtotal:
            Number(
              value.orderMinSubtotal ??
                0
            ),

          autoEnableOnStreamStart:
            Boolean(
              value.autoEnableOnStreamStart
            ),

          claimChatMode:
            value.claimChatMode ===
            "pinned"
              ? "pinned"
              : value.claimChatMode ===
                  "silent"
                ? "silent"
                : "reply_link",
        });
      } catch (
        loadError: unknown
      ) {
        if (
          isAbortError(
            loadError
          )
        ) {
          return;
        }

        console.error(
          "[OVERVIEW CAMPAIGN SNAPSHOT]",
          loadError
        );

        setError(
          "Campaign configuration is temporarily unavailable."
        );
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [login]);

  if (!login) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
      <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Current campaign
              </p>

              {settings && (
                <span
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em]",
                    settings.enabled
                      ? "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-300"
                      : "border-amber-500/25 bg-amber-500/[0.07] text-amber-300",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      settings.enabled
                        ? "bg-emerald-400"
                        : "bg-amber-400",
                    ].join(" ")}
                  />

                  {settings.enabled
                    ? "Active"
                    : "Paused"}
                </span>
              )}
            </div>

            <h2 className="mt-1 text-base font-semibold text-slate-100">
              Live campaign configuration
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              The saved settings currently controlling DropifyBot on stream.
            </p>
          </div>
        </div>

        <Link
          href="/campaign"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-xs font-semibold text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.08)] transition hover:bg-violet-500/20 lg:self-auto"
        >
          <span>
            Edit campaign
          </span>

          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>

      {loading &&
      !settings ? (
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:p-6">
          {Array.from({
            length: 6,
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="h-[100px] animate-pulse rounded-xl border border-slate-800 bg-slate-950/50"
              />
            )
          )}
        </div>
      ) : error &&
        !settings ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs text-amber-200">
            {error}
          </div>
        </div>
      ) : settings ? (
        <>
          <div className="grid gap-3 p-5 lg:grid-cols-[1.2fr_2fr] sm:p-6">
            <div className="rounded-xl border border-violet-500/30 bg-[linear-gradient(135deg,rgba(124,58,237,0.15),rgba(5,9,20,0.95)_68%)] px-5 py-5 shadow-[0_0_30px_rgba(124,58,237,0.06)]">
              <div className="flex items-center gap-2 text-violet-300">
                <Tag className="h-4 w-4" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                  Current offer
                </span>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-semibold tracking-tight text-slate-50">
                  {formatOffer(
                    settings
                  )}
                </p>

                <p className="mt-1 text-[11px] text-slate-500">
                  {settings.discountType ===
                  "percentage"
                    ? "Percentage-based viewer discount"
                    : "Fixed-value viewer discount"}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-lg border border-violet-500/20 bg-violet-500/[0.07] px-2.5 py-1.5 font-mono text-[10px] text-violet-200">
                  !discount
                </span>

                <span className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 font-mono text-[10px] text-slate-400">
                  !drop {settings.discountValue}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <SnapshotItem
                icon={
                  <UserRound className="h-4 w-4" />
                }
                label="Viewer limit"
                value={
                  formatViewerLimit(
                    settings.maxPerViewerPerStream
                  )
                }
                description="Per viewer"
              />

              <SnapshotItem
                icon={
                  <Clock3 className="h-4 w-4" />
                }
                label="Cooldown"
                value={
                  formatCooldown(
                    settings.globalCooldownSeconds
                  )
                }
                description="Between drops"
              />

              <SnapshotItem
                icon={
                  <Receipt className="h-4 w-4" />
                }
                label="Minimum order"
                value={
                  formatMinimumOrder(
                    settings.orderMinSubtotal
                  )
                }
                description="Store currency"
              />

              <SnapshotItem
                icon={
                  <MessageSquare className="h-4 w-4" />
                }
                label="Chat response"
                value={
                  formatChatMode(
                    settings.claimChatMode
                  )
                }
                description="Viewer response"
              />

              <SnapshotItem
                icon={
                  <Zap className="h-4 w-4" />
                }
                label="Go-live"
                value={
                  settings.autoEnableOnStreamStart
                    ? "Automatic"
                    : "Manual"
                }
                description={
                  settings.autoEnableOnStreamStart
                    ? "Auto-enabled"
                    : "Manual start"
                }
                positive={
                  settings.autoEnableOnStreamStart
                }
                emphasize={
                  !settings.autoEnableOnStreamStart
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-800/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600">
              <span>
                Code prefix{" "}
                <code className="font-mono text-violet-300">
                  {settings.discountPrefix}
                </code>
              </span>

              <span className="hidden h-3 w-px bg-slate-800 sm:block" />

              <span>
                Viewer command{" "}
                <code className="font-mono text-slate-300">
                  !discount
                </code>
              </span>

              <span className="hidden h-3 w-px bg-slate-800 sm:block" />

              <span>
                Global command{" "}
                <code className="font-mono text-slate-300">
                  !drop {settings.discountValue}
                </code>
              </span>
            </div>

            <span
              className={[
                "text-[10px]",
                settings.enabled
                  ? "text-emerald-400/70"
                  : "text-amber-400/70",
              ].join(" ")}
            >
              {settings.enabled
                ? "Currently active configuration"
                : "Currently paused configuration"}
            </span>
          </div>
        </>
      ) : null}
    </section>
  );
}

function SnapshotItem({
  icon,
  label,
  value,
  description,
  positive = false,
  emphasize = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  positive?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="min-h-[112px] rounded-xl border border-slate-800 bg-slate-950/45 px-3.5 py-3.5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-[8.5px] font-semibold uppercase tracking-[0.15em]">
          {label}
        </span>
      </div>

      <p
        className={[
          "mt-2 text-sm font-semibold",
          positive
            ? "text-emerald-300"
            : emphasize
              ? "text-slate-100"
              : "text-slate-200",
        ].join(" ")}
      >
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-600">
        {description}
      </p>
    </div>
  );
}
