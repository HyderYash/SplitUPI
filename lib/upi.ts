import { formatUpiAmount, parseAmount } from "./formatting";
import { validateMerchantName, validateVpa } from "./validation";

export interface UpiPaymentOptions {
  vpa: string;
  name: string;
  /** Amount in rupees. */
  amount: number | string;
  /** Merchant reference, represented by UPI's tr parameter. */
  transactionId?: string;
  note?: string;
}

export function buildUpiUrl({
  vpa,
  name,
  amount,
  transactionId,
  note,
}: UpiPaymentOptions): string {
  if (!validateVpa(vpa))
    throw new Error("Enter a valid UPI ID, such as merchant@upi.");
  if (!validateMerchantName(name))
    throw new Error("Enter a merchant name of 1–80 characters.");
  const parameters: [string, string][] = [
    ["pa", vpa.trim()],
    ["pn", name.trim()],
    ["am", formatUpiAmount(parseAmount(amount))],
    ["cu", "INR"],
  ];
  if (transactionId !== undefined) {
    if (
      typeof transactionId !== "string" ||
      !/^[a-zA-Z0-9_-]{1,35}$/.test(transactionId)
    ) {
      throw new Error(
        "Payment reference must contain 1–35 letters, numbers, hyphens or underscores.",
      );
    }
    parameters.push(["tr", transactionId]);
  }
  if (note !== undefined) {
    if (
      typeof note !== "string" ||
      note.length > 80 ||
      /[\u0000-\u001f\u007f]/.test(note)
    ) {
      throw new Error(
        "Payment note must be at most 80 characters with no control characters.",
      );
    }
    if (note.trim()) parameters.push(["tn", note.trim()]);
  }
  return `upi://pay?${parameters.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")}`;
}
