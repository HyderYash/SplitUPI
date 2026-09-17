"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Info,
  LoaderCircle,
  ReceiptText,
  Split,
} from "lucide-react";
import {
  SplitEditor,
  type SplitConfiguration,
} from "@/components/split-editor";
import { formatINR, parseAmount } from "@/lib/formatting";
import { splitAmount } from "@/lib/splitting";
import { createSession } from "@/lib/storage";
import { validateVpa } from "@/lib/validation";

type FieldErrors = Partial<
  Record<"merchant" | "vpa" | "total" | "submission", string>
>;

export function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const replacingDemo = searchParams.get("demo") === "true";
  const [merchantName, setMerchantName] = useState(
    replacingDemo ? "The Bombay Bistro" : "",
  );
  const [vpa, setVpa] = useState("");
  const [invoice, setInvoice] = useState(replacingDemo ? "TABLE-42" : "");
  const [total, setTotal] = useState("6000");
  const [split, setSplit] = useState<SplitConfiguration>({
    mode: "threshold",
    amount: "2000",
    count: "3",
    customAmounts: ["2000", "2000", "2000"],
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const breakdown = useMemo(() => {
    let totalPaise = 0;
    try {
      totalPaise = parseAmount(total);
      if (totalPaise > 1_000_000_000)
        throw new Error("This prototype supports bills up to ₹1,00,00,000.");
    } catch (error) {
      return {
        totalPaise: 0,
        chunksPaise: [] as number[],
        totalError:
          error instanceof Error ? error.message : "Enter a valid bill amount.",
        splitError: "",
      };
    }
    try {
      const strategy =
        split.mode === "threshold"
          ? {
              type: "threshold" as const,
              amount: parseAmount(split.amount) / 100,
            }
          : split.mode === "equal"
            ? { type: "equal" as const, count: Number(split.count) }
            : { type: "custom" as const, amounts: split.customAmounts };
      const chunksPaise = splitAmount(total, strategy).map((amount) =>
        Math.round(amount * 100),
      );
      return { totalPaise, chunksPaise, totalError: "", splitError: "" };
    } catch (error) {
      return {
        totalPaise,
        chunksPaise: [] as number[],
        totalError: "",
        splitError:
          error instanceof Error ? error.message : "Check your split amounts.",
      };
    }
  }, [total, split]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    const nextErrors: FieldErrors = {};
    const trimmedMerchant = merchantName.trim();
    const trimmedVpa = vpa.trim();
    if (trimmedMerchant.length < 2 || trimmedMerchant.length > 80)
      nextErrors.merchant =
        "Enter a merchant name between 2 and 80 characters.";
    if (!validateVpa(trimmedVpa))
      nextErrors.vpa = "Enter a UPI ID in the format name@bank.";
    else if (trimmedVpa.toLowerCase() === "demo@upi")
      nextErrors.vpa =
        "Use your real merchant UPI ID. demo@upi is only for the sample demo.";
    if (breakdown.totalError) nextErrors.total = breakdown.totalError;
    setErrors(nextErrors);
    if (
      Object.keys(nextErrors).length ||
      breakdown.splitError ||
      !breakdown.chunksPaise.length
    ) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLInputElement>("[aria-invalid='true']")
          ?.focus(),
      );
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const session = createSession({
        merchantName: trimmedMerchant,
        vpa: trimmedVpa,
        invoice: invoice.trim(),
        totalPaise: breakdown.totalPaise,
        chunksPaise: breakdown.chunksPaise,
        isDemo: false,
      });
      router.push(`/session/${session.id}`);
    } catch (error) {
      setErrors({
        submission:
          error instanceof Error
            ? error.message
            : "We couldn’t save this session. Check that browser storage is enabled, then try again.",
      });
      submittingRef.current = false;
      setSubmitting(false);
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(".submission-error")
          ?.scrollIntoView({ block: "center" }),
      );
    }
  }

  return (
    <div className="create-screen">
      <nav className="create-nav" aria-label="Payment steps">
        <Link href="/" className="back-link">
          <ArrowLeft size={15} aria-hidden="true" /> Back
        </Link>
        <ol className="step-trail">
          <li aria-current="step">
            <span>1</span> Create
          </li>
          <li>
            <ChevronRight size={12} aria-hidden="true" />
            <span>2</span> Pay
          </li>
          <li>
            <ChevronRight size={12} aria-hidden="true" />
            <span>3</span> Receipt
          </li>
        </ol>
      </nav>
      <div className="create-heading">
        <span className="eyebrow">LET’S SETTLE THIS</span>
        <h1>
          A big bill.
          <br />A little simpler.
        </h1>
        <p>One merchant. Your choice of payments. Set up your split below.</p>
      </div>
      {replacingDemo && (
        <div className="demo-edit-note">
          <Info size={18} aria-hidden="true" />
          <p>
            Make the demo yours. Add a real merchant UPI ID to create payable
            requests.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        ref={formRef}
        className="create-grid"
        noValidate
      >
        <div className="setup-panel panel">
          <section className="form-section" aria-labelledby="merchant-heading">
            <div className="setup-section-heading">
              <span className="section-number">01</span>
              <h2 id="merchant-heading">The bill details</h2>
            </div>
            <div className="field">
              <label className="label" htmlFor="merchant-name">
                Merchant name
              </label>
              <input
                id="merchant-name"
                className="input"
                placeholder="e.g. The Bombay Bistro"
                value={merchantName}
                onChange={(event) => {
                  setMerchantName(event.target.value);
                  setErrors((current) => ({ ...current, merchant: undefined }));
                }}
                autoComplete="organization"
                maxLength={80}
                required
                aria-invalid={Boolean(errors.merchant)}
                aria-describedby={
                  errors.merchant ? "merchant-error" : undefined
                }
              />
              {errors.merchant && (
                <p className="form-error" id="merchant-error">
                  {errors.merchant}
                </p>
              )}
            </div>
            <div className="field">
              <label className="label" htmlFor="merchant-vpa">
                Merchant UPI ID <span className="label-hint">/ VPA</span>
              </label>
              <input
                id="merchant-vpa"
                className="input"
                placeholder="merchant@bank"
                value={vpa}
                onChange={(event) => {
                  setVpa(event.target.value);
                  setErrors((current) => ({ ...current, vpa: undefined }));
                }}
                autoCapitalize="none"
                inputMode="email"
                enterKeyHint="next"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                maxLength={255}
                required
                aria-invalid={Boolean(errors.vpa)}
                aria-describedby={errors.vpa ? "vpa-error" : "vpa-help"}
              />
              {errors.vpa ? (
                <p className="form-error" id="vpa-error">
                  {errors.vpa}
                </p>
              ) : (
                <p className="field-help" id="vpa-help">
                  All payments go to this UPI ID. Check the recipient in your
                  UPI app.
                </p>
              )}
            </div>
            <div className="field-pair">
              <div className="field">
                <label className="label" htmlFor="bill-amount">
                  Total bill amount
                </label>
                <div className="rupee-field">
                  <span aria-hidden="true">₹</span>
                  <input
                    id="bill-amount"
                    className="input"
                    value={total}
                    onChange={(event) => {
                      setTotal(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        total: undefined,
                      }));
                    }}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="6000"
                    maxLength={12}
                    required
                    aria-invalid={Boolean(errors.total || breakdown.totalError)}
                    aria-describedby={
                      errors.total || breakdown.totalError
                        ? "total-error"
                        : undefined
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="invoice">
                  Invoice <span className="label-hint">(optional)</span>
                </label>
                <input
                  id="invoice"
                  className="input"
                  value={invoice}
                  onChange={(event) => setInvoice(event.target.value)}
                  placeholder="e.g. TABLE-42"
                  autoComplete="off"
                  maxLength={60}
                />
              </div>
            </div>
            {(errors.total || breakdown.totalError) && (
              <p className="form-error" id="total-error">
                {errors.total || breakdown.totalError}
              </p>
            )}
          </section>

          <section
            className="form-section split-section"
            aria-labelledby="split-heading"
          >
            <div className="setup-section-heading">
              <span className="section-number">02</span>
              <h2 id="split-heading">Make it your split</h2>
            </div>
            <SplitEditor
              value={split}
              onChange={setSplit}
              error={breakdown.splitError}
            />
          </section>
        </div>

        <aside className="preview-column" aria-label="Payment split preview">
          <div className="preview-panel panel">
            <div className="preview-topline">
              <span className="eyebrow">YOUR PAYMENT PLAN</span>
              <ReceiptText size={19} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="preview-total">
              <span>Total bill</span>
              <strong>
                {breakdown.totalPaise ? formatINR(breakdown.totalPaise) : "₹0"}
              </strong>
              <p>
                {merchantName.trim() || "Your merchant"}
                {invoice.trim() ? (
                  <>
                    <span className="invoice-dot">·</span>
                    {invoice.trim()}
                  </>
                ) : null}
              </p>
            </div>

            {breakdown.chunksPaise.length ? (
              <>
                <div className="split-connection">
                  <span />
                  <Split size={16} aria-hidden="true" />
                  <span />
                </div>
                <ol
                  className="preview-payments"
                  aria-label="Individual payment amounts"
                >
                  {breakdown.chunksPaise.map((amount, index) => (
                    <li key={index}>
                      <div>
                        <span className="preview-payment-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span>Payment {index + 1}</span>
                      </div>
                      <strong>{formatINR(amount)}</strong>
                    </li>
                  ))}
                </ol>
                <div className="preview-bottomline">
                  <span>
                    {breakdown.chunksPaise.length} payment{" "}
                    {breakdown.chunksPaise.length === 1
                      ? "request"
                      : "requests"}
                  </span>
                  <span className="adds-up">
                    <Check size={13} aria-hidden="true" /> Adds up perfectly
                  </span>
                </div>
              </>
            ) : (
              <div className="preview-empty">
                <Split size={23} aria-hidden="true" />
                <p>Add a valid bill and split to see your payment plan.</p>
              </div>
            )}

            <div className="create-submit-bar">
              <div className="mobile-plan-summary" aria-live="polite">
                <strong>{formatINR(breakdown.totalPaise)}</strong>
                <span>{breakdown.chunksPaise.length} payment requests</span>
              </div>
              <button
              type="submit"
              className="button button-primary create-submit"
              disabled={
                submitting ||
                Boolean(breakdown.totalError || breakdown.splitError)
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle size={17} className="spin" aria-hidden="true" />{" "}
                  Creating your session…
                </>
              ) : (
                <>
                  Split payment <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
              </button>
            </div>
            <p className="submit-note">
              You’ll review each request before opening your UPI app.
            </p>
            {errors.submission && (
              <p className="form-error submission-error" role="alert">
                {errors.submission}
              </p>
            )}
          </div>
          <div className="preview-explainer">
            <Info size={16} aria-hidden="true" />
            <p>
              This creates payment requests. Status is marked manually and is{" "}
              <strong>not bank-verified.</strong>
            </p>
          </div>
          <p className="resource-note">
            Prototype limits: ₹1 crore per bill · 100 requests per session.
            These are app limits, not UPI transaction limits.
          </p>
        </aside>
      </form>

    </div>
  );
}
