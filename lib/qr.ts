import QRCode from "qrcode";

/** Returns a real QR encoding the very same URI used by the Open UPI App link. */
export async function generateQrSvg(uri: string): Promise<string> {
  if (
    typeof uri !== "string" ||
    !uri.startsWith("upi://pay?") ||
    uri.length > 2000
  ) {
    throw new Error("A valid UPI payment URI is required to create this QR.");
  }
  return QRCode.toString(uri, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 4,
    width: 480,
    color: { dark: "#142921", light: "#ffffff" },
  });
}
