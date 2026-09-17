import { ImageResponse } from "next/og";
export const alt =
  "SplitUPI — One bill. Multiple UPI payments. Experimental prototype.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f7f8f5",
        padding: "65px 72px",
        fontFamily: "sans-serif",
        color: "#23372a",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700 }}>SplitUPI</span>
        <span style={{ fontSize: 18, color: "#70816b" }}>
          A PAYMENT-SPLITTING EXPERIMENT
        </span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 78,
          fontWeight: 600,
          letterSpacing: -4,
          lineHeight: 1.05,
          flexDirection: "column",
        }}
      >
        <span>One bill.</span>
        <span style={{ color: "#729678" }}>Multiple UPI payments.</span>
      </div>
      <div
        style={{ display: "flex", gap: 22, alignItems: "center", fontSize: 28 }}
      >
        <div
          style={{
            display: "flex",
            background: "#e7ede2",
            padding: "18px 25px",
            borderRadius: 10,
          }}
        >
          ₹6,000
        </div>
        <span>→</span>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              display: "flex",
              background: "#b7f5cc",
              padding: "18px 25px",
              borderRadius: 10,
            }}
          >
            ₹2,000
          </div>
        ))}
      </div>
      <span style={{ fontSize: 16, color: "#70816b" }}>
        Real UPI intents. Clear splits. Manual confirmation — not bank-verified.
      </span>
    </div>,
    { ...size },
  );
}
