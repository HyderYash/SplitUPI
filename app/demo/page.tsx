import { DemoButton } from "@/components/demo-button";
export default function DemoPage() {
  return (
    <div className="container empty-state">
      <div className="eyebrow" style={{ marginBottom: 15 }}>
        WELCOME TO THE EXPERIMENT
      </div>
      <h1>A dinner bill. Three requests.</h1>
      <p>
        Try the full SplitUPI flow with The Bombay Bistro and a ₹6,000 sample
        bill. No money moves. A fresh demo will be saved in this browser.
      </p>
      <DemoButton variant="primary">Start live demo</DemoButton>
    </div>
  );
}
