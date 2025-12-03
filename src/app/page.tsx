"use client";

import { useEffect, useState } from "react";
import RecentRedemptionsCard from "../components/RecentRedemptionsCard";
import StreamerSettingsCard from "../components/StreamerSettingsCard";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dropifybot.com";

type StreamerInfo = {
  twitchId: string;
  twitchLogin: string;
  displayName: string;
  email: string | null;
  connectedAt: string | null;
  shopifyConnected: boolean;
  shopifyStoreDomain: string | null;
  shopifyApiVersion?: string | null;
};

export default function HomePage() {
  const [login, setLogin] = useState<string | null>(null);
  const [streamer, setStreamer] = useState<StreamerInfo | null>(null);
  const [loadingStreamer, setLoadingStreamer] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For Shopify domain input when not connected
  const [shopDomain, setShopDomain] = useState("");
  const [shopifyMessage, setShopifyMessage] = useState<string | null>(null);

  // 1) Read ?login from URL and fetch streamer info
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get("login");

    if (!loginParam) {
      setLogin(null);
      setStreamer(null);
      return;
    }

    setLogin(loginParam);
    setLoadingStreamer(true);
    setError(null);

    fetch(`${API_URL}/api/streamers/${loginParam}/info`)
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status} – ${txt}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          const s: StreamerInfo = data.streamer;
          setStreamer(s);
          if (s.shopifyStoreDomain) setShopDomain(s.shopifyStoreDomain);
        } else {
          setError(data.error || "Unknown error");
        }
      })
      .catch((err) => {
        console.error("Streamer info error:", err);
        setError(err.message);
      })
      .finally(() => setLoadingStreamer(false));
  }, []);

  // 2) Twitch connect button
  const handleConnectTwitch = () => {
    window.location.href = `${API_URL}/api/auth/twitch/login`;
  };

  // 3) Shopify connect button (OAuth)
  const handleConnectShopify = () => {
    setShopifyMessage(null);
    const effectiveLogin =
      streamer?.twitchLogin || login || shopifyMessage || null;

    if (!effectiveLogin) {
      setShopifyMessage("Connect Twitch first so we know who you are.");
      return;
    }

    const domain =
      shopDomain ||
      window.prompt(
        "Enter your Shopify store domain (e.g. mystore.myshopify.com)"
      );

    if (!domain) return;

    window.location.href = `${API_URL}/api/shopify/auth/start?login=${encodeURIComponent(
      effectiveLogin.toLowerCase()
    )}&shop=${encodeURIComponent(domain.trim())}`;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="max-w-5xl w-full space-y-8">
        {/* HEADER */}
        <header className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">
            Dropify <span className="text-violet-400">Dashboard</span>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Connect your <span className="font-semibold">Twitch</span> and{" "}
            <span className="font-semibold">Shopify</span> so the bot can drop
            smart, 1-time discount codes live on stream.
          </p>
        </header>

        {/* STATUS BAR */}
        <section className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm">
          <div className="font-semibold mb-1">Connection status</div>

          {loadingStreamer && <div className="text-slate-400">Loading…</div>}

          {!loadingStreamer && !login && (
            <div className="text-slate-400">
              Twitch not connected yet. Click{" "}
              <span className="font-semibold">Connect with Twitch</span> to get
              started.
            </div>
          )}

          {!loadingStreamer && login && error && (
            <div className="text-red-400">
              Error for <code>{login}</code>: {error}
            </div>
          )}

          {!loadingStreamer && login && streamer && (
            <div className="space-y-1">
              <div>
                <span className="text-slate-400">Twitch:</span>{" "}
                <span className="font-semibold">
                  {streamer.displayName} ({streamer.twitchLogin})
                </span>
              </div>
              <div>
                <span className="text-slate-400">Shopify:</span>{" "}
                {streamer.shopifyConnected ? (
                  <span className="text-emerald-400">
                    connected ({streamer.shopifyStoreDomain})
                  </span>
                ) : (
                  <span className="text-yellow-400">
                    not connected yet – click Connect Shopify.
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* MAIN CARDS: TWITCH + SHOPIFY */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* LEFT – TWITCH */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs font-bold">
                1
              </span>
              Connect Twitch
            </div>

            <p className="text-sm text-slate-400">
              This lets Dropify see your channel and send messages as{" "}
              <span className="font-semibold">dropifybot</span> in your chat.
            </p>

            <button
              onClick={handleConnectTwitch}
              className="mt-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 transition font-semibold w-full"
            >
              Connect with Twitch
            </button>

            <p className="text-xs text-slate-500">
              After authorizing on Twitch, you&apos;ll be redirected back here
              automatically.
            </p>
          </div>

          {/* RIGHT – SHOPIFY (OAuth button) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">
                2
              </span>
              Connect Shopify
            </div>

            <p className="text-sm text-slate-400">
              Click connect to install the Dropify app in your store. Shopify
              will show you exactly which permissions it needs.
            </p>

            {!streamer?.shopifyConnected && (
              <div className="space-y-2 text-left">
                <label className="block text-xs uppercase tracking-wide text-slate-400">
                  Shopify store domain
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
                  placeholder="mystore.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                />
              </div>
            )}

            {shopifyMessage && (
              <p className="text-xs text-slate-300">{shopifyMessage}</p>
            )}

            <button
              onClick={handleConnectShopify}
              className="mt-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 transition font-semibold w-full"
            >
              {streamer?.shopifyConnected
                ? "Reconnect Shopify"
                : "Connect Shopify"}
            </button>

            <p className="text-xs text-slate-500 mt-2">
              Once Twitch + Shopify are connected, your <code>!discount</code>{" "}
              and <code>!drop</code> commands are ready to go.
            </p>
          </div>
        </section>

        {/* STREAMER SETTINGS */}
        <StreamerSettingsCard login={login} />

        {/* RECENT REDEMPTIONS */}
        {login && (
          <section>
            <RecentRedemptionsCard login={login} limit={10} />
          </section>
        )}
      </div>
    </main>
  );
}
