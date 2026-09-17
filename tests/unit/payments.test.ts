import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatAmountInput,
  formatINR,
  parseAmount,
} from "../../lib/formatting";
import { splitAmount } from "../../lib/splitting";
import { buildUpiUrl } from "../../lib/upi";
import { validateVpa } from "../../lib/validation";

const paiseSum = (chunks: number[]) =>
  chunks.reduce((sum, chunk) => sum + parseAmount(chunk), 0);

test("required threshold examples retain every paise", () => {
  const examples: [number, number[]][] = [
    [2000, [2000]],
    [2001, [2000, 1]],
    [5500, [2000, 2000, 1500]],
    [6000, [2000, 2000, 2000]],
    [7400, [2000, 2000, 2000, 1400]],
    [75000, [...Array<number>(37).fill(2000), 1000]],
  ];
  for (const [amount, expected] of examples) {
    const chunks = splitAmount(amount, { type: "threshold" });
    assert.deepEqual(chunks, expected);
    assert.equal(paiseSum(chunks), parseAmount(amount));
    assert.ok(chunks.every((chunk) => chunk > 0));
  }
});

test("threshold handles decimal remainders and a custom amount per payment", () => {
  assert.deepEqual(
    splitAmount("6000.01", { type: "threshold" }),
    [2000, 2000, 2000, 0.01],
  );
  assert.deepEqual(
    splitAmount("5500.15", { type: "threshold", amount: 1500.05 }),
    [1500.05, 1500.05, 1500.05, 1000],
  );
  assert.deepEqual(splitAmount("0.01", { type: "threshold" }), [0.01]);
});

test("equal splits distribute indivisible paise deterministically", () => {
  assert.deepEqual(
    splitAmount(100, { type: "equal", count: 3 }),
    [33.34, 33.33, 33.33],
  );
  assert.deepEqual(
    splitAmount("0.05", { type: "equal", count: 3 }),
    [0.02, 0.02, 0.01],
  );
  assert.deepEqual(
    splitAmount(6000, { type: "equal", count: 3 }),
    [2000, 2000, 2000],
  );
});

test("custom splits use exact paise rather than floating-point sums", () => {
  assert.deepEqual(
    splitAmount("0.30", { type: "custom", amounts: [0.1, "0.20"] }),
    [0.1, 0.2],
  );
  assert.deepEqual(
    splitAmount(5500, { type: "custom", amounts: [5000, 500] }),
    [5000, 500],
  );
  assert.throws(
    () => splitAmount(5500, { type: "custom", amounts: [2000, 2000] }),
    /add up/,
  );
});

test("all strategies preserve sum across many awkward decimal amounts", () => {
  for (let totalPaise = 101; totalPaise < 10_000; totalPaise += 137) {
    const rupees = formatAmountInput(totalPaise);
    for (const count of [1, 3, 7, 13, 100]) {
      const chunks = splitAmount(rupees, { type: "equal", count });
      assert.equal(chunks.length, count);
      assert.equal(paiseSum(chunks), totalPaise);
      assert.ok(chunks.every((chunk) => parseAmount(chunk) >= 1));
    }
  }
});

test("invalid amounts, allocation sizes and resource-intensive splits are rejected", () => {
  for (const value of [
    "",
    " ",
    "NaN",
    "Infinity",
    "1,000",
    "1e3",
    "-1",
    "0",
    "1.001",
    NaN,
    Infinity,
    -1,
    0,
    0.001,
  ]) {
    assert.throws(() => splitAmount(value, { type: "threshold" }));
  }
  for (const count of [0, -1, 1.5, 101, Infinity, NaN]) {
    assert.throws(() => splitAmount(6000, { type: "equal", count }));
  }
  assert.throws(
    () => splitAmount("0.01", { type: "equal", count: 2 }),
    /at least/,
  );
  assert.throws(() => splitAmount(10, { type: "threshold", amount: 0 }));
  assert.throws(
    () => splitAmount(10, { type: "threshold", amount: 0.01 }),
    /100 requests/,
  );
  assert.throws(() => splitAmount(10, { type: "custom", amounts: [] }));
  assert.throws(() => splitAmount(10, { type: "custom", amounts: [10, 0] }));
  assert.throws(
    () => splitAmount(10_000_000.01, { type: "equal", count: 1 }),
    /UI limit/,
  );
  assert.deepEqual(
    splitAmount(10_000_000, { type: "equal", count: 1 }),
    [10_000_000],
  );
});

