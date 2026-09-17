"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  ReceiptText,
} from "lucide-react";
import { Logo } from "@/components/app-shell";
import { useSession } from "@/components/use-session";
import { SessionFallback } from "@/components/payment-session";
import { formatINR } from "@/lib/formatting";
export function ReceiptView({ id }: { id: string }) {
  const { session, loading, error } = useSession(id);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  if (loading || !session)
    return <SessionFallback loading={loading} error={error} />;
  const complete = session.payments.every((p) => p.status === "paid");
  if (!complete)
    return (
      <div className="empty-state">
        <ReceiptText size={35} style={{ margin: "0 auto 20px" }} />
        <h1>A few requests to go.</h1>
        <p>
          Your receipt will be ready when every payment has been manually
          confirmed.
        </p>
        <Link href={`/session/${id}`} className="button button-primary">
          Back to payments <ArrowRight size={15} />
        </Link>
      </div>
    );
  async function copyDemo() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/demo`);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError(`Copy this demo link: ${window.location.origin}/demo`);
    }
  }
  const date = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(session.createdAt));
  return (
    <div className="container app-page receipt-page">
      <Link href={`/session/${id}`} className="breadcrumb">
        <ArrowLeft size={12} />
        Back to session
      </Link>
      <div className="receipt-header">
        <div className="completion-icon">
          <Check size={26} />
        </div>
        <div className="eyebrow">PAYMENT COMPLETE · MANUAL RECORD</div>
        <h1>{formatINR(session.totalPaise)} collected</h1>
        <p>{session.payments.length} payment requests completed</p>
        <span className="badge">
          {session.isDemo
            ? "Sample demo · no money moved"
            : "Self-reported · not bank-verified"}
        </span>
      </div>
      <div className="receipt-paper">
        <div className="receipt-brand">
          <Logo />
          <span className="eyebrow">PAYMENT SUMMARY</span>
        </div>
        <div className="receipt-merchant">
          <div>
            <h2>{session.merchantName}</h2>
            <p>{session.vpa}</p>
            {session.invoice && <p>{session.invoice}</p>}
          </div>
          <div>
            {date}
            <br />
            {session.isDemo ? "SAMPLE RECEIPT" : "LOCAL PAYMENT RECORD"}
          </div>
        </div>
        {session.payments.map((p, i) => (
          <div key={p.id} className="receipt-row">
            <span>
              Payment {String(i + 1).padStart(2, "0")}
              <small className="receipt-confirmed-label">
                Manually confirmed
              </small>
            </span>
            <span>
              {formatINR(p.amountPaise)}
              <Check size={13} />
            </span>
          </div>
        ))}
        <div className="receipt-grand-total">
          <span>
            Total marked paid
            <br />
            <small className="muted">
              {session.payments.length} payment requests
            </small>
          </span>
          <strong>{formatINR(session.totalPaise)}</strong>
        </div>
        <div className="receipt-notice">
          <strong>Demo confirmation — not bank-verified.</strong>{" "}
          {session.isDemo
            ? "This is a sample receipt. No payment was initiated."
            : "This record reflects manual confirmations, not proof of bank settlement. Verify transfers in the merchant’s bank or PSP records."}
        </div>
        <div className="receipt-id">SESSION {session.id}</div>
      </div>
      <div className="receipt-actions">
        <button
          className="button button-primary"
          onClick={() => window.print()}
        >
          <Download size={15} />
          Download receipt
        </button>
        <Link href="/create" className="button button-secondary">
          New payment
          <ArrowRight size={15} />
        </Link>
      </div>
      <p className="payment-help no-print" style={{ textAlign: "center" }}>
        Choose “Save as PDF” in your browser’s print dialog.
      </p>
      <div className="share-card">
        <div>
          <div className="eyebrow">SMALL EXPERIMENT. REAL POSSIBILITIES.</div>
          <h3>I built SplitUPI.</h3>
          <p>
            {formatINR(session.totalPaise)} bill → {session.payments.length}{" "}
            requests → {formatINR(session.totalPaise)} marked collected
          </p>
          <p style={{ marginTop: 5 }}>
            Manual demo confirmation · not bank-verified
          </p>
        </div>
        <button onClick={copyDemo} className="button button-secondary">
          {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
          {copied ? "Demo link copied" : "Copy demo link"}
        </button>
      </div>
      {copyError && (
        <p className="error-text" role="status">
          {copyError}
        </p>
      )}
    </div>
  );
}
