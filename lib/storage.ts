import { MAX_CHUNKS, MAX_TOTAL_PAISE } from "./splitting";
import type { Payment, PaymentSession } from "./types";
import {
  validateInvoice,
  validateMerchantName,
  validateVpa,
} from "./validation";

export const SESSION_KEY_PREFIX = "splitupi:session:";
export const STORAGE_EVENT = "splitupi:storage";

const storageError = () =>
  new Error(
    "Your browser could not save or read this session. Allow local storage, check available space, and try again.",
  );

function browserStorage(): Storage {
  try {
    if (!globalThis.localStorage) throw storageError();
    return globalThis.localStorage;
  } catch {
    throw storageError();
  }
}

function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    throw storageError();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
}

function validTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

function validPaise(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_TOTAL_PAISE
  );
}

/** Parse only the documented schema. Malformed local data never enters the UI. */
function validateSession(value: unknown): PaymentSession | null {
  if (
    !isRecord(value) ||
    !validId(value.id) ||
    typeof value.merchantName !== "string" ||
    !validateMerchantName(value.merchantName) ||
    typeof value.vpa !== "string" ||
    !validateVpa(value.vpa) ||
    typeof value.invoice !== "string" ||
    !validateInvoice(value.invoice) ||
    !validPaise(value.totalPaise) ||
    !validTimestamp(value.createdAt) ||
    typeof value.isDemo !== "boolean" ||
    typeof value.parallel !== "boolean" ||
    (value.vpa.trim().toLowerCase() === "demo@upi" && !value.isDemo) ||
    (value.status !== "active" && value.status !== "cancelled") ||
    !Array.isArray(value.payments) ||
    value.payments.length < 1 ||
    value.payments.length > MAX_CHUNKS
  ) {
    return null;
  }
  const payments: Payment[] = [];
  const ids = new Set<string>();
  for (const payment of value.payments) {
    if (
      !isRecord(payment) ||
      !validId(payment.id) ||
      ids.has(payment.id) ||
      !validPaise(payment.amountPaise) ||
      (payment.status !== "pending" &&
        payment.status !== "paid" &&
        payment.status !== "cancelled") ||
      (payment.paidAt !== undefined && !validTimestamp(payment.paidAt)) ||
      (payment.openedAt !== undefined && !validTimestamp(payment.openedAt)) ||
      (payment.status === "paid" && !validTimestamp(payment.paidAt)) ||
      (payment.status !== "paid" && payment.paidAt !== undefined)
    ) {
      return null;
    }
    ids.add(payment.id);
    payments.push({
      id: payment.id,
      amountPaise: payment.amountPaise,
      status: payment.status as Payment["status"],
      ...(payment.paidAt !== undefined
        ? { paidAt: payment.paidAt as string }
        : {}),
      ...(payment.openedAt !== undefined
        ? { openedAt: payment.openedAt as string }
        : {}),
    });
  }
  if (
    payments.reduce((total, payment) => total + payment.amountPaise, 0) !==
    value.totalPaise
  )
    return null;
  return {
    id: value.id,
    merchantName: value.merchantName.trim(),
    vpa: value.vpa.trim(),
    invoice: value.invoice.trim(),
    totalPaise: value.totalPaise,
    payments,
    createdAt: value.createdAt,
    isDemo: value.isDemo,
    parallel: value.parallel,
    status: value.status,
  };
}

function parseSession(
  text: string | null,
  expectedId?: string,
): PaymentSession | null {
  if (!text || text.length > 100_000) return null;
  try {
    const session = validateSession(JSON.parse(text));
    return session && (!expectedId || session.id === expectedId)
      ? session
      : null;
  } catch {
    return null;
  }
}

function uniqueId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  // getRandomValues also works on an HTTP LAN preview, where randomUUID may not.
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  throw new Error(
    "Your browser cannot create a unique session. Try a current browser.",
  );
}

function ensureNoReversion(
  previous: PaymentSession,
  next: PaymentSession,
): void {
  if (
    previous.merchantName !== next.merchantName ||
    previous.vpa !== next.vpa ||
    previous.invoice !== next.invoice ||
    previous.createdAt !== next.createdAt ||
    previous.totalPaise !== next.totalPaise ||
    previous.isDemo !== next.isDemo ||
    previous.payments.length !== next.payments.length
  ) {
    throw new Error(
      "A saved session's payment details cannot change. Create a new session instead.",
    );
  }
  if (previous.status === "cancelled" && next.status !== "cancelled")
    throw new Error("This session was cancelled. Create a new session.");
  previous.payments.forEach((oldPayment, index) => {
    const newPayment = next.payments[index];
    if (
      oldPayment.id !== newPayment.id ||
      oldPayment.amountPaise !== newPayment.amountPaise
    ) {
      throw new Error("A saved payment's amount or identity cannot change.");
    }
    if (
      oldPayment.status !== "pending" &&
      JSON.stringify(oldPayment) !== JSON.stringify(newPayment)
    ) {
      throw new Error(
        "Completed or cancelled payment requests cannot be changed.",
      );
    }
    if (oldPayment.openedAt && !newPayment.openedAt) {
      throw new Error(
        "An opened payment's tracking history cannot be removed. Refresh this session and try again.",
      );
    }
    const isOpeningOrPaying =
      newPayment.status === "paid" ||
      newPayment.openedAt !== oldPayment.openedAt;
    if (oldPayment.status === "pending" && isOpeningOrPaying) {
      if (previous.status === "cancelled")
        throw new Error("This session was cancelled. Create a new session.");
      if (
        !next.parallel &&
        next.payments
          .slice(0, index)
          .some((payment) => payment.status !== "paid")
      ) {
        throw new Error(
          "Confirm the earlier payment first, or enable parallel payments.",
        );
      }
    }
  });
}

