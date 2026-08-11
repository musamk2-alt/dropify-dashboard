"use client";

import {
  CheckCircle2,
  Globe2,
  UserRound,
} from "lucide-react";

import React, {
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api-fetch";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

type Redemption = {
  id: string;
  kind: "viewer" | "global";
  viewerLogin: string | null;
  viewerDisplayName: string | null;
  discountCode: string;
  discountType: string;
  discountValue: number;
  usageCount: number;
  totalSales: number;
  currency: string | null;
  shopifyStatus: string | null;
  redeemed: boolean;
  redemptionDetectedAt: string | null;
  analyticsSyncedAt: string | null;
  createdAt: string;
};

interface Props {
  login: string;
  limit?: number;
  refreshKey?: number;
}

function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not available";
  }

  return new Date(value)
    .toLocaleString(
      undefined,
      {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}

function formatMoney(
  value: number,
  currency: string | null
) {
  const amount =
    Number(value || 0);

  if (!currency) {
    return amount > 0
      ? amount.toFixed(2)
      : "—";
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
      }
    ).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const RecentRedemptionsCard:
  React.FC<Props> = ({
    login,
    limit = 10,
    refreshKey = 0,
  }) => {
    const [
      rows,
      setRows,
    ] =
      useState<Redemption[]>(
        []
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
              `${API_URL}/api/redemptions/${encodeURIComponent(
                currentLogin
              )}?limit=${limit}`,
              {
                method: "GET",
                signal:
                  controller.signal,
              }
            );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const data =
            await response.json();

          if (
            !Array.isArray(
              data.redemptions
            )
          ) {
            throw new Error(
              "Invalid API response"
            );
          }

          setRows(
            data.redemptions
          );
        } catch (
          loadError: unknown
        ) {
          if (
            loadError instanceof DOMException &&
            loadError.name ===
              "AbortError"
          ) {
            return;
          }

          console.error(
            "[RecentRedemptionsCard]",
            loadError instanceof Error
              ? loadError.message
              : "Failed to load"
          );

          setError(
            "Failed to load recent redemptions."
          );
        } finally {
          setLoading(false);
        }
      }

      load();

      return () => {
        controller.abort();
      };
    }, [
      login,
      limit,
      refreshKey,
    ]);

    return (
      <Card className="self-start overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>

            <div>
              <CardTitle className="text-sm sm:text-base">
                Recent redemptions
              </CardTitle>

              <CardDescription className="mt-0.5 text-[11px]">
                Latest Shopify usage detected.
              </CardDescription>
            </div>
          </div>

          <span className="shrink-0 text-[10px] text-slate-600">
            Last {limit}
          </span>
        </CardHeader>

        <CardContent className="text-sm">
          {loading && (
            <div className="space-y-3">
              {[0, 1].map(
                (index) => (
                  <div
                    key={index}
                    className="h-32 animate-pulse rounded-xl border border-slate-800 bg-slate-950/40"
                  />
                )
              )}
            </div>
          )}

          {!loading &&
            error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

          {!loading &&
            !error &&
            rows.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-5 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No redemptions yet
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Shopify usage will appear here after a DropifyBot discount is used.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            rows.length > 0 && (
              <div className="max-h-[390px] space-y-3 overflow-y-auto overscroll-contain pr-1">
                {rows.map(
                  (
                    redemption,
                    index
                  ) => {
                    const isGlobal =
                      redemption.kind ===
                      "global";

                    return (
                      <div
                        key={
                          redemption.id
                        }
                        className={[
                          "rounded-xl border bg-slate-950/55 px-3.5 py-3.5 transition-colors",
                          index === 0
                            ? "border-emerald-500/35"
                            : "border-slate-800/80 hover:border-slate-700",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <code className="block truncate font-mono text-[11px] font-semibold text-emerald-300">
                              {
                                redemption.discountCode
                              }
                            </code>

                            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                              {isGlobal ? (
                                <Globe2 className="h-3 w-3 shrink-0" />
                              ) : (
                                <UserRound className="h-3 w-3 shrink-0" />
                              )}

                              <span className="truncate">
                                {isGlobal
                                  ? "Global drop"
                                  : redemption.viewerDisplayName ||
                                    redemption.viewerLogin ||
                                    "Viewer"}
                              </span>
                            </div>
                          </div>

                          <span className="inline-flex shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                            Redeemed
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
                              Uses
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-100">
                              {
                                redemption.usageCount
                              }
                            </p>
                          </div>

                          <div className="rounded-lg border border-slate-800/70 bg-slate-900/50 px-3 py-2">
                            <p className="text-[9px] uppercase tracking-[0.12em] text-slate-600">
                              Sales
                            </p>

                            <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                              {formatMoney(
                                redemption.totalSales,
                                redemption.currency
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-1 text-[9px] text-slate-600">
                          <span>
                            Detected{" "}
                            {formatDateTime(
                              redemption.redemptionDetectedAt
                            )}
                          </span>

                          <span>
                            Synced{" "}
                            {formatDateTime(
                              redemption.analyticsSyncedAt
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </CardContent>
      </Card>
    );
  };

export default RecentRedemptionsCard;
