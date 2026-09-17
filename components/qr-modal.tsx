"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  Smartphone,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { generateQrSvg } from "@/lib/qr";
import { formatINR } from "@/lib/formatting";
import type { Payment, PaymentSession } from "@/lib/types";
export function QrModal({
  session,
  payment,
  uri,
  onClose,
  onOpen,
}: {
  session: PaymentSession;
  payment: Payment;
  uri: string;
  onClose: () => void;
  onOpen: () => void;
}) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const payload = session.isDemo
    ? `SplitUPI demo only — no payment. Sample amount: ${formatINR(payment.amountPaise)}. Replace demo@upi with a real merchant VPA to pay.`
    : uri;
  useEffect(() => {
    let active = true;
    const promise = session.isDemo
      ? QRCode.toString(payload, {
          type: "svg",
          width: 480,
          margin: 4,
          color: { dark: "#142921", light: "#ffffff" },
        })
      : generateQrSvg(uri);
    promise
      .then((v) => {
        if (active) setSvg(v);
      })
      .catch(() => {
        if (active)
          setError(
            "The QR could not be generated. Close this screen and try again.",
          );
      });
    return () => {
      active = false;
    };
  }, [payload, uri, session.isDemo]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(session.vpa);
      setCopied(true);
    } catch {
      setError(
        "Copy is unavailable in this browser. Select the UPI ID shown above to copy it.",
      );
    }
  }
  return (
    <Modal
      title={session.isDemo ? "Demo QR · no payment" : "Scan to pay"}
      onClose={onClose}
    >
      <div className="qr-content">
        <div className="eyebrow">{session.merchantName}</div>
        <h3>
          {session.isDemo ? "Sample" : "Pay"} {formatINR(payment.amountPaise)}
        </h3>
        <div className="qr-canvas" data-testid="payment-qr" role="img" aria-label={session.isDemo ? "Sample QR code. Cannot initiate a payment." : `UPI payment QR for ${formatINR(payment.amountPaise)} to ${session.merchantName}`}>
          {svg ? (
            <div
              style={{ width: "100%", height: "100%" }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <LoaderCircle className="spin" />
          )}
        </div>
        <div className="qr-caption">
          {session.isDemo
            ? "DEMO ONLY · This QR cannot initiate a payment"
            : "UPI payment · Scan with a supported UPI app"}
        </div>
        <div className="qr-recipient">
          <div className="vpa-line">{session.vpa}</div>
          <button className="button button-secondary" onClick={copy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
          {copied ? "UPI ID copied" : "Copy UPI ID"}
          </button>
        </div>
        <button
          className="button button-primary"
          onClick={onOpen}
          disabled={session.isDemo}
        >
          <Smartphone size={16} />
          Open UPI App
          <ExternalLink size={14} />
        </button>
        <p className="payment-help">
          {session.isDemo
            ? "Illustrative merchant only. Replace the sample UPI ID to generate a real payment QR."
            : "Check the recipient and amount in your UPI app before paying. Return here to confirm manually. This QR has no automatic expiry."}
        </p>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <details className="qr-data">
          <summary>
            {session.isDemo
              ? "View demo QR content"
              : "View encoded UPI intent"}
          </summary>
          <code data-testid="qr-payload">{payload}</code>
        </details>
        <button className="text-button" onClick={onClose}>
          Back to payments
        </button>
      </div>
    </Modal>
  );
}
