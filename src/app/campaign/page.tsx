"use client";

import Link from "next/link";

import {
  Bot,
  Gift,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import StreamerSettingsCard from "@/components/StreamerSettingsCard";

import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { useStreamerSession } from "@/hooks/use-streamer-session";

function scrollToSection(
  id: string
) {
  document
    .getElementById(id)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
}

export default function CampaignPage() {
  const {
    streamer,
    loading,
    error,
    authenticated,
  } = useStreamerSession();

  const login =
    streamer?.twitchLogin ||
    null;

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
        {/* PAGE HEADER */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-violet-400">
              <Sparkles className="h-4 w-4" />
              Discount experience
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Campaign
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Control how DropifyBot creates discounts,
              responds to viewers and behaves during your
              streams.
            </p>
          </div>

          {streamer && (
            <div className="rounded-xl border border-slate-800 bg-[#0b0f17] px-4 py-2.5 text-xs text-slate-500">
              Campaign for{" "}
              <span className="font-mono text-slate-300">
                @{streamer.twitchLogin}
              </span>
            </div>
          )}
        </section>

        {/* CAMPAIGN CONCEPTS */}
        {!loading && authenticated && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "discount-rules"
                )
              }
              className="group text-left rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-4 transition hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-slate-900/70"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 transition group-hover:bg-violet-500/15">
                <Gift className="h-4 w-4" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-200">
                Discount rules
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Configure value, minimum order and viewer
                restrictions.
              </p>

              <p className="mt-3 text-[11px] font-medium text-violet-400 opacity-0 transition group-hover:opacity-100">
                Jump to section →
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "chat-behavior"
                )
              }
              className="group text-left rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-4 transition hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-slate-900/70"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 transition group-hover:bg-sky-500/15">
                <MessageSquareText className="h-4 w-4" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-200">
                Chat behavior
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Decide how DropifyBot responds after viewers
                request discounts.
              </p>

              <p className="mt-3 text-[11px] font-medium text-sky-400 opacity-0 transition group-hover:opacity-100">
                Jump to section →
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "viewer-limits"
                )
              }
              className="group text-left rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-4 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-slate-900/70"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 transition group-hover:bg-emerald-500/15">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-200">
                Viewer limits
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Protect campaigns with cooldowns and
                per-viewer limits.
              </p>

              <p className="mt-3 text-[11px] font-medium text-emerald-400 opacity-0 transition group-hover:opacity-100">
                Jump to section →
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "bot-behavior"
                )
              }
              className="group text-left rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-4 transition hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-slate-900/70"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300 transition group-hover:bg-amber-500/15">
                <Bot className="h-4 w-4" />
              </div>

              <p className="mt-4 text-sm font-medium text-slate-200">
                Bot behavior
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-600">
                Configure how DropifyBot participates in your
                live commerce workflow.
              </p>

              <p className="mt-3 text-[11px] font-medium text-amber-400 opacity-0 transition group-hover:opacity-100">
                Jump to section →
              </p>
            </button>
          </section>
        )}

        {/* LOADING */}
        {loading && (
          <section className="space-y-4">
            <div className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

            <div className="h-[34rem] animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
          </section>
        )}

        {/* NOT LOGGED IN */}
        {!loading && !authenticated && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Settings2 className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-100">
                Connect Twitch to manage your campaign
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Campaign controls belong to your authenticated
                DropifyBot channel.
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

        {/* SESSION ERROR */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* EXISTING SETTINGS */}
        {!loading && login && (
          <section>
            <div className="mb-4">
              <p className="text-xs font-medium text-violet-400">
                Campaign controls
              </p>

              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-100">
                Configure DropifyBot
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                These settings control the live behavior of
                your discounts and bot.
              </p>
            </div>

            <StreamerSettingsCard
              login={login}
            />
          </section>
        )}
      </DashboardPage>
    </DashboardShell>
  );
}
