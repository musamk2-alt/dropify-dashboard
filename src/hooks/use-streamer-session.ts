"use client";

import {
  useEffect,
  useState,
} from "react";

import { apiFetch } from "@/lib/api-fetch";
import type { StreamerInfo } from "@/types/streamer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dropifybot.com";

interface StreamerSessionState {
  streamer: StreamerInfo | null;
  loading: boolean;
  error: string | null;
  authenticated: boolean;
}

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

export function useStreamerSession():
  StreamerSessionState {
  const [
    streamer,
    setStreamer,
  ] =
    useState<StreamerInfo | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadSession() {
      try {
        setLoading(true);
        setError(null);

        const response =
          await apiFetch(
            `${API_URL}/api/auth/session`,
            {
              method: "GET",
              signal:
                controller.signal,
            }
          );

        if (
          response.status ===
          401
        ) {
          setStreamer(null);
          return;
        }

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          !response.ok ||
          !data?.ok ||
          !data?.streamer
        ) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Failed to load your Dropify session."
          );
        }

        setStreamer(
          data.streamer as StreamerInfo
        );
      } catch (
        sessionError: unknown
      ) {
        if (
          isAbortError(
            sessionError
          )
        ) {
          return;
        }

        console.error(
          "[STREAMER SESSION]",
          sessionError
        );

        setStreamer(null);

        setError(
          getErrorMessage(
            sessionError,
            "Failed to load your Dropify session."
          )
        );
      } finally {
        setLoading(false);
      }
    }

    loadSession();

    return () => {
      controller.abort();
    };
  }, []);

  return {
    streamer,
    loading,
    error,
    authenticated:
      Boolean(streamer),
  };
}
