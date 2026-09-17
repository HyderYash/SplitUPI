"use client";

import { Equal, List, Plus, Split, Trash2 } from "lucide-react";

export type SplitMode = "threshold" | "equal" | "custom";

export interface SplitConfiguration {
  mode: SplitMode;
  amount: string;
  count: string;
  customAmounts: string[];
}

interface SplitEditorProps {
  value: SplitConfiguration;
  onChange: (value: SplitConfiguration) => void;
  error?: string;
}

const strategies = [
  {
    id: "threshold" as const,
    label: "By amount",
    description: "Set a payment size",
    icon: Split,
  },
  {
    id: "equal" as const,
    label: "Equal split",
    description: "Divide evenly",
    icon: Equal,
  },
  {
    id: "custom" as const,
    label: "Custom",
    description: "You set each amount",
    icon: List,
  },
];

export function SplitEditor({ value, onChange, error }: SplitEditorProps) {
  function updateCustom(index: number, amount: string) {
    onChange({
      ...value,
      customAmounts: value.customAmounts.map((current, currentIndex) =>
        currentIndex === index ? amount : current,
      ),
    });
  }

  return (
    <fieldset
      className="split-editor"
      aria-describedby={error ? "split-error" : "split-help"}
    >
      <legend className="sr-only">How would you like to split the bill?</legend>
      <div className="split-choices">
        {strategies.map(({ id, label, description, icon: Icon }) => (
          <button
            className={`split-choice ${value.mode === id ? "selected" : ""}`}
            key={id}
            type="button"
            aria-pressed={value.mode === id}
            onClick={() => onChange({ ...value, mode: id })}
          >
            <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
            <span>{label}</span>
            <small>{description}</small>
          </button>
        ))}
      </div>

      {value.mode === "threshold" && (
        <div className="strategy-details">
          <label className="label" htmlFor="chunk-amount">
            Amount per payment
          </label>
          <div className="amount-input">
            <span aria-hidden="true">₹</span>
            <input
              className="input"
              id="chunk-amount"
              value={value.amount}
              onChange={(event) =>
                onChange({ ...value, amount: event.target.value })
              }
              inputMode="decimal"
              autoComplete="off"
              placeholder="2000"
              maxLength={12}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "split-error" : "split-help"}
            />
          </div>
          <p id="split-help" className="field-help">
            Each request is up to this amount. The last one takes the remainder.
          </p>
        </div>
      )}

      {value.mode === "equal" && (
        <div className="strategy-details">
          <label className="label" htmlFor="payment-count">
            Number of payments
          </label>
          <input
            className="input"
            id="payment-count"
            type="number"
            min="1"
            max="100"
            step="1"
            value={value.count}
            onChange={(event) =>
              onChange({ ...value, count: event.target.value })
            }
            inputMode="numeric"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "split-error" : "split-help"}
          />
          <p id="split-help" className="field-help">
            Divided as evenly as possible, down to the last paisa.
          </p>
        </div>
      )}

      {value.mode === "custom" && (
        <div className="strategy-details">
          <div className="custom-amounts">
            {value.customAmounts.map((amount, index) => (
              <div className="custom-row" key={index}>
                <label
                  htmlFor={`custom-payment-${index}`}
                  className="custom-label"
                >
                  Payment {String(index + 1).padStart(2, "0")}
                </label>
                <div className="amount-input">
                  <span aria-hidden="true">₹</span>
                  <input
                    className="input"
                    id={`custom-payment-${index}`}
                    value={amount}
                    onChange={(event) =>
                      updateCustom(index, event.target.value)
                    }
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    maxLength={12}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "split-error" : "split-help"}
                  />
                </div>
                <button
                  className="remove-payment"
                  type="button"
                  aria-label={`Remove payment ${index + 1}`}
                  disabled={value.customAmounts.length === 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      customAmounts: value.customAmounts.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    })
                  }
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button
            className="add-payment"
            type="button"
            disabled={value.customAmounts.length >= 100}
            onClick={() =>
              onChange({
                ...value,
                customAmounts: [...value.customAmounts, ""],
              })
            }
          >
            <Plus size={16} aria-hidden="true" /> Add another payment
          </button>
          <p id="split-help" className="field-help">
            Every amount must be positive and add up exactly to your bill.
          </p>
        </div>
      )}
      {error && (
        <p className="form-error" id="split-error" role="status">
          {error}
        </p>
      )}

    </fieldset>
  );
}
