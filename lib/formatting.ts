/** All stored and calculated monetary values are integer paise. */
export function parseAmount(value: string | number): number {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("Enter a valid amount in rupees.");
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("Enter a valid amount in rupees.");
  }
  const text = String(value).trim();
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(text)) {
    throw new Error("Use a positive amount with at most two decimal places.");
  }
  const [whole = "0", fraction = ""] = text.split(".");
  const paise = Number(`${whole || "0"}${fraction.padEnd(2, "0")}`);
  if (!Number.isSafeInteger(paise) || paise <= 0) {
    throw new Error(
      "Enter an amount greater than ₹0 within the supported range.",
    );
  }
  return paise;
}

function assertPaise(paise: number): void {
  if (!Number.isSafeInteger(paise) || paise < 0) {
    throw new Error("Amount must be a non-negative integer number of paise.");
  }
}

export function formatINR(paise: number): string {
  assertPaise(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(paise / 100);
}

/** Decimal rupees without grouping, suitable for a form input. */
export function formatAmountInput(paise: number): string {
  assertPaise(paise);
  const whole = Math.floor(paise / 100);
  const cents = paise % 100;
  return cents === 0
    ? String(whole)
    : `${whole}.${String(cents).padStart(2, "0")}`;
}

/** Two decimal places, without floating-point rounding. */
export function formatUpiAmount(paise: number): string {
  assertPaise(paise);
  return `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`;
}
