import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Code2,
  ScanLine,
  Server,
} from "lucide-react";
export default function About() {
  return (
    <div className="container about-page">
      <div className="eyebrow">THE EXPERIMENT / V0.1</div>
      <h1>
        Small requests.
        <br />
        Honest boundaries.
      </h1>
      <p className="lead">
        SplitUPI explores how one merchant bill can become several clear,
        trackable UPI payment requests.
      </p>
      <div className="about-grid">
        <article className="panel">
          <ScanLine />
          <h2>Real payment requests</h2>
          <p>
            For a merchant VPA you enter, each QR and deep link carries the same
            payee, the exact payment amount, and INR currency. Your UPI app
            handles the payment. Recipient identity and availability must be
            checked there.
          </p>
        </article>
        <article className="panel">
          <Code2 />
          <h2>Manual tracking today</h2>
          <p>
            “Paid” means someone confirmed the payment in this browser. SplitUPI
            cannot see your bank account or verify a transfer. Local records and
            printed summaries are not proof of settlement.
          </p>
        </article>
        <article className="panel">
          <Server />
          <h2>A path to verification</h2>
          <p>
            A production service would create payment requests through a
            legitimate PSP or bank integration, verify signed webhooks on a
            server, and reconcile the payee, amount and transaction reference
            before marking a request paid.
          </p>
        </article>
      </div>
      <div className="about-copy">
        <h2>The ₹2,000 default is just a setting.</h2>
        <p>
          It is an editable chunk size for this experiment, not a claim about a
          regulatory threshold. Choose equal payments, an amount per request, or
          a custom breakdown. No fee savings or transaction classification is
          promised.
        </p>
        <h2>Your data stays in this browser.</h2>
        <p>
          Sessions are saved in localStorage, without an account or a database.
          Other devices cannot open your session record. Clearing browser data
          removes it. A shared demo link starts a fresh sample; it never exposes
          your merchant or invoice.
        </p>
        <h2>The demo never initiates a payment.</h2>
        <p>
          The sample VPA demo@upi is illustrative and is not a verified
          merchant. Sample QR codes contain a non-payment demo marker, and UPI
          app launching is disabled. Enter your own merchant details to generate
          a real payment QR.
        </p>
        <h2>One more important distinction.</h2>
        <p>
          The app guides requests one at a time and locks completed payments. A
          previously copied QR remains usable outside this app. Always check
          your bank history before retrying a payment; this prototype cannot
          prevent duplicate bank transfers or reverse payments.
        </p>
        <a
          className="text-button"
          href="https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf"
          target="_blank"
          rel="noreferrer"
        >
          NPCI reference: UPI QR parameters <ArrowUpRight size={15} />
        </a>
      </div>
      <Link href="/create" className="button button-primary">
        Explore the prototype <ArrowRight size={17} />
      </Link>
    </div>
  );
}
