"use client";

import {
  ArrowRight,
  Check,
  LockKeyhole,
  QrCode,
  Smartphone,
} from "lucide-react";
import { formatINR } from "@/lib/formatting";
import type { Payment } from "@/lib/types";

interface PaymentCardProps {
  payment: Payment;
  index: number;
  locked: boolean;
  cancelled: boolean;
  isDemo: boolean;
  isNext?: boolean;
  onOpen: () => void;
  onShowQr: () => void;
  onConfirm: () => void;
}

export function PaymentCard({
  payment,
  index,
  locked,
  cancelled,
  isDemo,
  isNext,
  onOpen,
  onShowQr,
  onConfirm,
}: PaymentCardProps) {
  const isPaid = payment.status === "paid";

  return (
    <article
      className={`panel payment-card ${isPaid ? "is-paid" : locked ? "is-locked" : "is-active"}`}
      data-testid={`payment-${index + 1}`}
      aria-label={`Payment ${index + 1}, ${formatINR(payment.amountPaise)}${isNext ? ", ready to pay" : ""}`}
    >
      <div className="payment-top">
        <div className="payment-heading">
          <span className="payment-number">
            {isPaid ? <Check size={14} /> : String(index + 1).padStart(2, "0")}
          </span>
          <h3>PAYMENT {index + 1}</h3>
        </div>
        <span className={`badge ${isPaid ? "badge-green" : ""}`}>
          {isPaid ? (
            <>
              <Check size={11} />
              Paid · manual
            </>
          ) : cancelled || payment.status === "cancelled" ? (
            "Cancelled"
          ) : locked ? (
            <>
              <LockKeyhole size={10} />
              Up next
            </>
          ) : (
            isNext ? "Ready to pay" : "Pending"
          )}
        </span>
      </div>
      <div className="payment-amount">{formatINR(payment.amountPaise)}</div>
      {!isPaid && (
        <div className="payment-actions">
          <button
            className="button button-primary"
            disabled={locked || isDemo}
            onClick={onOpen}
          >
            <Smartphone size={17} aria-hidden="true" />
            {payment.openedAt ? "Reopen UPI App" : "Open UPI App"}
          </button>
          <button
            className="button button-secondary"
            disabled={locked}
            onClick={onShowQr}
          >
            <QrCode size={17} aria-hidden="true" />
            Show QR
          </button>
          <button
            className="button confirm-button"
            disabled={locked}
            onClick={onConfirm}
          >
            Payment completed <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="payment-help">
        {isPaid
          ? "Manually confirmed in this browser. Not bank-verified."
          : cancelled
            ? "Request cancelled locally."
            : locked
              ? "Confirm the previous request to unlock this payment."
              : isDemo
                ? "Explore the QR, then mark this sample request paid."
                : payment.openedAt
                  ? "Already opened. Check your UPI transaction history before trying again."
                  : "Always check the merchant and amount in your UPI app."}
      </p>
    </article>
  );
}
