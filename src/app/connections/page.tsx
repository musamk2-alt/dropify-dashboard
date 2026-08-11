"use client";

import {
  Cable,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Store,
  Twitch,
  Unplug,
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

type StreamerConnectionInfo = {
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  email: string | null;
  scopes?: string[];
  connectedAt: string | null;
  lastSeenAt: string | null;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
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
  value: string | null
) {
  if (!value) {
    return "Not available";
  }

  return new Date(
    value
  ).toLocaleString(
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

export default function ConnectionsPage() {
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
    info,
    setInfo,
  ] =
    useState<StreamerConnectionInfo | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    refreshError,
    setRefreshError,
  ] =
    useState<string | null>(
      null
    );

  const [
    shopDomain,
    setShopDomain,
  ] =
    useState("");

  const loadInfo =
    useCallback(
      async (
        currentLogin: string,
        signal?: AbortSignal
      ) => {
        const response =
          await apiFetch(
            `${API_URL}/api/streamers/${encodeURIComponent(
              currentLogin
            )}/info`,
            {
              method: "GET",
              signal,
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
          !data?.streamer
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load connection details."
          );
        }

        const nextInfo =
          data.streamer as StreamerConnectionInfo;

        setInfo(
          nextInfo
        );

        if (
          nextInfo.shopifyStoreDomain
        ) {
          setShopDomain(
            nextInfo.shopifyStoreDomain
          );
        }
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

        setRefreshError(
          null
        );

        await loadInfo(
          currentLogin,
          controller.signal
        );
      } catch (
        error: unknown
      ) {
        if (
          isAbortError(
            error
          )
        ) {
          return;
        }

        console.error(
          "[Connections] load error",
          error
        );

        setRefreshError(
          getErrorMessage(
            error,
            "Failed to load connection details."
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
    loadInfo,
  ]);

  const twitchConnected =
    Boolean(
      streamer &&
      login
    );

  const shopifyConnected =
    Boolean(
      info?.shopifyConnected ??
      streamer?.shopifyConnected
    );

  const shopifyDomain =
    info?.shopifyStoreDomain ??
    streamer?.shopifyStoreDomain ??
    null;

  const allCoreConnected =
    twitchConnected &&
    shopifyConnected;

  const handleReconnectTwitch =
    () => {
      window.location.href =
        `${API_URL}/api/auth/twitch/login`;
    };

  const handleConnectShopify =
    () => {
      const domain =
        shopDomain
          .trim()
          .toLowerCase();

      if (!domain) {
        setRefreshError(
          "Enter your Shopify store domain first."
        );
        return;
      }

      setRefreshError(
        null
      );

      window.location.href =
        `${API_URL}/api/shopify/auth/start?shop=${encodeURIComponent(
          domain
        )}`;
    };

  const handleRefresh =
    async () => {
      if (
        !login ||
        loading
      ) {
        return;
      }

      try {
        setLoading(
          true
        );

        setRefreshError(
          null
        );

        await loadInfo(
          login
        );
      } catch (
        error: unknown
      ) {
        setRefreshError(
          getErrorMessage(
            error,
            "Failed to refresh connection details."
          )
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  return (
    <DashboardShell>
      <DashboardNavbar
        login={
          login
        }
        displayName={
          streamer?.displayName ||
          null
        }
      />

      <DashboardPage>
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-violet-400">
              <Cable className="h-4 w-4" />
              Integrations
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Connections
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage the services DropifyBot uses to authenticate your channel and create Shopify discounts.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={
              handleRefresh
            }
            disabled={
              !login ||
              loading
            }
            isLoading={
              loading
            }
          >
            {!loading && (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh status
          </Button>
        </section>

        {(sessionError ||
          refreshError) && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {refreshError ||
              sessionError}
          </div>
        )}

        {(sessionLoading ||
          loading) &&
        !info ? (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
            <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
          </section>
        ) : (
          <>
            <section
              className={[
                "rounded-2xl border px-5 py-5 sm:px-6",
                allCoreConnected
                  ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                  : "border-amber-500/20 bg-amber-500/[0.04]",
              ].join(
                " "
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={[
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      allCoreConnected
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300",
                    ].join(
                      " "
                    )}
                  >
                    {allCoreConnected ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      <Unplug className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">
                        Connection readiness
                      </h3>

                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                          allCoreConnected
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-amber-500/10 text-amber-300",
                        ].join(
                          " "
                        )}
                      >
                        {allCoreConnected
                          ? "Ready"
                          : "Action required"}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {allCoreConnected
                        ? "Twitch and Shopify are connected. DropifyBot has the core integrations required to create discounts."
                        : "Connect both Twitch and Shopify before relying on DropifyBot during a live stream."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs">
                  <ConnectionMiniStatus
                    label="Twitch"
                    connected={
                      twitchConnected
                    }
                  />

                  <ConnectionMiniStatus
                    label="Shopify"
                    connected={
                      shopifyConnected
                    }
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <ConnectionCard
                icon={
                  <Twitch className="h-5 w-5" />
                }
                iconClass="bg-violet-500/10 text-violet-300"
                title="Twitch"
                description="Authenticates your broadcaster account and identifies which channel DropifyBot belongs to."
                connected={
                  twitchConnected
                }
              >
                <ConnectionField
                  label="Channel"
                  value={
                    login
                      ? `@${login}`
                      : "Not connected"
                  }
                />

                <ConnectionField
                  label="Display name"
                  value={
                    streamer?.displayName ||
                    "Not available"
                  }
                />

                <ConnectionField
                  label="Connected since"
                  value={
                    formatDateTime(
                      info?.connectedAt ??
                      streamer?.connectedAt ??
                      null
                    )
                  }
                />

                <ConnectionField
                  label="Last seen"
                  value={
                    formatDateTime(
                      info?.lastSeenAt ||
                      null
                    )
                  }
                />

                <div className="mt-5">
                  <Button
                    type="button"
                    onClick={
                      handleReconnectTwitch
                    }
                    className="w-full"
                  >
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <RefreshCw className="h-4 w-4 shrink-0" />

                      <span>
                        {twitchConnected
                          ? "Reconnect Twitch"
                          : "Connect Twitch"}
                      </span>
                    </span>
                  </Button>
                </div>
              </ConnectionCard>

              <ConnectionCard
                icon={
                  <Store className="h-5 w-5" />
                }
                iconClass="bg-emerald-500/10 text-emerald-300"
                title="Shopify"
                description="Authorizes DropifyBot to create discounts and synchronize discount usage analytics."
                connected={
                  shopifyConnected
                }
              >
                <ConnectionField
                  label="Store"
                  value={
                    shopifyDomain ||
                    "Not connected"
                  }
                  mono
                />

                <ConnectionField
                  label="Authorization"
                  value={
                    shopifyConnected
                      ? "OAuth connected"
                      : "Authorization required"
                  }
                />

                <ConnectionField
                  label="API version"
                  value={
                    streamer?.shopifyApiVersion ||
                    "Not available"
                  }
                />

                <div className="mt-5 border-t border-slate-800/70 pt-5">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                    Shopify store domain
                  </label>

                  <input
                    type="text"
                    value={
                      shopDomain
                    }
                    onChange={(
                      event
                    ) =>
                      setShopDomain(
                        event.target.value
                      )
                    }
                    placeholder="your-store.myshopify.com"
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-[#050914] px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-violet-500/40"
                  />

                  <Button
                    type="button"
                    variant={
                      shopifyConnected
                        ? "secondary"
                        : "primary"
                    }
                    onClick={
                      handleConnectShopify
                    }
                    className="mt-3 w-full"
                  >
                    <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                      <ExternalLink className="h-4 w-4 shrink-0" />

                      <span>
                        {shopifyConnected
                          ? "Reauthorize Shopify"
                          : "Connect Shopify"}
                      </span>
                    </span>
                  </Button>
                </div>
              </ConnectionCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
              <div className="rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
                <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
                  <p className="text-xs font-medium text-violet-400">
                    Readiness
                  </p>

                  <h3 className="mt-1 text-base font-semibold text-slate-100">
                    Core integration checks
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    These checks only report connection state the backend can currently verify.
                  </p>
                </div>

                <div className="divide-y divide-slate-800/70">
                  <ReadinessRow
                    title="Broadcaster authenticated"
                    description="A valid DropifyBot streamer session is associated with your Twitch account."
                    complete={
                      twitchConnected
                    }
                  />

                  <ReadinessRow
                    title="Shopify OAuth connected"
                    description="DropifyBot has a Shopify store connection associated with this account."
                    complete={
                      shopifyConnected
                    }
                  />

                  <ReadinessRow
                    title="Shopify store identified"
                    description={
                      shopifyDomain ||
                      "No Shopify store domain is currently associated."
                    }
                    complete={
                      Boolean(
                        shopifyDomain
                      )
                    }
                  />

                  <ReadinessRow
                    title="Core connection setup"
                    description="Both required integrations are available for the live discount workflow."
                    complete={
                      allCoreConnected
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-violet-500/20 bg-[linear-gradient(145deg,rgba(124,58,237,0.07),rgba(11,15,23,0.98)_55%)] p-6">
                <Clock3 className="h-5 w-5 text-violet-300" />

                <h3 className="mt-4 text-sm font-semibold text-slate-100">
                  More operational health is coming
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Bot heartbeat, joined-channel state, Shopify token verification and webhook health need dedicated backend health signals before DropifyBot can report them accurately.
                </p>

                <p className="mt-4 text-[11px] leading-5 text-slate-600">
                  We will add those signals during the dashboard health and launch-readiness pass rather than displaying guessed statuses.
                </p>
              </div>
            </section>
          </>
        )}
      </DashboardPage>
    </DashboardShell>
  );
}

function ConnectionCard({
  icon,
  iconClass,
  title,
  description,
  connected,
  children,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
  connected: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
      <div className="border-b border-slate-800 px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                iconClass,
              ].join(
                " "
              )}
            >
              {icon}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                {title}
              </h3>

              <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <span
            className={[
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
              connected
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-slate-900 text-slate-500",
            ].join(
              " "
            )}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                connected
                  ? "bg-emerald-400"
                  : "bg-slate-600",
              ].join(
                " "
              )}
            />

            {connected
              ? "Connected"
              : "Not connected"}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
}

function ConnectionField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-800/70 py-3 first:pt-0 last:border-0">
      <span className="text-xs text-slate-600">
        {label}
      </span>

      <span
        className={[
          "max-w-[65%] break-all text-right text-xs font-medium text-slate-300",
          mono
            ? "font-mono"
            : "",
        ].join(
          " "
        )}
      >
        {value}
      </span>
    </div>
  );
}

function ConnectionMiniStatus({
  label,
  connected,
}: {
  label: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={[
          "h-2 w-2 rounded-full",
          connected
            ? "bg-emerald-400"
            : "bg-amber-400",
        ].join(
          " "
        )}
      />

      <span className="text-slate-400">
        {label}
      </span>
    </div>
  );
}

function ReadinessRow({
  title,
  description,
  complete,
}: {
  title: string;
  description: string;
  complete: boolean;
}) {
  return (
    <div className="flex gap-4 px-5 py-4 sm:px-6">
      <div
        className={[
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          complete
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-amber-500/10 text-amber-300",
        ].join(
          " "
        )}
      >
        {complete ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Unplug className="h-4 w-4" />
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
