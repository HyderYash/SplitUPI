import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>This page is off the menu.</h1>
      <p>Head back to SplitUPI to start a payment or explore the demo.</p>
      <Link href="/" className="button button-primary">
        Back to home
      </Link>
    </div>
  );
}
