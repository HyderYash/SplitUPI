"use client";
import { useEffect, useState, useCallback } from "react";
import type { PaymentSession } from "@/lib/types";
import { getSession } from "@/lib/storage";
export function useSession(id: string) {
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(() => {
    try {
      setSession(getSession(id));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read your session.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const timeout = setTimeout(refresh, 0);
    window.addEventListener("storage", refresh);
    window.addEventListener("splitupi:storage", refresh);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("splitupi:storage", refresh);
    };
  }, [refresh]);
  return { session, loading, error, refresh };
}
