"use client";

import {
  ArrowUpRight,
  Check,
  Clock3,
  CreditCard,
  Crown,
  ExternalLink,
  Gauge,
  Sparkles,
  Zap,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
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

type PlanApiResponse = {
  ok: boolean;
  plan: string;

  hasBillingAccount?: boolean;
  hasSubscription?: boolean;

  billingStatus?: string;
  pendingPlan?: string | null;
  currentPeriodEnd?: string | null;

  limits: {
    viewerDropsPerMonth: number | null;
    globalDropsPerMonth: number | null;
  };

  usage: {
    viewerDropsThisMonth: number;
    globalDropsThisMonth: number;
  };

  period: {
    monthStart: string;
    monthEnd: string;
    now: string;
  };

  error?: string;
};

type CheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

type PortalResponse = {
  ok: boolean;
  url?: string;
  error?: string;
};

type PlanName =
  | "free"
  | "pro"
  | "creator";

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

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}

function normalizePlan(
  value?: string | null
): PlanName {
  const normalized =
    String(
      value ||
      ""
    ).toLowerCase();

  if (
    normalized ===
    "creator"
  ) {
    return "creator";
  }

  if (
    normalized ===
    "pro"
  ) {
    return "pro";
  }

  return "free";
}

function planLabel(
  value?: string | null
) {
  const plan =
    normalizePlan(
      value
    );

  if (
    plan ===
    "creator"
  ) {
    return "Creator";
  }

  if (
    plan ===
    "pro"
  ) {
    return "Pro";
  }

  return "Free";
}

