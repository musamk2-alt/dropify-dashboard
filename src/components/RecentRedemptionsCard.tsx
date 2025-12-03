// /opt/dropify/dropify-dashboard/src/components/RecentRedemptionsCard.tsx
"use client";

import React, { useEffect, useState } from "react";

type Drop = {
  id: string;
  viewerLogin: string;
  viewerDisplayName?: string;
  discountCode: string;
  discountType?: string | null;
  discountValue?: number | null;
  createdAt: string;
};

interface RecentDropsCardProps {
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

const RecentDropsCard: React.FC<RecentDropsCardProps> = ({
  login,
  limit = 10,
}) => {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const url = `https://api.dropifybot.com/api/drops/${encodeURIComponent(
          login
        )}/recent?limit=${limit}`;

        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API error (${res.status}): ${text}`);
        }

        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Failed to load drops");

        setDrops(data.drops || []);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[RecentDropsCard] Failed to load", err);
        setError("Failed to load recent drops.");
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
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-bold">
            🎁
          </span>
          Recent drops
        </div>
        <span className="text-xs text-slate-400">Showing last {limit}</span>
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-slate-400">Loading recent drops…</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && drops.length === 0 && (
        <p className="text-sm text-slate-400">
          No drops generated yet. Viewers can trigger them using{" "}
          <code className="text-[10px]">!discount</code> or the streamer using{" "}
          <code className="text-[10px]">!drop &lt;percent&gt;</code>.
        </p>
      )}

      {/* List */}
      {!loading && !error && drops.length > 0 && (
        <div className="space-y-3">
          {drops.map((d, idx) => (
            <div
              key={d.id}
              className={`rounded-xl px-3 py-3 bg-slate-950/40 border border-slate-800/60 ${
                idx === 0 ? "shadow-[0_0_0_1px_rgba(139,92,246,0.35)]" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                {/* Left: viewer info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-300 font-semibold">
                      {d.viewerDisplayName || d.viewerLogin}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-400">
                      Viewer
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">@{d.viewerLogin}</div>
                </div>

                {/* Middle: code */}
                <div className="space-y-1 min-w-[150px]">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Code
                  </div>
                  <code className="font-mono text-xs text-violet-300">
                    {d.discountCode}
                  </code>
                  {d.discountValue != null && d.discountType && (
                    <p className="text-[11px] text-slate-400">
                      {d.discountType === "percentage"
                        ? `${d.discountValue}% off`
                        : `${d.discountValue} off`}
                    </p>
                  )}
                </div>

                {/* Right: time */}
                <div className="text-xs text-slate-500 min-w-[120px] md:text-right">
                  {formatDateTime(d.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentDropsCard;
