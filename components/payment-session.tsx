"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Info,
  LoaderCircle,
  ReceiptText,
  Store,
} from "lucide-react";
import { useSession } from "@/components/use-session";
import { QrModal } from "@/components/qr-modal";
import { PaymentCard } from "@/components/payment-card";
import { Progress } from "@/components/progress";
import { Modal } from "@/components/ui/modal";
import { formatINR } from "@/lib/formatting";
import { buildUpiUrl } from "@/lib/upi";
import { getSession, updatePayment, updateSession } from "@/lib/storage";
import type { Payment, PaymentSession } from "@/lib/types";

function paymentUri(session: PaymentSession, payment: Payment) {
  return buildUpiUrl({
    vpa: session.vpa,
    name: session.merchantName,
    amount: payment.amountPaise / 100,
    transactionId: payment.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35),
    note: (session.invoice
      ? `Invoice ${session.invoice}`
      : "SplitUPI payment"
    ).slice(0, 80),
  });
}
export function SessionFallback({
  loading,
  error,
}: {
  loading: boolean;
  error?: string;
}) {
  return loading ? (
    <div className="loading-state">
      <LoaderCircle className="spin" size={20} />
      Loading your session…
    </div>
  ) : (
    <div className="empty-state">
      <h1>This session isn’t here.</h1>
      <p>
        {error ||
          "Sessions live in the browser where they were created. Open the original browser, or start a fresh payment."}
      </p>
      <Link href="/create" className="button button-primary">
        Create a payment <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export function PaymentSessionView({ id }: { id: string }) {
  const { session, loading, error: readError, refresh } = useSession(id);
  const [qrId, setQrId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [retryId, setRetryId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const closeQr = useCallback(() => setQrId(null), []);
  const closeConfirm = useCallback(() => setConfirmId(null), []);
  const closeRetry = useCallback(() => setRetryId(null), []);
  const closeCancel = useCallback(() => setCancelOpen(false), []);
  if (loading || !session)
    return <SessionFallback loading={loading} error={readError} />;
  const paid = session.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountPaise, 0);
  const paidCount = session.payments.filter((p) => p.status === "paid").length;
  const complete = paid === session.totalPaise;
  const cancelled = session.status === "cancelled";
  const nextIndex = session.payments.findIndex((p) => p.status === "pending");
  const qrPayment = session.payments.find((p) => p.id === qrId);
  const confirmPayment = session.payments.find((p) => p.id === confirmId);
  function fail(e: unknown) {
    setError(e instanceof Error ? e.message : "The change could not be saved.");
    refresh();
  }
  function canUse(paymentId: string) {
    const fresh = getSession(id);
    if (!fresh || fresh.status === "cancelled")
      throw new Error("This session is no longer active.");
    const index = fresh.payments.findIndex((p) => p.id === paymentId);
    const payment = fresh.payments[index];
    if (!payment || payment.status !== "pending")
      throw new Error("This payment has already been completed or cancelled.");
    if (
      !fresh.parallel &&
      fresh.payments.slice(0, index).some((p) => p.status !== "paid")
    )
      throw new Error("Confirm the previous payment first.");
    return { fresh, payment };
  }
  function openApp(paymentId: string, retry = false) {
    setError("");
    try {
      const { fresh, payment } = canUse(paymentId);
      if (fresh.isDemo) return;
      if (payment.openedAt && !retry) {
        setQrId(null);
        setRetryId(paymentId);
        return;
      }
      const uri = paymentUri(fresh, payment);
      updatePayment(id, paymentId, { openedAt: new Date().toISOString() });
      setQrId(null);
      setRetryId(null);
      setNotice(
        "UPI app launch requested. If no app opened, scan the QR from another device. Returning here does not confirm a payment.",
      );
      window.location.assign(uri);
    } catch (e) {
      fail(e);
    }
  }
  function showQr(paymentId: string) {
    setError("");
    try {
      const { fresh, payment } = canUse(paymentId);
      if (!fresh.isDemo && !payment.openedAt)
        updatePayment(id, paymentId, { openedAt: new Date().toISOString() });
      setQrId(paymentId);
    } catch (e) {
      fail(e);
    }
  }
  function markPaid() {
    if (!confirmId) return;
    try {
      updatePayment(id, confirmId, { status: "paid" });
      setConfirmId(null);
      setNotice("");
      setError("");
    } catch (e) {
      fail(e);
      setConfirmId(null);
    }
  }
  function cancel() {
    try {
      updateSession(id, { status: "cancelled" });
      setCancelOpen(false);
      setQrId(null);
      setConfirmId(null);
    } catch (e) {
      fail(e);
    }
  }
  return (
    <div className="container app-page payment-session-page">
      <nav className="breadcrumb" aria-label="Payment steps">
        <Link href="/create" aria-label="Back to create">
          <ArrowLeft size={12} />
        </Link>
        <span>Create</span>
        <ChevronRight size={11} />
        <span className="current">Pay</span>
        <ChevronRight size={11} />
        <span>Receipt</span>
      </nav>
      <div className="app-heading">
        <div>
          <div className="eyebrow">
            {cancelled
              ? "SESSION CANCELLED"
              : complete
                ? "EVERY REQUEST ACCOUNTED FOR"
                : "ONE BILL. ONE MERCHANT."}
          </div>
          <h1>
            {cancelled
              ? "This session is closed."
              : complete
                ? "That’s the whole bill."
                : "A little at a time."}
          </h1>
          <p>
            {complete
              ? "All payments have been manually marked paid."
              : "Pay in your UPI app. Keep track of it here."}
          </p>
        </div>
        <span className="badge">
          {session.isDemo ? "SAMPLE SESSION" : "MANUAL TRACKING"}
        </span>
      </div>
      {session.isDemo && (
        <div className="notice notice-demo">
          <Info size={17} />
          <p>
            <strong>Live demo. No money moves.</strong> Sample QR only. UPI app
            payments are disabled.{" "}
            <Link href="/create?demo=true">
              Use a real merchant UPI ID{" "}
              <ExternalLink size={10} style={{ display: "inline" }} />
            </Link>
          </p>
        </div>
      )}
      {cancelled && (
        <div className="notice">
          <Info size={17} />
          <p>
            This only cancels the local record. It does not reverse transfers or
            invalidate QRs already copied. Paid entries are retained.
          </p>
        </div>
      )}
      {(error || readError) && (
        <div className="notice" role="alert">
          <p className="error-text">{error || readError}</p>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          <Info size={17} />
          <p>{notice}</p>
        </div>
      )}
      <div className="session-layout">
        <aside className="panel session-summary">
          <div className="summary-merchant">
            <div className="merchant-emblem">
              <Store size={21} aria-hidden="true" />
            </div>
            <div className="summary-merchant-details">
              <h2>{session.merchantName}</h2>
              <p className="vpa-line">{session.vpa}</p>
              {session.invoice && (
                <div className="invoice-line" title={session.invoice}>{session.invoice}</div>
              )}
            </div>
          </div>
          <div className="summary-amounts">
            <div>
              <div className="total-label">Total bill</div>
              <div className="session-total">{formatINR(session.totalPaise)}</div>
            </div>
            <div className="summary-remaining">
              <span>Remaining</span>
              <strong>{formatINR(session.totalPaise - paid)}</strong>
            </div>
          </div>
          <Progress paidPaise={paid} totalPaise={session.totalPaise} />
          <div className="summary-foot">
            <span>{paidCount} of {session.payments.length} requests completed</span>
            <span>Manual record · not bank-verified</span>
          </div>
          {complete && (
            <Link
              href={`/receipt/${id}`}
              className="button button-primary"
              style={{ width: "100%", marginTop: 20 }}
            >
              View receipt <ArrowRight size={16} />
            </Link>
          )}
        </aside>
        <div className="session-payments">
          <div className="session-controls">
            <span>{session.payments.length} payment requests</span>
            <label className="switch-label">
              <input
                type="checkbox"
                checked={session.parallel}
                disabled={cancelled || complete}
                onChange={(e) => {
                  try {
                    updateSession(id, { parallel: e.target.checked });
                    setError("");
                  } catch (e) {
                    fail(e);
                  }
                }}
              />
              Parallel payments
            </label>
          </div>
          {session.parallel && !complete && !cancelled && (
            <p className="payment-help" style={{ margin: "-5px 0 16px" }}>
              Any pending request can be paid. Coordinate with your group to
              avoid paying the same request twice.
            </p>
          )}
          <div className="payment-list">
            {session.payments.map((payment, index) => {
              const isPaid = payment.status === "paid";
              const locked =
                !isPaid &&
                (cancelled ||
                  payment.status === "cancelled" ||
                  (!session.parallel && index !== nextIndex));
              return (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  index={index}
                  locked={locked}
                  cancelled={cancelled}
                  isDemo={session.isDemo}
                  isNext={!session.parallel && index === nextIndex && !cancelled}
                  onOpen={() => openApp(payment.id)}
                  onShowQr={() => showQr(payment.id)}
                  onConfirm={() => {
                    try {
                      canUse(payment.id);
                      setConfirmId(payment.id);
                    } catch (e) {
                      fail(e);
                    }
                  }}
                />
              );
            })}
          </div>
          <div className="session-bottom">
            <Link className="text-button" href="/about">
              <CircleHelp size={13} />
              How payment confirmation works
            </Link>
            {!cancelled && !complete && (
              <button
                className="text-button"
                onClick={() => setCancelOpen(true)}
              >
                Cancel session
              </button>
            )}
            {complete && (
              <Link className="text-button" href={`/receipt/${id}`}>
                <ReceiptText size={14} />
                Your receipt <ArrowRight size={12} />
              </Link>
            )}
            {cancelled && (
              <Link href="/create" className="button button-secondary">
                New payment <ArrowRight size={13} />
              </Link>
            )}
          </div>
        </div>
      </div>
      {qrPayment && qrPayment.status === "pending" && !cancelled && (
        <QrModal
          session={session}
          payment={qrPayment}
          uri={paymentUri(session, qrPayment)}
          onClose={closeQr}
          onOpen={() => openApp(qrPayment.id)}
        />
      )}
      {confirmPayment && (
        <Modal title="Confirm this payment" onClose={closeConfirm}>
          <p>
            Did you complete this{" "}
            <strong style={{ color: "var(--text)" }}>
              {formatINR(confirmPayment.amountPaise)}
            </strong>{" "}
            payment in your UPI app?
          </p>
          {session.isDemo && (
            <p style={{ marginTop: 12 }}>
              This is a sample session. Confirming simulates a completed
              request; no money moves.
            </p>
          )}
          <div className="notice" style={{ marginTop: 20, marginBottom: 0 }}>
            <Info size={16} />
            <p>
              <strong>Demo confirmation — not bank-verified.</strong>
              <br />
              This updates your local record only.
            </p>
          </div>
          <div className="modal-actions">
            <button className="button button-secondary" onClick={closeConfirm}>
              Cancel
            </button>
            <button className="button button-primary" onClick={markPaid}>
              Yes, mark paid <Check size={15} />
            </button>
          </div>
        </Modal>
      )}
      {retryId && (
        <Modal title="Check before paying again" onClose={closeRetry}>
          <p>
            You already opened this request. Check your UPI app’s transaction
            history first. If it succeeded, cancel this dialog and mark the
            request paid. Opening it again could lead to a duplicate transfer.
          </p>
          <div className="modal-actions">
            <button className="button button-secondary" onClick={closeRetry}>
              Cancel
            </button>
            <button
              className="button button-primary"
              onClick={() => openApp(retryId, true)}
            >
              Reopen request
            </button>
          </div>
        </Modal>
      )}
      {cancelOpen && (
        <Modal title="Cancel this session?" onClose={closeCancel}>
          <p>
            Pending requests will be closed in this browser. Confirmed entries
            remain. This does not reverse any money sent or invalidate a
            previously scanned QR.
          </p>
          <div className="modal-actions">
            <button className="button button-secondary" onClick={closeCancel}>
              Keep session
            </button>
            <button className="button button-danger" onClick={cancel}>
              Cancel session
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
