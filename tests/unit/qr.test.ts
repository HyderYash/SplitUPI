import assert from "node:assert/strict";
import { test } from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import sharp from "sharp";
import { generateQrSvg } from "../../lib/qr";
import { buildUpiUrl } from "../../lib/upi";

test("the generated SVG decodes to the exact payment URI", async () => {
  const uri = buildUpiUrl({
    vpa: "testmerchant@upi",
    name: "Bistro & Co.",
    amount: "2000.15",
    transactionId: "split-123-part-1",
    note: "TABLE-42",
  });
  const svg = await generateQrSvg(uri);
  assert.match(svg, /<svg/);
  const buffer = await sharp(Buffer.from(svg))
    .resize(960, 960, { kernel: "nearest" })
    .png()
    .toBuffer();
  const png = PNG.sync.read(buffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  assert.ok(decoded, "QR must be decodable by an independent decoder");
  assert.equal(decoded.data, uri);
  assert.equal(new URL(decoded.data).searchParams.get("am"), "2000.15");
});

test("QR generation rejects non-payment links", async () => {
  await assert.rejects(generateQrSvg("https://example.com"), /UPI payment URI/);
  await assert.rejects(generateQrSvg(""), /UPI payment URI/);
});
