"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";

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
            discountType:
              value === "fixed_amount" ? "fixed_amount" : "percentage",
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-200">
            3
          </span>
          <div className="space-y-0.5">
            <CardTitle className="text-sm sm:text-base">
              Streamer settings
            </CardTitle>
            <CardDescription>
              Configure how Dropify behaves when your chat uses !drop or
              !discount.
            </CardDescription>
          </div>
        </div>
        {login && (
          <span className="text-xs text-slate-500">
            For{" "}
            <span className="font-mono text-slate-300 whitespace-nowrap">
              {login}
            </span>
          </span>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
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
                  When disabled, the bot will not drop new discount codes even
                  if viewers use your commands.
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={settings.enabled}
                  onChange={handleChange("enabled")}
                  disabled={disabled}
                />
                <span className="relative h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-emerald-500">
                  <span
                    className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-slate-950 transition-transform ${
                      settings.enabled ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Discount type + value */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wide text-slate-400">
                  Discount type
                </label>
                <select
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  value={settings.discountValue}
                  onChange={handleChange("discountValue")}
                  disabled={disabled}
                />
                <p className="text-[11px] text-slate-500">
                  If percentage: 10 = 10% off. If fixed: 10 = 10 in your
                  store&apos;s currency.
                </p>
              </div>

              {/* Prefix */}
              <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wide text-slate-400">
                  Discount code prefix
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono"
                  value={settings.discountPrefix}
                  onChange={handleChange("discountPrefix")}
                  disabled={disabled}
                />
                <p className="text-[11px] text-slate-500">
                  Codes will start with this, e.g.{" "}
                  <span className="font-mono">
                    {settings.discountPrefix}ABC123
                  </span>
                  .
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
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
                  If enabled, Dropify will automatically start dropping
                  discounts when your stream is live (once the bot is in your
                  channel).
                </div>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={settings.autoEnableOnStreamStart}
                  onChange={handleChange("autoEnableOnStreamStart")}
                  disabled={disabled}
                />
                <span className="relative h-6 w-11 rounded-full bg-slate-700 transition peer-checked:bg-violet-500">
                  <span
                    className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-slate-950 transition-transform ${
                      settings.autoEnableOnStreamStart ? "translate-x-5" : ""
                    }`}
                  />
                </span>
              </label>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          These settings control how Dropify behaves in your channel.
        </div>
        <div className="flex items-center gap-3">
          {savedMessage && (
            <span className="text-xs text-emerald-400">{savedMessage}</span>
          )}
          {error && !loading && (
            <span className="text-xs text-red-400">{error}</span>
          )}
          <Button
            onClick={handleSave}
            disabled={disabled || saving}
            className="px-4"
          >
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StreamerSettingsCard;
