import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  createSession,
  getLatestSession,
  getSession,
  saveSession,
  SESSION_KEY_PREFIX,
  updatePayment,
  updateSession,
} from "../../lib/storage";

class MemoryStorage implements Storage {
  protected readonly records = new Map<string, string>();
  get length() {
    return this.records.size;
  }
  getItem(key: string) {
    return this.records.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.records.set(key, String(value));
  }
  removeItem(key: string) {
    this.records.delete(key);
  }
  clear() {
    this.records.clear();
  }
  key(index: number) {
    return [...this.records.keys()][index] ?? null;
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
});

const create = () =>
  createSession({
    merchantName: "The Bombay Bistro",
    vpa: "bistro@upi",
    invoice: "TABLE-42",
    totalPaise: 600000,
    chunksPaise: [200000, 200000, 200000],
  });

test("session creation persists complete records and generates unique IDs", () => {
  const session = create();
  assert.equal(storage.length, 1);
  assert.deepEqual(getSession(session.id), session);
  assert.equal(new Set(session.payments.map((payment) => payment.id)).size, 3);
  assert.equal(session.parallel, false);
  assert.equal(session.isDemo, false);
  assert.equal(session.status, "active");
  assert.equal(
    session.payments.every((payment) => payment.status === "pending"),
    true,
  );
  assert.notEqual(create().id, session.id);
  assert.equal(getSession("missing-session"), null);
  assert.equal(getSession("../../arbitrary"), null);
});

test("sequential requests block later open and paid actions", () => {
  const session = create();
  const [first, second] = session.payments;
  assert.throws(
    () => updatePayment(session.id, second.id, { status: "paid" }),
    /earlier payment/,
  );
  assert.throws(
    () =>
      updatePayment(session.id, second.id, {
        openedAt: new Date().toISOString(),
      }),
    /earlier payment/,
  );
  const opened = updatePayment(session.id, first.id, {
    openedAt: new Date().toISOString(),
  });
  assert.ok(opened.payments[0].openedAt);
  const paid = updatePayment(session.id, first.id, { status: "paid" });
  assert.ok(paid.payments[0].paidAt);
  assert.equal(paid.payments[0].openedAt, opened.payments[0].openedAt);
  assert.equal(
    updatePayment(session.id, second.id, { status: "paid" }).payments[1].status,
    "paid",
  );
});

test("parallel mode permits an explicit out-of-order request", () => {
  const session = create();
  assert.equal(updateSession(session.id, { parallel: true }).parallel, true);
  const paid = updatePayment(session.id, session.payments[2].id, {
    status: "paid",
  });
  assert.equal(paid.payments[0].status, "pending");
  assert.equal(paid.payments[2].status, "paid");
  assert.deepEqual(getSession(session.id), paid);
});

test("paid requests cannot be reopened, reverted or paid twice", () => {
  const session = create();
  const first = session.payments[0];
  updatePayment(session.id, first.id, { status: "paid" });
  assert.throws(
    () => updatePayment(session.id, first.id, { status: "pending" }),
    /already completed/,
  );
  assert.throws(
    () => updatePayment(session.id, first.id, { status: "paid" }),
    /already completed/,
  );
  assert.throws(
    () =>
      updatePayment(session.id, first.id, {
        openedAt: new Date().toISOString(),
      }),
    /already completed/,
  );
  assert.throws(() => saveSession(session), /cannot be changed/);
  assert.equal(getSession(session.id)?.payments[0].status, "paid");
});

test("updates load fresh state rather than overwriting another tab's work", () => {
  const session = create();
  updateSession(session.id, { parallel: true });
  updatePayment(session.id, session.payments[2].id, { status: "paid" });
  const current = updatePayment(session.id, session.payments[0].id, {
    status: "paid",
  });
  assert.equal(current.payments[2].status, "paid");
  assert.equal(current.payments[0].status, "paid");
  assert.equal(current.parallel, true);
});

test("cancellation prevents payment actions and cannot be undone", () => {
  const session = create();
  updateSession(session.id, { status: "cancelled" });
  assert.throws(
    () => updatePayment(session.id, session.payments[0].id, { status: "paid" }),
    /cancelled/,
  );
  assert.throws(
    () => updateSession(session.id, { status: "active" }),
    /cancelled/,
  );
  assert.equal(getSession(session.id)?.status, "cancelled");
  assert.equal(
    getSession(session.id)?.payments.every(
      (payment) => payment.status === "cancelled",
    ),
    true,
  );
});

test("cancelling a partially paid session preserves the paid record and cancels only pending requests", () => {
  const session = create();
  const paid = updatePayment(session.id, session.payments[0].id, {
    status: "paid",
  });
  const opened = updatePayment(session.id, session.payments[1].id, {
    openedAt: new Date().toISOString(),
  });
  const cancelled = updateSession(session.id, { status: "cancelled" });
  assert.deepEqual(cancelled.payments[0], paid.payments[0]);
  assert.equal(cancelled.payments[1].status, "cancelled");
  assert.equal(cancelled.payments[1].openedAt, opened.payments[1].openedAt);
  assert.equal(cancelled.payments[2].status, "cancelled");
  assert.deepEqual(getSession(session.id), cancelled);
});

