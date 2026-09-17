"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  SlidersHorizontal,
  Store,
} from "lucide-react";
import { formatINR } from "@/lib/formatting";
import { splitAmount } from "@/lib/splitting";
export function BillPreview() {
  const [total, setTotal] = useState(6000);
  const chunks = splitAmount(total, { type: "threshold", amount: 2000 });
  return (
    <div
      className="bill-stage"
      aria-label="Interactive example of splitting one bill into multiple requests"
    >
      <div className="stage-top">
        <span className="stage-label">
          <span /> A BILL, REIMAGINED
        </span>
        <span>TRY A TOTAL ↘</span>
      </div>
      <div className="sample-totals" aria-label="Example bill amount">
        {[6000, 5500, 7400].map((value) => (
          <button
            key={value}
            onClick={() => setTotal(value)}
            aria-pressed={total === value}
          >
            {formatINR(value * 100)}
          </button>
        ))}
      </div>
      <div className="premium-bill">
        <div className="premium-merchant">
          <span className="merchant-icon">
            <Store size={22} />
          </span>
          <div>
            <strong>The Bombay Bistro</strong>
            <span>TABLE 42 · SAMPLE BILL</span>
          </div>
          <span className="sample-tag">DEMO</span>
        </div>
        <div className="premium-total">
          <span>One good evening.</span>
          <strong key={total}>
            {formatINR(total * 100)}
            <small>.00</small>
          </strong>
          <p>One merchant. Every payment.</p>
        </div>
        <div className="premium-bill-foot">
          <SlidersHorizontal size={13} />
          <span>₹2,000 per request</span>
          <span>Your split. Your choice.</span>
        </div>
      </div>
      <div className="split-path">
        <span />
        <span className="split-path-label">
          <ArrowDown size={14} /> A little at a time
        </span>
        <span />
      </div>
      <div
        className={`preview-chunks ${chunks.length === 4 ? "four-chunks" : ""}`}
        key={total}
      >
        {chunks.map((chunk, i) => (
          <div
            className="preview-chunk"
            key={i}
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div>
              <span>0{i + 1}</span>
              {i === 0 ? (
                <ArrowUpRight size={16} />
              ) : (
                <span className="chunk-dot" />
              )}
            </div>
            <strong>{formatINR(chunk * 100)}</strong>
            <span>Payment request</span>
          </div>
        ))}
      </div>
      <div className="preview-balance">
        <span className="balance-check">
          <Check size={16} />
        </span>
        <span>
          <strong>Every rupee adds up.</strong>
          <small>{chunks.length} requests. Same merchant UPI ID.</small>
        </span>
        <strong>{formatINR(total * 100)}</strong>
      </div>
      <p className="preview-caption">
        Illustrative breakdown. No payment is initiated.
      </p>
    </div>
  );
}
