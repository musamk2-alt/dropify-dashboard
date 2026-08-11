"use client";

import Link from "next/link";

import {
  BarChart3,
  Check,
  Clipboard,
  Gift,
  History,
  Megaphone,
  Radio,
  Settings2,
  SlidersHorizontal,
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

type CopiedCommand =
  | "viewer"
  | "global"
  | null;

type CampaignSummary = {
  enabled: boolean;
  discountType:
    | "percentage"
    | "fixed_amount";
  discountValue: number;
};

interface OverviewQuickActionsProps {
  login: string | null;
  twitchConnected: boolean;
  shopifyConnected: boolean;
  totalDrops?: number;
}

export default function OverviewQuickActions({
  login,
  twitchConnected,
  shopifyConnected,
  totalDrops = 0,
}: OverviewQuickActionsProps) {
  const [
    copied,
    setCopied,
  ] =
    useState<CopiedCommand>(
      null
    );

  const [
    campaign,
    setCampaign,
  ] =
    useState<CampaignSummary | null>(
      null
    );

  const ready =
    twitchConnected &&
    shopifyConnected;

  useEffect(() => {
    if (!login) {
      return;
    }

    const currentLogin =
      login;

    const controller =
      new AbortController();

    async function loadCampaign() {
      try {
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
          return;
        }

        setCampaign({
          enabled:
            Boolean(
              data.settings
                .enabled
            ),

          discountType:
            data.settings
              .discountType ===
            "fixed_amount"
              ? "fixed_amount"
              : "percentage",

          discountValue:
            Number(
              data.settings
                .discountValue ??
                0
            ),
        });
      } catch (
        campaignError:
          unknown
      ) {
        if (
          isAbortError(
            campaignError
          )
        ) {
          return;
        }

        console.error(
          "[QUICK ACTIONS] Unable to load campaign:",
          campaignError
        );
      }
    }

    loadCampaign();

    return () => {
      controller.abort();
    };
  }, [
    login,
  ]);

  const campaignActive =
    campaign?.enabled ??
    false;

  const percentageCampaign =
    campaign?.discountType ===
    "percentage";

  const currentDiscount =
    campaign
      ? campaign.discountType ===
        "percentage"
        ? `${campaign.discountValue}%`
        : `${campaign.discountValue}`
      : "—";

  /*
   * Global drops currently use the !drop <percentage>
   * broadcaster command. Only mirror the campaign value
   * automatically when the saved campaign is percentage-based.
   */
  const globalDropValue =
    percentageCampaign &&
    campaign &&
    campaign.discountValue > 0
      ? campaign.discountValue
      : 10;

  const globalCommand =
    `!drop ${globalDropValue}`;

  const viewerOfferLabel =
    campaign
      ? campaign.discountType === "percentage"
        ? `${campaign.discountValue}% off`
        : `${campaign.discountValue} fixed off`
      : "Uses campaign settings";

  const globalOfferLabel =
    `${globalDropValue}% off`;

  async function copyCommand(
    command: string,
    type:
      | "viewer"
      | "global"
  ) {
    if (!ready) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        command
      );

      setCopied(
        type
      );

      window.setTimeout(
        () => {
          setCopied(
            null
          );
        },
        1800
      );
    } catch (
      copyError
    ) {
      console.error(
        "[QUICK ACTIONS] Unable to copy command:",
        copyError
      );
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-xs font-medium text-violet-400">
          Stream controls
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Quick actions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your most-used DropifyBot controls before and during a stream.
            </p>
          </div>

          {campaign && (
            <div className="flex items-center gap-2 text-[10px]">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  campaignActive
                    ? "bg-emerald-400"
                    : "bg-amber-400",
                ].join(" ")}
              />

              <span className="text-slate-500">
                Viewer campaign
              </span>

              <span
                className={
                  campaignActive
                    ? "font-semibold text-emerald-300"
                    : "font-semibold text-amber-300"
                }
              >
                {campaignActive
                  ? "Active"
                  : "Paused"}
              </span>

              <span className="text-slate-700">
                ·
              </span>

              <span className="font-semibold text-slate-300">
                {currentDiscount}
                {percentageCampaign
                  ? " off"
                  : " fixed"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {/* VIEWER DROP */}
        <PrimaryActionCard
          icon={
            <Gift className="h-5 w-5" />
          }
          eyebrow="Viewer drop"
          title={viewerOfferLabel}
          description={
            ready
              ? "Uses your saved Campaign settings. The command itself has no discount value."
              : "Twitch and Shopify must both be connected first."
          }
          tone="violet"
          command="!discount"
        >
          {ready ? (
            <button
              type="button"
              onClick={() =>
                copyCommand(
                  "!discount",
                  "viewer"
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/15 px-3 py-2.5 text-xs font-semibold text-violet-100 shadow-[0_0_20px_rgba(139,92,246,0.09)] transition hover:bg-violet-500/20"
            >
              {copied ===
              "viewer" ? (
                <>
                  <Check className="h-4 w-4 shrink-0" />
                  Copied !discount
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 shrink-0" />
                  Copy !discount
                </>
              )}
            </button>
          ) : (
            <ConnectionButton />
          )}
        </PrimaryActionCard>

        {/* GLOBAL DROP */}
        <PrimaryActionCard
          icon={
            <Radio className="h-5 w-5" />
          }
          eyebrow="Global drop"
          title={globalOfferLabel}
          description={
            ready
              ? percentageCampaign
                ? `The number in ${globalCommand} is the global percentage. We prefilled it with your current percentage campaign value.`
                : `Global drops are percentage-based. ${globalCommand} means ${globalDropValue}% off globally and is separate from your fixed viewer offer.`
              : "Twitch and Shopify must both be connected first."
          }
          tone="emerald"
          command={
            globalCommand
          }
        >
          {ready ? (
            <button
              type="button"
              onClick={() =>
                copyCommand(
                  globalCommand,
                  "global"
                )
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.12] px-3 py-2.5 text-xs font-semibold text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.08)] transition hover:bg-emerald-500/[0.17]"
            >
              {copied ===
              "global" ? (
                <>
                  <Check className="h-4 w-4 shrink-0" />
                  Copied {globalCommand}
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 shrink-0" />
                  Copy {globalCommand}
                </>
              )}
            </button>
          ) : (
            <ConnectionButton />
          )}
        </PrimaryActionCard>

        {/* CAMPAIGN */}
        <SecondaryActionCard
          icon={
            <Megaphone className="h-4 w-4" />
          }
          eyebrow="Viewer campaign"
          title={
            campaign
              ? `${currentDiscount}${
                  percentageCampaign
                    ? " off"
                    : " fixed"
                }`
              : "Configure viewer offers"
          }
          description={
            campaignActive
              ? "Controls what viewers receive when they use !discount."
              : "Review the viewer-offer configuration before the next stream."
          }
          tone="violet"
        >
          <ActionLink
            href="/campaign"
            label="Edit campaign"
            icon={
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
            }
          />
        </SecondaryActionCard>

        {/* ANALYTICS */}
        <SecondaryActionCard
          icon={
            <BarChart3 className="h-4 w-4" />
          }
          eyebrow="Analytics"
          title="Review performance"
          description="Revenue, usage, redemption trends and top-performing drops."
          tone="sky"
        >
          <ActionLink
            href="/analytics"
            label="Open analytics"
            icon={
              <BarChart3 className="h-4 w-4 shrink-0" />
            }
          />
        </SecondaryActionCard>

        {/* CONNECTIONS */}
        <SecondaryActionCard
          icon={
            <Settings2 className="h-4 w-4" />
          }
          eyebrow="Connections"
          title={
            ready
              ? "Integrations ready"
              : "Setup needs attention"
          }
          description={
            ready
              ? "Twitch connected · Shopify connected"
              : `${twitchConnected ? "Twitch connected" : "Twitch needed"} · ${
                  shopifyConnected
                    ? "Shopify connected"
                    : "Shopify needed"
                }`
          }
          tone={
            ready
              ? "emerald"
              : "amber"
          }
        >
          <ActionLink
            href="/connections"
            label="Manage connections"
            icon={
              <Settings2 className="h-4 w-4 shrink-0" />
            }
          />
        </SecondaryActionCard>

        {/* DROP HISTORY */}
        <SecondaryActionCard
          icon={
            <History className="h-4 w-4" />
          }
          eyebrow="Drop history"
          title={`${totalDrops.toLocaleString()} total drop${
            totalDrops === 1
              ? ""
              : "s"
          }`}
          description="Open the complete viewer and global discount history."
          tone="slate"
        >
          <ActionLink
            href="/drops"
            label="View drop history"
            icon={
              <History className="h-4 w-4 shrink-0" />
            }
          />
        </SecondaryActionCard>
      </div>
    </section>
  );
}

