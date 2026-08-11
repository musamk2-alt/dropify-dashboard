"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  ExternalLink,
  KeyRound,
  LogOut,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Twitch,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api-fetch";
import { useStreamerSession } from "@/hooks/use-streamer-session";
import { DashboardNavbar } from "@/components/layout/dashboard-navbar";
import { DashboardPage } from "@/components/layout/dashboard-page";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

type AccountInfo = {
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  email: string | null;
  scopes: string[];
  connectedAt: string | null;
  lastSeenAt: string | null;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
};

type PlanInfo = {
  ok: boolean;
  plan: string;
  hasBillingAccount?: boolean;
  billingStatus?: string | null;
};

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

function isAbortError(
  error: unknown
) {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  );
}

function formatDateTime(
  value?: string | null
) {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(
      value
    );

  if (
    !Number.isFinite(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatPlan(
  value?: string | null
) {
  const plan =
    String(
      value ||
      "free"
    ).toLowerCase();

  if (
    plan === "creator"
  ) {
    return "Creator";
  }

  if (
    plan === "pro"
  ) {
    return "Pro";
  }

  return "Free";
}

export default function AccountPage() {
  const {
    streamer,
    loading:
      sessionLoading,
    error:
      sessionError,
  } =
    useStreamerSession();

  const login =
    streamer?.twitchLogin ||
    null;

  const [
    account,
    setAccount,
  ] =
    useState<AccountInfo | null>(
      null
    );

  const [
    plan,
    setPlan,
  ] =
    useState<PlanInfo | null>(
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

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  const loadAccount =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const [
          accountResponse,
          planResponse,
        ] =
          await Promise.all([
            apiFetch(
              `${API_URL}/api/streamers/${encodeURIComponent(
                currentLogin
              )}/info`,
              {
                method:
                  "GET",
                signal,
              }
            ),

            apiFetch(
              `${API_URL}/api/plan/${encodeURIComponent(
                currentLogin
              )}`,
              {
                method:
                  "GET",
                signal,
              }
            ),
          ]);

        const [
          accountData,
          planData,
        ] =
          await Promise.all([
            accountResponse
              .json()
              .catch(
                () =>
                  null
              ),

            planResponse
              .json()
              .catch(
                () =>
                  null
              ),
          ]);

        if (
          !accountResponse.ok ||
          !accountData?.ok ||
          !accountData?.streamer
        ) {
          throw new Error(
            accountData?.message ||
              accountData?.error ||
              "Failed to load account details."
          );
        }

        if (
          !planResponse.ok ||
          !planData?.ok
        ) {
          throw new Error(
            planData?.message ||
              planData?.error ||
              "Failed to load plan information."
          );
        }

        setAccount(
          accountData.streamer as AccountInfo
        );

        setPlan(
          planData as PlanInfo
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
        setLoading(
          true
        );

        setError(
          null
        );

        await loadAccount(
          currentLogin,
          controller.signal
        );
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
          "[Account] load error",
          loadError
        );

        setError(
          getErrorMessage(
            loadError,
            "Failed to load account information."
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    load();

    return () =>
      controller.abort();
  }, [
    login,
    loadAccount,
  ]);

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        setError(
          null
        );

        const response =
          await apiFetch(
            `${API_URL}/api/auth/logout`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },
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
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Logout failed."
          );
        }

        window.location.replace(
          "/"
        );
      } catch (
        logoutError:
          unknown
      ) {
        console.error(
          "[Account] logout error",
          logoutError
        );

        setError(
          getErrorMessage(
            logoutError,
            "Could not sign out. Please try again."
          )
        );

        setLoggingOut(
          false
        );
      }
    };

  const shopifyConnected =
    Boolean(
      account?.shopifyConnected ??
      streamer?.shopifyConnected
    );

  const shopifyDomain =
    account?.shopifyStoreDomain ??
    streamer?.shopifyStoreDomain ??
    null;

  const planName =
    formatPlan(
      plan?.plan
    );

  return (
    <DashboardShell>
      <DashboardNavbar
        login={
          login
        }
        displayName={
          streamer
            ?.displayName ||
          null
        }
      />

      <DashboardPage>
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-violet-400">
              <UserRound className="h-4 w-4" />
              Profile
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Account
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review your DropifyBot identity, connected account details and account security.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={
              handleLogout
            }
            disabled={
              loggingOut
            }
            isLoading={
              loggingOut
            }
          >
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              {!loggingOut && (
                <LogOut className="h-4 w-4 shrink-0" />
              )}

              <span>
                Sign out
              </span>
            </span>
          </Button>
        </section>

        {(sessionError ||
          error) && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error ||
              sessionError}
          </div>
        )}

        {(sessionLoading ||
          loading) &&
        !account ? (
          <section className="space-y-5">
            <div className="h-64 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
              <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
            </div>
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-2xl border border-violet-500/25 bg-[linear-gradient(145deg,rgba(124,58,237,0.09),rgba(11,15,23,0.98)_52%)]">
              <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-lg font-bold text-violet-200">
                      {(
                        account?.displayName ||
                        streamer?.displayName ||
                        "D"
                      )
                        .slice(
                          0,
                          2
                        )
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                        Twitch account
                      </p>

                      <h3 className="mt-1 text-xl font-semibold text-slate-50">
                        {account?.displayName ||
                          streamer?.displayName ||
                          "Streamer"}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        @{account?.twitchLogin ||
                          login ||
                          "unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Authenticated
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3 py-1.5 text-[10px] font-semibold text-violet-300">
                      <Crown className="h-3 w-3" />
                      {planName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
                <AccountMetric
                  icon={
                    <Mail className="h-4 w-4" />
                  }
                  label="Email"
                  value={
                    account?.email ||
                    streamer?.email ||
                    "Not provided by Twitch"
                  }
                />

                <AccountMetric
                  icon={
                    <CalendarDays className="h-4 w-4" />
                  }
                  label="Connected"
                  value={
                    formatDateTime(
                      account?.connectedAt ??
                      streamer?.connectedAt ??
                      null
                    )
                  }
                />

                <AccountMetric
                  icon={
                    <Clock3 className="h-4 w-4" />
                  }
                  label="Last seen"
                  value={
                    formatDateTime(
                      account?.lastSeenAt
                    )
                  }
                />

                <AccountMetric
                  icon={
                    <Crown className="h-4 w-4" />
                  }
                  label="Plan"
                  value={
                    planName
                  }
                />
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                      <Twitch className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        Twitch identity
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        DropifyBot uses Twitch as the primary account identity.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <AccountField
                    label="Display name"
                    value={
                      account?.displayName ||
                      "Not available"
                    }
                  />

                  <AccountField
                    label="Twitch login"
                    value={
                      account?.twitchLogin
                        ? `@${account.twitchLogin}`
                        : "Not available"
                    }
                    mono
                  />

                  <AccountField
                    label="Twitch ID"
                    value={
                      account?.twitchId ||
                      streamer?.twitchId ||
                      "Not available"
                    }
                    mono
                  />

                  <AccountField
                    label="Email"
                    value={
                      account?.email ||
                      "Not provided"
                    }
                  />

                  <div className="mt-5 rounded-xl border border-slate-800 bg-[#050914] px-4 py-3">
                    <p className="text-[11px] leading-5 text-slate-500">
                      Your Twitch profile information is synchronized through Twitch authentication and is not edited directly inside DropifyBot.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                      <ShoppingBag className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        Connected commerce
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Shopify integration associated with this account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <AccountField
                    label="Shopify"
                    value={
                      shopifyConnected
                        ? "Connected"
                        : "Not connected"
                    }
                    positive={
                      shopifyConnected
                    }
                  />

                  <AccountField
                    label="Store"
                    value={
                      shopifyDomain ||
                      "No store connected"
                    }
                    mono
                  />

                  <AccountField
                    label="Plan"
                    value={
                      planName
                    }
                  />

                  <AccountField
                    label="Billing"
                    value={
                      plan?.hasBillingAccount
                        ? "Managed through Stripe"
                        : planName !==
                            "Free"
                          ? "Not managed through Stripe"
                          : "No paid subscription"
                    }
                  />

                  <a
                    href="/connections"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
                  >
                    Manage connections
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
              <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-slate-100">
                        Account security
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        How DropifyBot protects access to this dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/70">
                  <SecurityRow
                    icon={
                      <Twitch className="h-4 w-4" />
                    }
                    title="Twitch authentication"
                    description="Dashboard access is tied to the authenticated Twitch streamer session."
                  />

                  <SecurityRow
                    icon={
                      <KeyRound className="h-4 w-4" />
                    }
                    title="OAuth credentials protected"
                    description="Twitch and Shopify access credentials are stored by the backend and are never exposed in the dashboard."
                  />

                  <SecurityRow
                    icon={
                      <ShieldCheck className="h-4 w-4" />
                    }
                    title="Account-scoped API access"
                    description="Authenticated dashboard routes verify that requests belong to the signed-in streamer."
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-red-500/15 bg-[linear-gradient(145deg,rgba(127,29,29,0.05),rgba(11,15,23,0.98)_60%)] p-6">
                <LogOut className="h-5 w-5 text-red-300" />

                <h3 className="mt-4 text-sm font-semibold text-slate-100">
                  Session
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Signing out removes the current DropifyBot dashboard session from this browser.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  onClick={
                    handleLogout
                  }
                  disabled={
                    loggingOut
                  }
                  isLoading={
                    loggingOut
                  }
                  className="mt-6 w-full"
                >
                  <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                    {!loggingOut && (
                      <LogOut className="h-4 w-4 shrink-0" />
                    )}

                    <span>
                      Sign out of DropifyBot
                    </span>
                  </span>
                </Button>

                <p className="mt-4 text-[10px] leading-5 text-slate-600">
                  Account deletion is not currently available from the dashboard. We will add a dedicated verified deletion flow before launch.
                </p>
              </div>
            </section>
          </>
        )}
      </DashboardPage>
    </DashboardShell>
  );
}

function AccountMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#050914] px-4 py-4">
      <div className="flex items-center gap-2 text-slate-600">
        {icon}

        <p className="text-[10px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>

      <p className="mt-2 truncate text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function AccountField({
  label,
  value,
  mono = false,
  positive = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-800/70 py-3 first:pt-0 last:border-0">
      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span
        className={[
          "max-w-[65%] break-all text-right text-xs font-medium",
          mono
            ? "font-mono"
            : "",
          positive
            ? "text-emerald-300"
            : "text-slate-300",
        ].join(
          " "
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SecurityRow({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 px-5 py-4 sm:px-6">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-slate-200">
            {title}
          </p>

          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </div>

        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
