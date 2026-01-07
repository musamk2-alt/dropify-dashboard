"use client";

import { useState } from "react";

interface ExportButtonProps {
  twitchLogin: string;
}

export default function ExportButton({ twitchLogin }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

  const handleExport = async (filters: Record<string, string> = {}) => {
    setIsExporting(true);

    try {
      const params = new URLSearchParams(filters);
      const url = `${API_URL}/api/drops/${encodeURIComponent(twitchLogin)}/export?${params}`;

      console.log("[EXPORT] Downloading from:", url);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `dropify-${twitchLogin}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setShowFilters(false);
    } catch (error) {
      console.error("[EXPORT] Failed:", error);
      alert("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        disabled={isExporting}
        className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {isExporting ? "Exporting..." : "Export CSV"}
      </button>

      {showFilters && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowFilters(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-white/10 bg-slate-900 p-4 shadow-xl">
            <h3 className="mb-3 text-sm font-medium text-white">
              Export Filters
            </h3>

            <div className="space-y-2">
              {/* All drops */}
              <button
                onClick={() => handleExport({})}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                📊 All drops (entire history)
              </button>

              {/* Redeemed only */}
              <button
                onClick={() => handleExport({ redeemed: "true" })}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                ✅ Redeemed only (with revenue)
              </button>

              {/* Last 30 days */}
              <button
                onClick={() =>
                  handleExport({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                  })
                }
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                📅 Last 30 days
              </button>

              {/* Last 7 days */}
              <button
                onClick={() =>
                  handleExport({
                    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                  })
                }
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                📅 Last 7 days
              </button>

              {/* Viewer drops only */}
              <button
                onClick={() => handleExport({ type: "viewer" })}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                👤 Viewer drops only
              </button>

              {/* Global drops only */}
              <button
                onClick={() => handleExport({ type: "global" })}
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
              >
                🌍 Global drops only
              </button>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