export function saveSession(value: PaymentSession): PaymentSession {
  const session = validateSession(value);
  if (!session)
    throw new Error(
      "This session contains invalid payment details and could not be saved.",
    );
  const storage = browserStorage();
  const key = `${SESSION_KEY_PREFIX}${session.id}`;
  const previous = parseSession(read(storage, key), session.id);
  if (previous) ensureNoReversion(previous, session);
  try {
    // A single-key write is atomic: a failed write never produces a partial session.
    storage.setItem(key, JSON.stringify(session));
  } catch {
    throw storageError();
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STORAGE_EVENT, { detail: { sessionId: session.id } }),
    );
  }
  return session;
}

export interface CreateSessionOptions {
  merchantName: string;
  vpa: string;
  invoice: string;
  totalPaise: number;
  chunksPaise: number[];
  isDemo?: boolean;
}

/** Creates and durably saves before the caller navigates to the session. */
export function createSession({
  merchantName,
  vpa,
  invoice,
  totalPaise,
  chunksPaise,
  isDemo = false,
}: CreateSessionOptions): PaymentSession {
  if (!validateMerchantName(merchantName))
    throw new Error("Enter a merchant name of 1–80 characters.");
  if (!validateVpa(vpa))
    throw new Error("Enter a valid UPI ID, such as merchant@upi.");
  if (vpa.trim().toLowerCase() === "demo@upi" && !isDemo) {
    throw new Error(
      "demo@upi is reserved for the sample demo. Enter a real merchant UPI ID to create payment requests.",
    );
  }
  if (!validateInvoice(invoice))
    throw new Error("Use an invoice reference of at most 120 characters.");
  if (
    !validPaise(totalPaise) ||
    !Array.isArray(chunksPaise) ||
    chunksPaise.length < 1 ||
    chunksPaise.length > MAX_CHUNKS ||
    !chunksPaise.every(validPaise) ||
    chunksPaise.reduce((sum, amount) => sum + amount, 0) !== totalPaise
  ) {
    throw new Error(
      "Use 1–100 positive payment amounts that add up exactly to the bill, up to ₹1,00,00,000.",
    );
  }
  return saveSession({
    id: uniqueId("session"),
    merchantName: merchantName.trim(),
    vpa: vpa.trim(),
    invoice: invoice.trim(),
    totalPaise,
    payments: chunksPaise.map((amountPaise) => ({
      id: uniqueId("payment"),
      amountPaise,
      status: "pending",
    })),
    createdAt: new Date().toISOString(),
    isDemo,
    parallel: false,
    status: "active",
  });
}

export function getSession(id: string): PaymentSession | null {
  if (!validId(id)) return null;
  return parseSession(read(browserStorage(), `${SESSION_KEY_PREFIX}${id}`), id);
}

export function getLatestSession(): PaymentSession | null {
  const storage = browserStorage();
  let latest: PaymentSession | null = null;
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(SESSION_KEY_PREFIX)) continue;
      const session = parseSession(
        read(storage, key),
        key.slice(SESSION_KEY_PREFIX.length),
      );
      if (session && (!latest || session.createdAt > latest.createdAt))
        latest = session;
    }
  } catch {
    throw storageError();
  }
  return latest;
}

export function updatePayment(
  id: string,
  paymentId: string,
  patch: Partial<Pick<Payment, "status" | "openedAt">>,
): PaymentSession {
  const session = getSession(id);
  if (!session)
    throw new Error(
      "This payment session is unavailable. Create a new session.",
    );
  if (session.status === "cancelled")
    throw new Error("This session was cancelled. Create a new session.");
  const index = session.payments.findIndex(
    (payment) => payment.id === paymentId,
  );
  if (index === -1) throw new Error("This payment request could not be found.");
  const payment = session.payments[index];
  if (payment.status !== "pending")
    throw new Error("This payment is already completed or cancelled.");
  if (
    !isRecord(patch) ||
    Object.keys(patch).some((key) => !["status", "openedAt"].includes(key)) ||
    (patch.status !== undefined &&
      !["pending", "paid", "cancelled"].includes(patch.status)) ||
    (patch.openedAt !== undefined && !validTimestamp(patch.openedAt))
  ) {
    throw new Error("The requested payment update is invalid.");
  }
  if (
    !session.parallel &&
    (patch.status === "paid" || patch.openedAt !== undefined) &&
    session.payments
      .slice(0, index)
      .some((earlier) => earlier.status !== "paid")
  ) {
    throw new Error(
      "Confirm the earlier payment first, or enable parallel payments.",
    );
  }
  session.payments[index] = {
    ...payment,
    ...patch,
    ...(patch.status === "paid" ? { paidAt: new Date().toISOString() } : {}),
  };
  return saveSession(session);
}

export function updateSession(
  id: string,
  patch: Partial<Pick<PaymentSession, "parallel" | "status">>,
): PaymentSession {
  const session = getSession(id);
  if (!session)
    throw new Error(
      "This payment session is unavailable. Create a new session.",
    );
  if (
    !isRecord(patch) ||
    Object.keys(patch).some((key) => !["parallel", "status"].includes(key)) ||
    (patch.parallel !== undefined && typeof patch.parallel !== "boolean") ||
    (patch.status !== undefined &&
      !["active", "cancelled"].includes(patch.status))
  ) {
    throw new Error("The requested session update is invalid.");
  }
  return saveSession({
    ...session,
    ...patch,
    payments:
      patch.status === "cancelled"
        ? session.payments.map((payment) =>
            payment.status === "pending"
              ? { ...payment, status: "cancelled" }
              : payment,
          )
        : session.payments,
  });
}