test("formatting uses Indian grouping and exact decimal input", () => {
  assert.equal(formatINR(0), "₹0");
  assert.equal(formatINR(600000), "₹6,000");
  assert.equal(formatINR(12345678), "₹1,23,456.78");
  assert.equal(formatINR(10), "₹0.10");
  assert.equal(formatAmountInput(600000), "6000");
  assert.equal(formatAmountInput(600001), "6000.01");
  assert.equal(parseAmount(" 00020.50 "), 2050);
  assert.equal(parseAmount(".50"), 50);
  assert.throws(() => formatINR(-1));
  assert.throws(() => formatAmountInput(1.5));
  assert.throws(() => parseAmount("999999999999999999999"));
});

test("VPA validation accepts syntax without claiming account ownership", () => {
  for (const vpa of [
    "merchant@upi",
    "my.shop-42@okaxis",
    "1234567890@ybl",
    "demo@upi",
    " merchant@upi ",
  ]) {
    assert.equal(validateVpa(vpa), true, vpa);
  }
  for (const vpa of [
    "",
    "merchant",
    "@upi",
    "merchant@",
    "merchant@@upi",
    "merchant name@upi",
    "merchant@up i",
    "merchant@upi?am=1",
    "<script>@upi",
  ]) {
    assert.equal(validateVpa(vpa), false, vpa);
  }
});

test("UPI URI encodes parameters exactly and uses INR with two decimal places", () => {
  assert.equal(
    buildUpiUrl({ vpa: "merchant@upi", name: "Merchant", amount: 2000 }),
    "upi://pay?pa=merchant%40upi&pn=Merchant&am=2000.00&cu=INR",
  );
  const uri = buildUpiUrl({
    vpa: "bistro@upi",
    name: "Bombay & Co. / मुंबई",
    amount: "123.45",
    transactionId: "split-123_part-2",
    note: "Invoice #42 & table 2",
  });
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "upi:");
  assert.equal(parsed.hostname, "pay");
  assert.deepEqual(Object.fromEntries(parsed.searchParams), {
    pa: "bistro@upi",
    pn: "Bombay & Co. / मुंबई",
    am: "123.45",
    cu: "INR",
    tr: "split-123_part-2",
    tn: "Invoice #42 & table 2",
  });
  assert.equal(parsed.searchParams.has("tid"), false);
  assert.equal(parsed.searchParams.has("mc"), false);
  assert.match(uri, /%26/);
  assert.match(uri, /%20/);
});

test("UPI builder rejects malformed input without constructing payable links", () => {
  const valid = { vpa: "merchant@upi", name: "Merchant", amount: 1 };
  assert.throws(() => buildUpiUrl({ ...valid, vpa: "bad" }), /UPI ID/);
  assert.throws(() => buildUpiUrl({ ...valid, name: "" }), /merchant name/);
  assert.throws(() => buildUpiUrl({ ...valid, amount: "1.001" }), /decimal/);
  assert.throws(
    () => buildUpiUrl({ ...valid, transactionId: "x".repeat(36) }),
    /reference/,
  );
  assert.throws(
    () => buildUpiUrl({ ...valid, transactionId: "abc&am=1" }),
    /reference/,
  );
  assert.throws(() => buildUpiUrl({ ...valid, note: "x".repeat(81) }), /note/);
});