function formatDate(
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

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

function daysUntil(
  nowIso?: string | null,
  endIso?: string | null
) {
  if (
    !nowIso ||
    !endIso
  ) {
    return null;
  }

  const now =
    new Date(
      nowIso
    ).getTime();

  const end =
    new Date(
      endIso
    ).getTime();

  if (
    !Number.isFinite(
      now
    ) ||
    !Number.isFinite(
      end
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.ceil(
      (end - now) /
        (1000 *
          60 *
          60 *
          24)
    )
  );
}

export default function BillingPage() {
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
    data,
    setData,
  ] =
    useState<PlanApiResponse | null>(
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
    checkoutPlan,
    setCheckoutPlan,
  ] =
    useState<
      "pro" |
      "creator" |
      null
    >(
      null
    );

  const [
    portalLoading,
    setPortalLoading,
  ] =
    useState(false);

  const safeLogin =
    useMemo(
      () =>
        (
          login ||
          ""
        ).toLowerCase(),
      [
        login,
      ]
    );

  const loadPlan =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/plan/${encodeURIComponent(
              currentLogin
            )}`,
            {
              signal,
            }
          );

        const json =
          await response
            .json()
            .catch(
              () =>
                null
            );

        if (
          !response.ok ||
          !json?.ok
        ) {
          throw new Error(
            json?.error ||
              "Failed to load billing information."
          );
        }

        setData(
          json as PlanApiResponse
        );
      },
      []
    );

  useEffect(() => {
    if (
      !safeLogin
    ) {
      return;
    }

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

        await loadPlan(
          safeLogin,
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
          "[Billing] load error",
          loadError
        );

        setError(
          getErrorMessage(
            loadError,
            "Failed to load billing information."
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
    safeLogin,
    loadPlan,
  ]);

  const currentPlan =
    normalizePlan(
      data?.plan
    );

  const viewerUsed =
    data?.usage
      .viewerDropsThisMonth ??
    0;

  const globalUsed =
    data?.usage
      .globalDropsThisMonth ??
    0;

  const viewerLimit =
    data?.limits
      .viewerDropsPerMonth ??
    null;

  const globalLimit =
    data?.limits
      .globalDropsPerMonth ??
    null;

  const viewerPct =
    viewerLimit &&
    viewerLimit > 0
      ? clamp(
          Math.round(
            (
              viewerUsed /
              viewerLimit
            ) *
              100
          ),
          0,
          100
        )
      : 0;

  const globalPct =
    globalLimit &&
    globalLimit > 0
      ? clamp(
          Math.round(
            (
              globalUsed /
              globalLimit
            ) *
              100
          ),
          0,
          100
        )
      : 0;

  const resetDays =
    daysUntil(
      data?.period
        .now,
      data?.period
        .monthEnd
    );

  const pendingPlan =
    data?.pendingPlan
      ? normalizePlan(
          data.pendingPlan
        )
      : null;

  const hasPendingChange =
    Boolean(
      pendingPlan &&
      pendingPlan !==
        currentPlan
    );

  const handleCheckout =
    async (
      plan:
        "pro" |
        "creator"
    ) => {
      if (
        !safeLogin ||
        checkoutPlan
      ) {
        return;
      }

      try {
        setCheckoutPlan(
          plan
        );

        setError(
          null
        );

        const response =
          await apiFetch(
            `${API_URL}/api/stripe/create-checkout`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  login:
                    safeLogin,
                  plan,
                }),
            }
          );

        const json =
          await response
            .json()
            .catch(
              () =>
                null
            ) as
            CheckoutResponse |
            null;

        if (
          !response.ok ||
          !json?.ok ||
          !json.url
        ) {
          throw new Error(
            json?.error ||
              "Failed to start Stripe Checkout."
          );
        }

        window.location.href =
          json.url;
      } catch (
        checkoutError:
          unknown
      ) {
        console.error(
          "[Billing] checkout error",
          checkoutError
        );

        setError(
          getErrorMessage(
            checkoutError,
            "Could not start checkout."
          )
        );

        setCheckoutPlan(
          null
        );
      }
    };

  const handlePortal =
    async () => {
      if (
        !safeLogin ||
        portalLoading
      ) {
        return;
      }

      try {
        setPortalLoading(
          true
        );

        setError(
          null
        );

        const response =
          await apiFetch(
            `${API_URL}/api/stripe/create-portal`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  login:
                    safeLogin,
                }),
            }
          );

        const json =
          await response
            .json()
            .catch(
              () =>
                null
            ) as
            PortalResponse |
            null;

        if (
          !response.ok ||
          !json?.ok ||
          !json.url
        ) {
          throw new Error(
            json?.error ||
              "Failed to open Stripe billing portal."
          );
        }

        window.location.href =
          json.url;
      } catch (
        portalError:
          unknown
      ) {
        console.error(
          "[Billing] portal error",
          portalError
        );

        setError(
          getErrorMessage(
            portalError,
            "Could not open billing portal."
          )
        );
      } finally {
        setPortalLoading(
          false
        );
      }
    };

  const hasBillingAccount =
    Boolean(
      data?.hasBillingAccount
    );

  const hasSubscription =
    Boolean(
      data?.hasSubscription
    );

  const canManageBilling =
    hasBillingAccount;

  const billingStateLabel =
    hasBillingAccount
      ? data?.billingStatus ||
        (hasSubscription
          ? "active"
          : "connected")
      : currentPlan !== "free"
        ? "Plan enabled"
        : "Free";

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
              <CreditCard className="h-4 w-4" />
              Subscription
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Billing
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your DropifyBot plan, monthly usage and Stripe subscription.
            </p>
          </div>

          {canManageBilling && (
            <Button
              type="button"
              variant="secondary"
              onClick={
                handlePortal
              }
              disabled={
                portalLoading
              }
              isLoading={
                portalLoading
              }
            >
              <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                {!portalLoading && (
                  <ExternalLink className="h-4 w-4 shrink-0" />
                )}

                <span>
                  Manage billing
                </span>
              </span>
            </Button>
          )}
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
        !data ? (
          <section className="space-y-5">
            <div className="h-52 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

            <div className="grid gap-5 lg:grid-cols-3">
              {Array.from({
                length:
                  3,
              }).map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]"
                  />
                )
              )}
            </div>
          </section>
        ) : (
          <>
            {hasPendingChange && (
              <section className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-5 py-4 sm:px-6">
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />

                  <div>
                    <p className="text-sm font-semibold text-sky-200">
                      Plan change scheduled
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Your subscription is scheduled to change from{" "}
                      <span className="font-medium text-slate-200">
                        {planLabel(
                          currentPlan
                        )}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium text-slate-200">
                        {planLabel(
                          pendingPlan
                        )}
                      </span>
                      {data?.currentPeriodEnd
                        ? ` on ${formatDate(
                            data.currentPeriodEnd
                          )}.`
                        : " at the end of the current billing period."}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
              <div className="overflow-hidden rounded-2xl border border-violet-500/25 bg-[linear-gradient(145deg,rgba(124,58,237,0.09),rgba(11,15,23,0.98)_52%)]">
                <div className="border-b border-slate-800/80 px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                        <Crown className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                          Current plan
                        </p>

                        <h3 className="mt-1 text-2xl font-semibold text-slate-50">
                          {planLabel(
                            data?.plan
                          )}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Your current DropifyBot plan.
                        </p>
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-wide",
                        hasBillingAccount
                          ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"
                          : "border-sky-500/20 bg-sky-500/[0.07] text-sky-300",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-1.5 w-1.5 rounded-full",
                          hasBillingAccount
                            ? "bg-emerald-400"
                            : "bg-sky-400",
                        ].join(" ")}
                      />

                      {billingStateLabel}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <BillingDetail
                    label="Usage period"
                    value={`${formatDate(
                      data?.period
                        .monthStart
                    )} – ${formatDate(
                      data?.period
                        .monthEnd
                    )}`}
                  />

                  <BillingDetail
                    label="Usage resets"
                    value={
                      resetDays !==
                      null
                        ? `${resetDays} day${
                            resetDays ===
                            1
                              ? ""
                              : "s"
                          }`
                        : "Not available"
                    }
                  />

                  <BillingDetail
                    label="Viewer-drop allowance"
                    value={
                      viewerLimit ===
                      null
                        ? "Unlimited"
                        : `${viewerLimit.toLocaleString()} / month`
                    }
                  />

                  <BillingDetail
                    label="Global-drop allowance"
                    value={
                      globalLimit ===
                      null
                        ? "Unlimited"
                        : `${globalLimit.toLocaleString()} / month`
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                    <CreditCard className="h-4 w-4" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Stripe billing
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Secure subscription management.
                    </p>
                  </div>
                </div>

                {hasBillingAccount ? (
                  <>
                    <div className="mt-5 space-y-4 text-xs">
                      <StripeFeature>
                        Update your payment method
                      </StripeFeature>

                      <StripeFeature>
                        View billing history and invoices
                      </StripeFeature>

                      <StripeFeature>
                        Manage or cancel your subscription
                      </StripeFeature>

                      <StripeFeature>
                        Handle scheduled plan changes
                      </StripeFeature>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-6 w-full"
                      onClick={
                        handlePortal
                      }
                      isLoading={
                        portalLoading
                      }
                      disabled={
                        portalLoading
                      }
                    >
                      <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                        {!portalLoading && (
                          <ExternalLink className="h-4 w-4 shrink-0" />
                        )}

                        <span>
                          Open Stripe portal
                        </span>
                      </span>
                    </Button>
                  </>
                ) : currentPlan !== "free" ? (
                  <div className="mt-5 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] px-4 py-4">
                    <p className="text-xs font-semibold text-sky-200">
                      This account isn&apos;t managed through Stripe.
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      Your {planLabel(currentPlan)} plan is active, but it wasn&apos;t purchased through Stripe. Payment methods, invoices and subscription management aren&apos;t available for this account.
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-slate-600">
                      Stripe billing tools will appear automatically when this account owns a Stripe subscription.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-slate-800 bg-[#050914] px-4 py-3 text-xs leading-5 text-slate-500">
                    Stripe billing tools become available after subscribing to a paid DropifyBot plan.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
              <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <Gauge className="h-4 w-4 text-violet-300" />

                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Monthly usage
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Usage counters reset at the end of the current DropifyBot usage period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 md:grid-cols-2 sm:p-6">
                <UsageMeter
                  label="Viewer drops"
                  used={
                    viewerUsed
                  }
                  limit={
                    viewerLimit
                  }
                  percentage={
                    viewerPct
                  }
                  description="Personal discounts claimed through !discount."
                />

                <UsageMeter
                  label="Global drops"
                  used={
                    globalUsed
                  }
                  limit={
                    globalLimit
                  }
                  percentage={
                    globalPct
                  }
                  description="Stream-wide discounts triggered by the broadcaster."
                />
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="text-xs font-medium text-violet-400">
                  Plans
                </p>

                <h3 className="mt-1 text-lg font-semibold text-slate-100">
                  Choose the right DropifyBot tier
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Upgrade through Stripe Checkout. Full public pricing remains on the DropifyBot website.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <PlanCard
                  title="Free"
                  description="For testing DropifyBot and smaller streams."
                  current={
                    currentPlan ===
                    "free"
                  }
                  icon={
                    <Zap className="h-5 w-5" />
                  }
                  features={[
                    "Core viewer discounts",
                    "Global drops",
                    "Monthly usage tracking",
                    "Campaign controls",
                  ]}
                />

                <PlanCard
                  title="Pro"
                  description="For streamers using DropifyBot regularly."
                  current={
                    currentPlan ===
                    "pro"
                  }
                  featured
                  icon={
                    <Sparkles className="h-5 w-5" />
                  }
                  features={[
                    "Higher monthly limits",
                    "Full analytics dashboard",
                    "Stripe subscription management",
                    "Built for regular campaigns",
                  ]}
                  action={
                    currentPlan ===
                    "free"
                      ? {
                          label:
                            "Upgrade to Pro",
                          loading:
                            checkoutPlan ===
                            "pro",
                          onClick:
                            () =>
                              handleCheckout(
                                "pro"
                              ),
                        }
                      : undefined
                  }
                />

                <PlanCard
                  title="Creator"
                  description="For higher-volume live commerce."
                  current={
                    currentPlan ===
                    "creator"
                  }
                  icon={
                    <Crown className="h-5 w-5" />
                  }
                  features={[
                    "Highest DropifyBot limits",
                    "Unlimited global drops when supported by the active plan",
                    "Designed for frequent streams",
                    "Stripe subscription management",
                  ]}
                  action={
                    currentPlan !==
                    "creator"
                      ? {
                          label:
                            "Upgrade to Creator",
                          loading:
                            checkoutPlan ===
                            "creator",
                          onClick:
                            () =>
                              handleCheckout(
                                "creator"
                              ),
                        }
                      : undefined
                  }
                />
              </div>

              <div className="mt-4 flex justify-end">
                <a
                  href="https://dropifybot.com#pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-medium text-violet-300 transition hover:text-violet-200"
                >
                  View public pricing
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </section>
          </>
        )}
      </DashboardPage>
    </DashboardShell>
  );
}

function BillingDetail({
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

      <p className="mt-1 text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}

function UsageMeter({
  label,
  used,
  limit,
  percentage,
  description,
}: {
  label: string;
  used: number;
  limit: number | null;
  percentage: number;
  description: string;
}) {
  const displayPercentage =
    limit === null
      ? 0
      : percentage;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-200">
            {label}
          </p>

          <p className="mt-1 text-[11px] text-slate-600">
            {description}
          </p>
        </div>

        <p className="shrink-0 text-xs font-medium text-slate-400">
          {limit ===
          null
            ? `${used.toLocaleString()} used · Unlimited`
            : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </p>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-900">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
          style={{
            width:
              `${displayPercentage}%`,
          }}
        />
      </div>

      {limit !==
        null && (
        <p className="mt-2 text-[10px] text-slate-600">
          {percentage}% of this month&apos;s allowance used.
        </p>
      )}
    </div>
  );
}

function StripeFeature({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
        <Check className="h-3 w-3" />
      </span>

      <span className="text-slate-400">
        {children}
      </span>
    </div>
  );
}

function PlanCard({
  title,
  description,
  current,
  featured = false,
  icon,
  features,
  action,
}: {
  title: string;
  description: string;
  current: boolean;
  featured?: boolean;
  icon: React.ReactNode;
  features: string[];

  action?: {
    label: string;
    loading: boolean;
    onClick:
      () => void;
  };
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        featured
          ? "border-violet-500/35 bg-[linear-gradient(145deg,rgba(124,58,237,0.09),rgba(11,15,23,0.98)_55%)]"
          : "border-slate-800/90 bg-[#0b0f17]",
      ].join(
        " "
      )}
    >
      {current && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
          Current
        </span>
      )}

      <div
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl",
          featured
            ? "bg-violet-500/10 text-violet-300"
            : "bg-slate-900 text-slate-400",
        ].join(
          " "
        )}
      >
        {icon}
      </div>

      <h4 className="mt-5 text-lg font-semibold text-slate-100">
        {title}
      </h4>

      <p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-5 space-y-3">
        {features.map(
          (
            feature
          ) => (
            <div
              key={
                feature
              }
              className="flex gap-2.5"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />

              <span className="text-xs leading-5 text-slate-400">
                {feature}
              </span>
            </div>
          )
        )}
      </div>

      <div className="mt-6">
        {current ? (
          <div className="flex h-10 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] text-xs font-medium text-emerald-300">
            Current plan
          </div>
        ) : action ? (
          <Button
            type="button"
            className="w-full"
            onClick={
              action.onClick
            }
            isLoading={
              action.loading
            }
            disabled={
              action.loading
            }
          >
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              {!action.loading && (
                <ArrowUpRight className="h-4 w-4 shrink-0" />
              )}

              <span>
                {action.label}
              </span>
            </span>
          </Button>
        ) : (
          <div className="h-10" />
        )}
      </div>
    </div>
  );
}
