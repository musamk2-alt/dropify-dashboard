"use client";

import React, {
  type ReactNode,
  useEffect,
  useState,
} from "react";

import {
  Bot,
  Check,
  Clock3,
  Gift,
  MessageSquareText,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { apiFetch } from "@/lib/api-fetch";
import {
  getErrorMessage,
  isAbortError,
} from "@/lib/error-utils";

import { Button } from "./ui/button";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

type Settings = {
  enabled: boolean;

  discountType:
    | "percentage"
    | "fixed_amount";

  discountValue: number;

  discountPrefix: string;

  maxPerViewerPerStream: number;

  globalCooldownSeconds: number;

  orderMinSubtotal: number;

  autoEnableOnStreamStart: boolean;

  claimChatMode:
    | "reply_link"
    | "pinned"
    | "silent";
};

interface StreamerSettingsCardProps {
  login: string | null;
}

interface SettingsSectionProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

const defaultSettings: Settings = {
  enabled: true,

  discountType:
    "percentage",

  discountValue: 10,

  discountPrefix:
    "DROP-",

  maxPerViewerPerStream: 1,

  globalCooldownSeconds: 120,

  orderMinSubtotal: 0,

  autoEnableOnStreamStart:
    false,

  claimChatMode:
    "reply_link",
};

function normalizeClaimChatMode(
  value: unknown
): Settings["claimChatMode"] {
  if (value === "pinned") {
    return "pinned";
  }

  if (value === "silent") {
    return "silent";
  }

  return "reply_link";
}

function normalizeSettings(
  value:
    | Partial<Settings>
    | null
    | undefined
): Settings {
  return {
    ...defaultSettings,
    ...(value || {}),

    claimChatMode:
      normalizeClaimChatMode(
        value?.claimChatMode
      ),
  };
}

function SettingsSection({
  eyebrow,
  title,
  description,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0b0f17]">
      <div className="border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-violet-300">
            {icon}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              {eyebrow}
            </p>

            <h3 className="mt-1 text-sm font-semibold text-slate-100">
              {title}
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function FieldLabel({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <label className="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {children}
    </label>
  );
}

const inputClassName =
  "mt-2 h-10 w-full rounded-xl border border-slate-700/80 bg-[#050914] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60";

function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel}
      />

      <span className="h-6 w-11 rounded-full border border-slate-700 bg-slate-800 transition peer-checked:border-emerald-500/50 peer-checked:bg-emerald-500/90 peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />

      <span
        className={[
          "pointer-events-none absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-slate-200 shadow-sm transition-transform",
          checked
            ? "translate-x-5"
            : "",
        ].join(" ")}
      />
    </label>
  );
}

interface PresetOption {
  label: string;
  value: number;
}