test("the reserved demo VPA cannot become a real-payment session by changing its marker", () => {
  for (const vpa of ["demo@upi", "DEMO@UPI", " Demo@Upi "]) {
    const options = {
      merchantName: "Sample",
      vpa,
      invoice: "",
      totalPaise: 100,
      chunksPaise: [100],
    };
    assert.throws(() => createSession(options), /reserved for the sample demo/);
    assert.throws(
      () => createSession({ ...options, isDemo: false }),
      /reserved for the sample demo/,
    );
    const demo = createSession({ ...options, isDemo: true });
    assert.equal(getSession(demo.id)?.isDemo, true);
    assert.throws(
      () => saveSession({ ...demo, isDemo: false }),
      /invalid payment details/,
    );
    storage.setItem(
      `${SESSION_KEY_PREFIX}${demo.id}`,
      JSON.stringify({ ...demo, isDemo: false }),
    );
    assert.equal(getSession(demo.id), null);
  }
});

test("stale snapshots cannot erase an opened request's duplicate-payment warning", () => {
  const session = create();
  const opened = updatePayment(session.id, session.payments[0].id, {
    openedAt: new Date().toISOString(),
  });
  assert.throws(
    () => saveSession(session),
    /tracking history cannot be removed/,
  );
  assert.equal(
    getSession(session.id)?.payments[0].openedAt,
    opened.payments[0].openedAt,
  );
});

test("returning to sequential mode blocks further out-of-order open actions even with an identical timestamp", () => {
  const session = create();
  updateSession(session.id, { parallel: true });
  const openedAt = new Date().toISOString();
  updatePayment(session.id, session.payments[2].id, { openedAt });
  updateSession(session.id, { parallel: false });
  assert.throws(
    () => updatePayment(session.id, session.payments[2].id, { openedAt }),
    /earlier payment/,
  );
});

test("corrupt, hostile and mismatched session records are ignored", () => {
  const session = create();
  const key = `${SESSION_KEY_PREFIX}${session.id}`;
  const invalid: unknown[] = [
    "not-json",
    "null",
    "[]",
    '{"__proto__":{"polluted":true}}',
    { ...session, totalPaise: 600001 },
    { ...session, vpa: "bad@upi&am=1" },
    { ...session, id: "different-session" },
    { ...session, isDemo: "true" },
    { ...session, createdAt: "2026-02-31T00:00:00.000Z" },
    {
      ...session,
      payments: [
        { ...session.payments[0], status: "paid" },
        ...session.payments.slice(1),
      ],
    },
    {
      ...session,
      payments: [
        { ...session.payments[0], amountPaise: 0 },
        ...session.payments.slice(1),
      ],
    },
    {
      ...session,
      payments: [session.payments[0], session.payments[0], session.payments[2]],
    },
    {
      ...session,
      payments: [
        { ...session.payments[0], openedAt: "tomorrow" },
        ...session.payments.slice(1),
      ],
    },
  ];
  for (const value of invalid) {
    storage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    );
    assert.equal(getSession(session.id), null);
    assert.equal(getLatestSession(), null);
  }
  assert.equal(({} as Record<string, unknown>).polluted, undefined);
});

test("latest session scan ignores invalid records and unrelated storage", () => {
  const session = create();
  storage.setItem("theme", "dark");
  storage.setItem(`${SESSION_KEY_PREFIX}broken-session`, "oops");
  assert.deepEqual(getLatestSession(), session);
  const next = {
    ...session,
    id: "newer-session",
    createdAt: "2099-01-01T00:00:00.000Z",
  };
  saveSession(next);
  assert.equal(getLatestSession()?.id, "newer-session");
});

test("quota failures are surfaced and do not falsely mark a payment paid", () => {
  const session = create();
  storage.setItem = () => {
    throw new DOMException("Quota exceeded", "QuotaExceededError");
  };
  assert.throws(
    () => updatePayment(session.id, session.payments[0].id, { status: "paid" }),
    /could not save or read/,
  );
  assert.equal(getSession(session.id)?.payments[0].status, "pending");
});

test("disabled localStorage produces a readable error", () => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });
  assert.throws(() => create(), /Allow local storage/);
  assert.throws(() => getLatestSession(), /Allow local storage/);
});

test("invalid creation and attempts to change immutable payment details fail", () => {
  assert.throws(
    () =>
      createSession({
        merchantName: "Shop",
        vpa: "shop@upi",
        invoice: "",
        totalPaise: 100,
        chunksPaise: [40, 40],
      }),
    /add up/,
  );
  const session = create();
  assert.throws(
    () => saveSession({ ...session, vpa: "different@upi" }),
    /cannot change/,
  );
  assert.throws(
    () => updatePayment(session.id, "missing-payment", { status: "paid" }),
    /could not be found/,
  );
});
