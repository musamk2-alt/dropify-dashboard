// /opt/dropify/dropify-dashboard/src/components/RecentRedemptionsCard.tsx
"use client";

import React, { useEffect, useState } from "react";

type Redemption = {
  id: string;
  orderNumber: string | null;
  orderId: string;
  discountCode: string | null;
  discountAmount: string | null;
  discountType: string | null;
  customerEmail: string | null;
  customerId: string | null;
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
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = `https://api.dropifybot.com/api/redemptions/${encodeURIComponent(
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
        setRedemptions(data.redemptions || []);
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
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-200">
            📦
          </span>
          Recent redemptions
        </div>
        <span className="text-xs text-slate-400">
          Showing last {limit}
        </span>
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-slate-400">
          Loading recent redemptions…
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && redemptions.length === 0 && (
        <p className="text-sm text-slate-400">
          No orders with Dropify discounts yet. Go live and let viewers claim
          their first codes.
        </p>
      )}

      {/* List */}
      {!loading && !error && redemptions.length > 0 && (
        <div className="space-y-3">
          {redemptions.map((r, idx) => (
            <div
              key={r.id}
              className={`rounded-xl px-3 py-3 bg-slate-950/40 border border-slate-800/60 ${
                idx === 0 ? "shadow-[0_0_0_1px_rgba(168,85,247,0.35)]" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                {/* Left: order + store */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-300 font-semibold">
                      {r.orderNumber || r.orderId}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                      Order
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 max-w-xs truncate">
                    {r.shopifyStoreDomain}
                  </div>
                </div>

                {/* Middle: discount */}
                <div className="space-y-1 min-w-[150px]">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Discount
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-100">
                      {r.discountCode || "—"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {r.discountAmount
                        ? `${r.discountAmount} ${
                            r.discountType ? r.discountType : ""
                          }`.trim()
                        : ""}
                    </span>
                  </div>
                </div>

                {/* Right: customer + time */}
                <div className="flex flex-col items-start md:items-end gap-1 text-xs">
                  <div className="text-slate-400">
                    {r.customerEmail || "Unknown customer"}
                  </div>
                  {r.customerId && (
                    <div className="text-[11px] text-slate-500">
                      ID: {r.customerId}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500">
                    {formatDateTime(r.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentRedemptionsCard;