function PresetButtons({
  options,
  value,
  onSelect,
  customActive = false,
}: {
  options: PresetOption[];
  value: number;
  onSelect: (value: number) => void;
  customActive?: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => {
        const active =
          value === option.value;

        return (
          <button
            key={option.label}
            type="button"
            onClick={() =>
              onSelect(option.value)
            }
            className={[
              "rounded-lg border px-3 py-1.5 text-[11px] font-medium transition",
              active
                ? "border-violet-500/50 bg-violet-500/10 text-violet-200"
                : "border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-700 hover:text-slate-300",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}

      <span
        className={[
          "rounded-lg border px-3 py-1.5 text-[11px] font-medium",
          customActive
            ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
            : "border-slate-800 bg-slate-950 text-slate-600",
        ].join(" ")}
      >
        Custom
      </span>
    </div>
  );
}

const StreamerSettingsCard:
  React.FC<
    StreamerSettingsCardProps
  > = ({
    login,
  }) => {
    const [
      settings,
      setSettings,
    ] =
      useState<Settings>(
        defaultSettings
      );

    const [
      savedSettings,
      setSavedSettings,
    ] =
      useState<Settings>(
        defaultSettings
      );

    const [
      loading,
      setLoading,
    ] =
      useState(false);

    const [
      saving,
      setSaving,
    ] =
      useState(false);

    const [
      error,
      setError,
    ] =
      useState<
        string | null
      >(null);

    const [
      savedMessage,
      setSavedMessage,
    ] =
      useState<
        string | null
      >(null);

    useEffect(() => {
      if (!login) {
        return;
      }

      const currentLogin:
        string =
        login;

      const controller =
        new AbortController();

      async function load() {
        try {
          setLoading(true);
          setError(null);
          setSavedMessage(
            null
          );

          const res =
            await apiFetch(
              `${API_URL}/api/settings/${encodeURIComponent(
                currentLogin
              )}`,
              {
                method:
                  "GET",

                signal:
                  controller.signal,
              }
            );

          if (!res.ok) {
            const txt =
              await res.text();

            throw new Error(
              `HTTP ${res.status} – ${txt}`
            );
          }

          const data =
            await res.json();

          if (!data.ok) {
            throw new Error(
              data.error ||
                "Failed to load settings."
            );
          }

          const normalized =
            normalizeSettings(
              data.settings
            );

          setSettings(
            normalized
          );

          setSavedSettings(
            normalized
          );
        } catch (
          err: unknown
        ) {
          if (
            isAbortError(
              err
            )
          ) {
            return;
          }

          console.error(
            "[StreamerSettingsCard] load error",
            err
          );

          setError(
            getErrorMessage(
              err,
              "Failed to load settings."
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
    }, [login]);

    useEffect(() => {
      if (!savedMessage) {
        return;
      }

      const timeout =
        window.setTimeout(
          () => {
            setSavedMessage(
              null
            );
          },
          2200
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    }, [savedMessage]);

    const handleChange =
      (
        field:
          keyof Settings
      ) =>
      (
        e:
          React.ChangeEvent<
            | HTMLInputElement
            | HTMLSelectElement
          >
      ) => {
        const value =
          e.target.value;

        setSettings(
          (prev) => {
            if (
              field ===
                "enabled" ||
              field ===
                "autoEnableOnStreamStart"
            ) {
              return {
                ...prev,

                [field]:
                  (
                    e.target as HTMLInputElement
                  ).checked,
              };
            }

            if (
              field ===
                "discountValue" ||
              field ===
                "maxPerViewerPerStream" ||
              field ===
                "globalCooldownSeconds" ||
              field ===
                "orderMinSubtotal"
            ) {
              return {
                ...prev,

                [field]:
                  Number(
                    value
                  ) || 0,
              };
            }

            if (
              field ===
              "discountType"
            ) {
              return {
                ...prev,

                discountType:
                  value ===
                  "fixed_amount"
                    ? "fixed_amount"
                    : "percentage",
              };
            }

            if (
              field ===
              "claimChatMode"
            ) {
              return {
                ...prev,

                claimChatMode:
                  normalizeClaimChatMode(
                    value
                  ),
              };
            }

            return {
              ...prev,
              [field]:
                value,
            };
          }
        );

        setSavedMessage(
          null
        );
      };

    const handleSave =
      async () => {
        if (
          !login ||
          !hasUnsavedChanges ||
          saving
        ) {
          return;
        }

        const currentLogin:
          string =
          login;

        try {
          setSaving(
            true
          );

          setError(
            null
          );

          setSavedMessage(
            null
          );

          const res =
            await apiFetch(
              `${API_URL}/api/settings/${encodeURIComponent(
                currentLogin
              )}`,
              {
                method:
                  "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    settings
                  ),
              }
            );

          if (!res.ok) {
            const txt =
              await res.text();

            throw new Error(
              `HTTP ${res.status} – ${txt}`
            );
          }

          const data =
            await res.json();

          if (!data.ok) {
            throw new Error(
              data.error ||
                "Failed to save settings."
            );
          }

          const normalized =
            normalizeSettings(
              data.settings
            );

          setSettings(
            normalized
          );

          setSavedSettings(
            normalized
          );

          setSavedMessage(
            "Campaign saved."
          );
        } catch (
          err: unknown
        ) {
          console.error(
            "[StreamerSettingsCard] save error",
            err
          );

          setError(
            getErrorMessage(
              err,
              "Failed to save settings."
            )
          );
        } finally {
          setSaving(
            false
          );
        }
      };

    const hasUnsavedChanges =
      JSON.stringify(
        settings
      ) !==
      JSON.stringify(
        savedSettings
      );

    useEffect(() => {
      if (!hasUnsavedChanges) {
        return;
      }

      const handleBeforeUnload = (
        event: BeforeUnloadEvent
      ) => {
        event.preventDefault();

        event.returnValue =
          "";
      };

      window.addEventListener(
        "beforeunload",
        handleBeforeUnload
      );

      return () => {
        window.removeEventListener(
          "beforeunload",
          handleBeforeUnload
        );
      };
    }, [hasUnsavedChanges]);

    const disabled =
      !login;

    const discountLabel =
      settings.discountType ===
      "percentage"
        ? `${settings.discountValue}% OFF`
        : `${settings.discountValue} off`;

    const viewerLimitLabel =
      settings.maxPerViewerPerStream ===
      0
        ? "Unlimited"
        : `${settings.maxPerViewerPerStream} per stream`;

    const cooldownLabel =
      settings.globalCooldownSeconds ===
      0
        ? "No cooldown"
        : `${settings.globalCooldownSeconds}s`;

    const minimumOrderLabel =
      settings.orderMinSubtotal > 0
        ? `${settings.orderMinSubtotal} minimum`
        : "No minimum";

    const responseLabel =
      settings.claimChatMode ===
      "silent"
        ? "Silent"
        : settings.claimChatMode ===
            "pinned"
          ? "Pinned link"
          : "Claim link";

    const chatPreview =
      settings.claimChatMode ===
      "silent"
        ? "No success message is posted in chat."
        : settings.claimChatMode ===
            "pinned"
          ? "@viewer Your discount is ready — use the pinned DropifyBot claim link."
          : "@viewer Your discount is ready: dropifybot.com/claim";

    if (!login) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-[#0b0f17] p-8 text-center">
          <Bot className="mx-auto h-6 w-6 text-violet-300" />

          <p className="mt-3 text-sm font-medium text-slate-200">
            Connect Twitch first
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Connect your channel before configuring DropifyBot campaign behavior.
          </p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

          <div className="h-72 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />

          <div className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-[#0b0f17]" />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {/* CAMPAIGN STATUS */}
        <section
          className={[
            "overflow-hidden rounded-2xl border",
            settings.enabled
              ? "border-emerald-500/20 bg-[linear-gradient(110deg,rgba(16,185,129,0.08),rgba(11,15,23,0.98)_45%)]"
              : "border-amber-500/20 bg-[linear-gradient(110deg,rgba(245,158,11,0.07),rgba(11,15,23,0.98)_45%)]",
          ].join(" ")}
        >
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  settings.enabled
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-amber-500/10 text-amber-300",
                ].join(" ")}
              >
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Campaign status
                  </h3>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                      settings.enabled
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "bg-amber-500/10 text-amber-300",
                    ].join(" ")}
                  >
                    {settings.enabled
                      ? "Active"
                      : "Paused"}
                  </span>
                </div>

                <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                  {settings.enabled
                    ? "DropifyBot can create new discounts when viewers use your configured commands."
                    : "DropifyBot will not create new discount codes while this campaign is paused."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-400">
                {settings.enabled
                  ? "Enabled"
                  : "Disabled"}
              </span>

              <Toggle
                checked={
                  settings.enabled
                }
                onChange={
                  handleChange(
                    "enabled"
                  )
                }
                disabled={
                  disabled
                }
                ariaLabel="Enable DropifyBot campaign"
              />
            </div>
          </div>
        </section>

        {/* LIVE CAMPAIGN SUMMARY */}
        <section className="rounded-2xl border border-slate-800/90 bg-[#0b0f17] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Live summary
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-100">
                Current campaign configuration
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Updates instantly while you edit. Changes are not live until you save.
              </p>
            </div>

            {hasUnsavedChanges && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1 text-[10px] font-medium text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Previewing unsaved changes
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: "Offer",
                value: discountLabel,
              },
              {
                label: "Viewer limit",
                value: viewerLimitLabel,
              },
              {
                label: "Cooldown",
                value: cooldownLabel,
              },
              {
                label: "Minimum order",
                value: minimumOrderLabel,
              },
              {
                label: "Chat response",
                value: responseLabel,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-[#050914] px-4 py-3"
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                  {item.label}
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* DISCOUNT RULES */}
        <div
          id="discount-rules"
          className="scroll-mt-24"
        >
          <SettingsSection
          eyebrow="Discount rules"
          title="Configure the offer"
          description="Define what viewers receive when DropifyBot creates a personal discount."
          icon={
            <Gift className="h-4 w-4" />
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel>
                Discount type
              </FieldLabel>

              <select
                className={
                  inputClassName
                }
                value={
                  settings.discountType
                }
                onChange={
                  handleChange(
                    "discountType"
                  )
                }
                disabled={
                  disabled
                }
              >
                <option value="percentage">
                  Percentage (%)
                </option>

                <option value="fixed_amount">
                  Fixed amount
                </option>
              </select>

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Choose percentage-based or fixed-value discounts.
              </p>
            </div>

            <div>
              <FieldLabel>
                Discount value
              </FieldLabel>

              <input
                type="number"
                min={0}
                className={
                  inputClassName
                }
                value={
                  settings.discountValue
                }
                onChange={
                  handleChange(
                    "discountValue"
                  )
                }
                disabled={
                  disabled
                }
              />

              <PresetButtons
                options={[
                  { label: "5", value: 5 },
                  { label: "10", value: 10 },
                  { label: "15", value: 15 },
                  { label: "20", value: 20 },
                  { label: "25", value: 25 },
                ]}
                value={settings.discountValue}
                onSelect={(value) => {
                  setSettings((previous) => ({
                    ...previous,
                    discountValue: value,
                  }));

                  setSavedMessage(null);
                }}
                customActive={
                  ![5, 10, 15, 20, 25].includes(
                    settings.discountValue
                  )
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                {settings.discountType ===
                "percentage"
                  ? `${settings.discountValue}% off the eligible order.`
                  : `${settings.discountValue} in your Shopify store currency.`}
              </p>
            </div>

            <div>
              <FieldLabel>
                Discount code prefix
              </FieldLabel>

              <input
                type="text"
                className={`${inputClassName} font-mono`}
                value={
                  settings.discountPrefix
                }
                onChange={
                  handleChange(
                    "discountPrefix"
                  )
                }
                disabled={
                  disabled
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Example:{" "}
                <span className="font-mono text-slate-400">
                  {settings.discountPrefix}
                  ABC123
                </span>
              </p>
            </div>

            <div>
              <FieldLabel>
                Minimum order subtotal
              </FieldLabel>

              <input
                type="number"
                min={0}
                className={
                  inputClassName
                }
                value={
                  settings.orderMinSubtotal
                }
                onChange={
                  handleChange(
                    "orderMinSubtotal"
                  )
                }
                disabled={
                  disabled
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                {settings.orderMinSubtotal >
                0
                  ? `Orders must reach at least ${settings.orderMinSubtotal} in store currency.`
                  : "No minimum subtotal is currently required."}
              </p>
            </div>
          </div>
          </SettingsSection>
        </div>

        {/* VIEWER LIMITS */}
        <div
          id="viewer-limits"
          className="scroll-mt-24"
        >
          <SettingsSection
          eyebrow="Viewer limits"
          title="Protect your campaign"
          description="Control how frequently viewers can receive discounts and reduce abuse during busy streams."
          icon={
            <ShieldCheck className="h-4 w-4" />
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel>
                Max discounts per viewer, per stream
              </FieldLabel>

              <input
                type="number"
                min={0}
                className={
                  inputClassName
                }
                value={
                  settings.maxPerViewerPerStream
                }
                onChange={
                  handleChange(
                    "maxPerViewerPerStream"
                  )
                }
                disabled={
                  disabled
                }
              />

              <PresetButtons
                options={[
                  { label: "1", value: 1 },
                  { label: "3", value: 3 },
                  { label: "5", value: 5 },
                  { label: "10", value: 10 },
                  { label: "Unlimited", value: 0 },
                ]}
                value={settings.maxPerViewerPerStream}
                onSelect={(value) => {
                  setSettings((previous) => ({
                    ...previous,
                    maxPerViewerPerStream: value,
                  }));

                  setSavedMessage(null);
                }}
                customActive={
                  ![0, 1, 3, 5, 10].includes(
                    settings.maxPerViewerPerStream
                  )
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                {settings.maxPerViewerPerStream ===
                0
                  ? "Unlimited viewer claims. This is not recommended for most campaigns."
                  : `${settings.maxPerViewerPerStream} discount${
                      settings.maxPerViewerPerStream ===
                      1
                        ? ""
                        : "s"
                    } per viewer during each stream.`}
              </p>
            </div>

            <div>
              <FieldLabel>
                Global cooldown
              </FieldLabel>

              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-5 h-4 w-4 text-slate-600" />

                <input
                  type="number"
                  min={0}
                  className={`${inputClassName} pl-10`}
                  value={
                    settings.globalCooldownSeconds
                  }
                  onChange={
                    handleChange(
                      "globalCooldownSeconds"
                    )
                  }
                  disabled={
                    disabled
                  }
                />
              </div>

              <PresetButtons
                options={[
                  { label: "30 sec", value: 30 },
                  { label: "60 sec", value: 60 },
                  { label: "120 sec", value: 120 },
                  { label: "300 sec", value: 300 },
                ]}
                value={settings.globalCooldownSeconds}
                onSelect={(value) => {
                  setSettings((previous) => ({
                    ...previous,
                    globalCooldownSeconds: value,
                  }));

                  setSavedMessage(null);
                }}
                customActive={
                  ![30, 60, 120, 300].includes(
                    settings.globalCooldownSeconds
                  )
                }
              />

              <p className="mt-2 text-[11px] leading-5 text-slate-600">
                Minimum time between new discount drops across viewers:{" "}
                <span className="font-medium text-slate-400">
                  {settings.globalCooldownSeconds}
                  s
                </span>
                .
              </p>
            </div>
          </div>
          </SettingsSection>
        </div>

        {/* CHAT BEHAVIOR */}
        <div
          id="chat-behavior"
          className="scroll-mt-24"
        >
          <SettingsSection
          eyebrow="Chat behavior"
          title="Choose the viewer experience"
          description="The claim remains private. This setting only changes what DropifyBot posts in Twitch chat."
          icon={
            <MessageSquareText className="h-4 w-4" />
          }
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div>
              <FieldLabel>
                !discount response
              </FieldLabel>

              <select
                className={
                  inputClassName
                }
                value={
                  settings.claimChatMode
                }
                onChange={
                  handleChange(
                    "claimChatMode"
                  )
                }
                disabled={
                  disabled
                }
              >
                <option value="reply_link">
                  Reply with the full claim link
                </option>

                <option value="pinned">
                  Tell viewer to use the pinned link
                </option>

                <option value="silent">
                  Silent — send no success message
                </option>
              </select>

              <div className="mt-4 rounded-xl border border-slate-800 bg-[#050914] p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />

                  <p className="text-xs font-medium text-slate-300">
                    Private claim protection stays enabled
                  </p>
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-600">
                  DropifyBot creates the viewer&apos;s private claim regardless of which chat response mode you choose.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-400">
                Chat preview
              </p>

              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-[#050914]">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Twitch chat
                  </p>

                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live preview
                  </span>
                </div>

                <div className="p-4">
                  {chatPreview ? (
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-[10px] font-bold text-violet-300">
                        D
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-violet-300">
                            DropifyBot
                          </span>

                          <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-600">
                            Bot
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-300">
                          {chatPreview}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 text-center">
                      <MessageSquareText className="mx-auto h-5 w-5 text-slate-700" />

                      <p className="mt-2 text-xs font-medium text-slate-500">
                        Silent mode
                      </p>

                      <p className="mt-1 text-[11px] text-slate-700">
                        DropifyBot will create the private claim without posting a success message.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </SettingsSection>
        </div>

        {/* BOT BEHAVIOR */}
        <div
          id="bot-behavior"
          className="scroll-mt-24"
        >
          <SettingsSection
          eyebrow="Bot behavior"
          title="Control stream automation"
          description="Choose how DropifyBot should behave when your Twitch stream changes state."
          icon={
            <Bot className="h-4 w-4" />
          }
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-slate-200">
                Auto-enable when you go live
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Automatically enable discount creation when your stream starts, provided DropifyBot is connected to the channel.
              </p>
            </div>

            <Toggle
              checked={
                settings.autoEnableOnStreamStart
              }
              onChange={
                handleChange(
                  "autoEnableOnStreamStart"
                )
              }
              disabled={
                disabled
              }
              ariaLabel="Auto-enable DropifyBot when stream starts"
            />
          </div>

          <div className="mt-5 border-t border-slate-800 pt-5">
            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#050914] p-4">
              <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <div>
                <p className="text-xs font-medium text-slate-300">
                  More automation is coming
                </p>

                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Future campaign controls can live here without changing the core configuration experience.
                </p>
              </div>
            </div>
          </div>
          </SettingsSection>
        </div>

        {/* SAVE BAR */}
        <div className="sticky bottom-4 z-20">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-[#090d15]/95 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {error ? (
                <>
                  <p className="text-xs font-medium text-red-300">
                    Campaign could not be saved
                  </p>

                  <p className="mt-0.5 text-[11px] text-red-400/80">
                    {error}
                  </p>
                </>
              ) : savedMessage ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
                    <Check className="h-4 w-4" />
                    Campaign saved
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Your latest configuration is live.
                  </p>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />

                    <p className="text-xs font-medium text-amber-200">
                      Unsaved changes
                    </p>
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Save to apply your new campaign configuration.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400" />

                    <p className="text-xs font-medium text-slate-300">
                      Everything saved
                    </p>
                  </div>

                  <p className="mt-0.5 text-[11px] text-slate-600">
                    DropifyBot is using your latest campaign configuration.
                  </p>
                </>
              )}
            </div>

            <Button
              type="button"
              onClick={
                handleSave
              }
              disabled={
                disabled ||
                saving ||
                !hasUnsavedChanges
              }
              isLoading={
                saving
              }
              className="shrink-0 px-5"
            >
              <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                {!saving && (
                  hasUnsavedChanges ? (
                    <Save className="h-4 w-4 shrink-0" />
                  ) : (
                    <Check className="h-4 w-4 shrink-0" />
                  )
                )}

                <span>
                  {saving
                    ? "Saving…"
                    : hasUnsavedChanges
                      ? "Save campaign"
                      : "Saved"}
                </span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

export default StreamerSettingsCard;