function ConnectionButton() {
  return (
    <ActionLink
      href="/connections"
      label="Fix connections"
      icon={
        <Settings2 className="h-4 w-4 shrink-0" />
      }
    />
  );
}

function ActionLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/55 px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-900 hover:text-slate-100"
    >
      {icon}

      <span>
        {label}
      </span>
    </Link>
  );
}

function PrimaryActionCard({
  icon,
  eyebrow,
  title,
  description,
  tone,
  command,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone:
    | "violet"
    | "emerald";
  command: string;
  children: React.ReactNode;
}) {
  const toneClasses = {
    violet: {
      card:
        "border-violet-500/25 bg-[linear-gradient(135deg,rgba(124,58,237,0.09),rgba(11,15,23,0.97)_65%)]",
      icon:
        "bg-violet-500/12 text-violet-300",
      command:
        "border-violet-500/20 bg-violet-500/[0.07] text-violet-200",
    },

    emerald: {
      card:
        "border-emerald-500/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.07),rgba(11,15,23,0.97)_65%)]",
      icon:
        "bg-emerald-500/10 text-emerald-300",
      command:
        "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200",
    },
  }[
    tone
  ];

  return (
    <div
      className={[
        "flex min-h-[220px] flex-col rounded-2xl border p-5",
        toneClasses.card,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            toneClasses.icon,
          ].join(" ")}
        >
          {icon}
        </div>

        <code
          className={[
            "rounded-lg border px-2.5 py-1.5 font-mono text-[10px]",
            toneClasses.command,
          ].join(" ")}
        >
          {command}
        </code>
      </div>

      <div className="mt-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-600">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-base font-semibold text-slate-100">
          {title}
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-5">
        {children}
      </div>
    </div>
  );
}

function SecondaryActionCard({
  icon,
  eyebrow,
  title,
  description,
  tone,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tone:
    | "violet"
    | "emerald"
    | "sky"
    | "amber"
    | "slate";
  children: React.ReactNode;
}) {
  const iconTone = {
    violet:
      "bg-violet-500/10 text-violet-300",
    emerald:
      "bg-emerald-500/10 text-emerald-300",
    sky:
      "bg-sky-500/10 text-sky-300",
    amber:
      "bg-amber-500/10 text-amber-300",
    slate:
      "bg-slate-800 text-slate-400",
  }[
    tone
  ];

  return (
    <div className="flex min-h-[195px] flex-col rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-5 transition hover:border-slate-700">
      <div
        className={[
          "flex h-9 w-9 items-center justify-center rounded-xl",
          iconTone,
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="mt-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-600">
          {eyebrow}
        </p>

        <h3 className="mt-1 text-sm font-semibold text-slate-100">
          {title}
        </h3>

        <p className="mt-2 text-[11px] leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-4">
        {children}
      </div>
    </div>
  );
}
