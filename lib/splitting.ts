import { parseAmount } from "./formatting";

// UI resource limits for this local prototype, not UPI transaction limits.
export const MAX_CHUNKS = 100;
export const MAX_TOTAL_PAISE = 1_000_000_000;
export const DEFAULT_CHUNK_RUPEES = 2_000;

export type SplitStrategy =
  | { type: "threshold"; amount?: number }
  | { type: "equal"; count: number }
  | { type: "custom"; amounts: (number | string)[] };

/** Accepts/returns rupees; performs every split and sum using integer paise. */
export function splitAmount(
  total: number | string,
  strategy: SplitStrategy,
): number[] {
  const totalPaise = parseAmount(total);
  if (totalPaise > MAX_TOTAL_PAISE) {
    throw new Error(
      "This prototype supports bills up to ₹1,00,00,000. This is a UI limit, not a UPI limit.",
    );
  }
  if (!strategy || typeof strategy !== "object") {
    throw new Error("Choose a split method.");
  }
  let chunks: number[];
  switch (strategy.type) {
    case "threshold": {
      const size = parseAmount(strategy.amount ?? DEFAULT_CHUNK_RUPEES);
      const count = Math.ceil(totalPaise / size);
      if (count > MAX_CHUNKS) {
        throw new Error(
          "Use a larger amount per payment. This prototype supports up to 100 requests.",
        );
      }
      chunks = Array.from({ length: count }, (_, index) =>
        Math.min(size, totalPaise - index * size),
      );
      break;
    }
    case "equal": {
      const count = strategy.count;
      if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNKS) {
        throw new Error("Choose a whole number of payments from 1 to 100.");
      }
      if (count > totalPaise) {
        throw new Error(
          "Each payment must be at least ₹0.01. Choose fewer payments.",
        );
      }
      const base = Math.floor(totalPaise / count);
      const remainder = totalPaise % count;
      chunks = Array.from(
        { length: count },
        (_, index) => base + (index < remainder ? 1 : 0),
      );
      break;
    }
    case "custom": {
      if (
        !Array.isArray(strategy.amounts) ||
        strategy.amounts.length < 1 ||
        strategy.amounts.length > MAX_CHUNKS
      ) {
        throw new Error("Add between 1 and 100 payment amounts.");
      }
      chunks = strategy.amounts.map(parseAmount);
      break;
    }
    default:
      throw new Error("Choose a supported split method.");
  }
  if (chunks.some((chunk) => !Number.isSafeInteger(chunk) || chunk <= 0)) {
    throw new Error("Every payment must be greater than ₹0.");
  }
  if (chunks.reduce((sum, chunk) => sum + chunk, 0) !== totalPaise) {
    throw new Error("Your payment amounts must add up to the total bill.");
  }
  return chunks.map((chunk) => chunk / 100);
}
