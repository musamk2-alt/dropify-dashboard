// /opt/dropify/dropify-dashboard/src/components/StreamerSettingsCard.tsx
"use client";

import React, { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type Settings = {
  enabled: boolean;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  discountPrefix: string;
  maxPerViewerPerStream: number;
  globalCooldownSeconds: number;
  orderMinSubtotal: number;
  autoEnableOnStreamStart: boolean;
};

interface StreamerSettingsCardProps {
  login: string | null;
}

const defaultSettings: Settings = {
  enabled: true,
  discountType: "percentage",
  discountValue: 10,
  discountPrefix: "DROP-",
  maxPerViewerPerStream: 1,
  globalCooldownSeconds: 120,
  orderMinSubtotal: 0,
  autoEnableOnStreamStart: false,
};

const StreamerSettingsCard: React.FC<StreamerSettingsCardProps> = ({
  login,
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Load settings on mount / when login changes
  useEffect(() => {
    if (!login) return;

    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError(null);
        setSavedMessage(null);

        const res = await fetch(
          `${API_URL}/api/settings/${encodeURIComponent(login ?? "")}`,
          {
            method: "GET",
            signal: controller.signal,
          }
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }

        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || "Failed to load settings.");
        }

        setSettings({
          ...defaultSettings,
          ...(data.settings || {}),
        });
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[StreamerSettingsCard] load error", err);
        setError(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }

    load();

    return () => controller.abort();
  }, [login]);

  const handleChange =
    (field: keyof Settings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setSettings((prev) => {
        if (field === "enabled" || field === "autoEnableOnStreamStart") {
          return { ...prev, [field]: (e.target as HTMLInputElement).checked };
        }
        if (
          field === "discountValue" ||
          field === "maxPerViewerPerStream" ||
          field === "globalCooldownSeconds" ||
          field === "orderMinSubtotal"
        ) {
          return { ...prev, [field]: Number(value) || 0 };
        }
        if (field === "discountType") {
          return {
            ...prev,
            discountType: value === "fixed_amount" ? "fixed_amount" : "percentage",
          };
        }
        return { ...prev, [field]: value };
      });
      setSavedMessage(null);
    };

  const handleSave = async () => {
    if (!login) return;
    try {
      setSaving(true);
      setError(null);
      setSavedMessage(null);

      const res = await fetch(
        `${API_URL}/api/settings/${encodeURIComponent(login ?? "")}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status} – ${txt}`);
      }

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSettings({
        ...defaultSettings,
        ...(data.settings || {}),
      });
      setSavedMessage("Settings saved.");
    } catch (err: any) {
      console.error("[StreamerSettingsCard] save error", err);
      setError(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const disabled = !login;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-200">
            3
          </span>
          Streamer settings
        </div>
        {login && (
          <span className="text-xs text-slate-500">
            For <span className="font-mono text-slate-300">{login}</span>
          </span>
        )}
      </div>

      {!login && (
        <p className="text-sm text-slate-400">
          Connect with Twitch first to configure Dropify for your channel.
        </p>
      )}

      {login && loading && (
        <p className="text-sm text-slate-400">Loading settings…</p>
      )}

      {login && !loading && error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {login && !loading && !error && (
        <>
          {/* Enabled toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-200">
                Enable Dropify
              </div>
              <div className="text-xs text-slate-400">
                When disabled, the bot will not drop new discount codes even if
                viewers use your commands.
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enabled}
                onChange={handleChange("enabled")}
                disabled={disabled}
              />
              <span className="w-11 h-6 bg-slate-700 peer-checked:bg-emerald-500 rounded-full transition relative">
                <span
                  className={`absolute top-[3px] left-[3px] w-5 h-5 bg-slate-950 rounded-full transition-transform ${
                    settings.enabled ? "translate-x-5" : ""
                  }`}
                />
              </span>
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Discount type + value */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Discount type
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={settings.discountType}
                onChange={handleChange("discountType")}
                disabled={disabled}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed amount</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Discount value
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={settings.discountValue}
                onChange={handleChange("discountValue")}
                disabled={disabled}
              />
              <p className="text-[11px] text-slate-500">
                If percentage: 10 = 10% off. If fixed: 10 = 10 in your store&apos;s
                currency.
              </p>
            </div>

            {/* Prefix */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Discount code prefix
              </label>
              <input
                type="text"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono"
                value={settings.discountPrefix}
                onChange={handleChange("discountPrefix")}
                disabled={disabled}
              />
              <p className="text-[11px] text-slate-500">
                Codes will start with this, e.g.{" "}
                <span className="font-mono">{settings.discountPrefix}ABC123</span>.
              </p>
            </div>

            {/* Min subtotal */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Minimum order subtotal
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={settings.orderMinSubtotal}
                onChange={handleChange("orderMinSubtotal")}
                disabled={disabled}
              />
              <p className="text-[11px] text-slate-500">
                Only apply discounts when the cart subtotal is at least this
                amount (store currency).
              </p>
            </div>

            {/* Per viewer limit */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Max redemptions per viewer (per stream)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={settings.maxPerViewerPerStream}
                onChange={handleChange("maxPerViewerPerStream")}
                disabled={disabled}
              />
              <p className="text-[11px] text-slate-500">
                1 is usually enough. Set to 0 for unlimited (not recommended).
              </p>
            </div>

            {/* Global cooldown */}
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-wide text-slate-400">
                Global cooldown (seconds)
              </label>
              <input
                type="number"
                min={0}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                value={settings.globalCooldownSeconds}
                onChange={handleChange("globalCooldownSeconds")}
                disabled={disabled}
              />
              <p className="text-[11px] text-slate-500">
                Minimum time between new discount drops across all viewers.
              </p>
            </div>
          </div>

          {/* Auto enable */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-4">
            <div className="space-y-1">
              <div className="text-sm font-medium text-slate-200">
                Auto-enable when you go live
              </div>
              <div className="text-xs text-slate-400">
                If enabled, Dropify will automatically start dropping discounts
                when your stream is live (once the bot is in your channel).
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoEnableOnStreamStart}
                onChange={handleChange("autoEnableOnStreamStart")}
                disabled={disabled}
              />
              <span className="w-11 h-6 bg-slate-700 peer-checked:bg-violet-500 rounded-full transition relative">
                <span
                  className={`absolute top-[3px] left-[3px] w-5 h-5 bg-slate-950 rounded-full transition-transform ${
                    settings.autoEnableOnStreamStart ? "translate-x-5" : ""
                  }`}
                />
              </span>
            </label>
          </div>

          {/* Save button + status */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500">
              These settings control how Dropify behaves in your channel.
            </div>
            <div className="flex items-center gap-3">
              {savedMessage && (
                <span className="text-xs text-emerald-400">
                  {savedMessage}
                </span>
              )}
              {error && (
                <span className="text-xs text-red-400">
                  {error}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={disabled || saving}
                className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-60 disabled:hover:bg-violet-500 transition text-sm font-semibold"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StreamerSettingsCard;
