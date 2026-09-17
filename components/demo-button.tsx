"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LoaderCircle, Play } from "lucide-react";
import { createSession } from "@/lib/storage";

export function DemoButton({
  variant = "secondary",
  children,
}: {
  variant?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const starting = useRef(false);
  function start() {
    if (starting.current) return;
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      const session = createSession({
        merchantName: "The Bombay Bistro",
        vpa: "demo@upi",
        invoice: "TABLE-42",
        totalPaise: 600000,
        chunksPaise: [200000, 200000, 200000],
        isDemo: true,
      });
      router.push(`/session/${session.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save the demo session.",
      );
      setBusy(false);
      starting.current = false;
    }
  }
  return (
    <div className="demo-button-wrap">
      <button
        className={`button button-${variant}`}
        onClick={start}
        disabled={busy}
      >
        {busy ? (
          <LoaderCircle className="spin" size={16} />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        {children || "Live demo"}
        <ArrowUpRight size={16} />
      </button>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
