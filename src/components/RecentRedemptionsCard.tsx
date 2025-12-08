"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type Redemption = {
  id: string;
  orderNumber: string;
  orderId: string;
  discountCode: string;
  discountAmount: string; // comes back as string in your API
  discountType: "percentage" | "fixed_amount" | string;
  customerEmail: string;
  customerId: string;
  shopifyStoreDomain: string;
  createdAt: string;
};

interface RecentRedemptionsCardProps {
  login: string;
  limit?: number;
}

function formatDateTime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RecentRedemptionsCard: React.FC<RecentRedemptionsCardProps> = ({
  login,
  limit = 10,
}) => {
  const [rows, setRows] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Your real API: /api/redemptions/:login?limit=10
        const url = `${API_URL}/api/redemptions/${encodeURIComponent(
          login
        )}?limit=${limit}`;

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error (${res.status}): ${text}`);
        }

        const data = await res.json();
        if (!data.redemptions) {
          throw new Error("Failed to load redemptions.");
        }

        setRows(data.redemptions as Redemption[]);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[RecentRedemptionsCard] Failed to load", err);
        setError("Failed to load recent redemptions.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [login, limit]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/90 text-xs font-bold text-white shadow-lg shadow-emerald-500/40">
            ✅
          </span>
          <CardTitle className="text-sm sm:text-base">
            Recent redemptions
          </CardTitle>
        </div>
        <CardDescription className="text-[11px]">
          Showing last {limit}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {/* States */}
        {loading && (
          <p className="text-sm text-slate-400">
            Loading recent redemptions…
          </p>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-400">
            No redemptions yet. Once viewers start using their codes in your
            Shopify store, they&apos;ll show up here.
          </p>
        )}

        {/* List */}
        {!loading && !error && rows.length > 0 && (
          <div className="space-y-3">
            {rows.map((r, idx) => {
              const isPercentage =
                String(r.discountType).toLowerCase() === "percentage";

              return (
                <div
                  key={r.id}
                  className={`rounded-xl border border-slate-800/70 bg-slate-950/60 px-3 py-3 transition-colors hover:border-emerald-500/60 ${
                    idx === 0 ? "shadow-[0_0_0_1px_rgba(34,197,94,0.35)]" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    {/* Top row: customer + time */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm min-w-0">
                        <span className="truncate font-semibold text-slate-200">
                          {r.customerEmail}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                          Customer
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>

                    {/* Order + store */}
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                      <span>Order #{r.orderNumber}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        {r.shopifyStoreDomain}
                      </span>
                    </div>

                    {/* Code + discount */}
                    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                          Code
                        </div>
                        <code className="font-mono text-xs text-emerald-300">
                          {r.discountCode}
                        </code>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isPercentage
                          ? `${r.discountAmount}% off`
                          : `${r.discountAmount} off`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentRedemptionsCard;
