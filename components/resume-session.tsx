"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { getLatestSession, STORAGE_EVENT } from "@/lib/storage";
import type { PaymentSession } from "@/lib/types";

export function ResumeSession() {
  const [session, setSession] = useState<PaymentSession | null>(null);

  useEffect(() => {
    function loadLatest() {
      try {
        setSession(getLatestSession());
      } catch {
        // An unavailable browser store should not block the landing page.
        setSession(null);
      }
    }
    const timer = window.setTimeout(loadLatest, 0);
    window.addEventListener("storage", loadLatest);
    window.addEventListener(STORAGE_EVENT, loadLatest);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", loadLatest);
      window.removeEventListener(STORAGE_EVENT, loadLatest);
    };
  }, []);

  if (!session || session.status === "cancelled") return null;
  const complete = session.payments.every(
    (payment) => payment.status === "paid",
  );

  return (
    <Link
      href={`/${complete ? "receipt" : "session"}/${session.id}`}
      className="text-button resume-session-link"
      style={{ marginTop: 12, color: "var(--muted)", gap: 7 }}
    >
      <RotateCcw size={13} aria-hidden="true" />
      {complete ? "View your last receipt" : "Resume your session"}
      <ArrowRight size={13} aria-hidden="true" />
    </Link>
  );
}
