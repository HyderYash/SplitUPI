import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Fingerprint,
  Layers3,
  MoveUpRight,
  Play,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Split,
} from "lucide-react";
import { DemoButton } from "@/components/demo-button";
import { ResumeSession } from "@/components/resume-session";
import { BillPreview } from "@/components/bill-preview";
export default function Home() {
  return (
    <div className="landing premium-landing">
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="status-dot" /> SMALL EXPERIMENT. EVERYDAY
            POSSIBILITY.
          </div>
          <h1>
            One bill.
            <br />
            Multiple UPI
            <br />
            <span>payments.</span>
          </h1>
          <p className="hero-description">
            For the table. For the total.
            <br />A clearer way to split one merchant bill into multiple UPI
            payment requests.
          </p>
          <div className="hero-actions">
            <Link href="/create" className="button button-primary">
              Try the prototype <ArrowUpRight size={19} />
            </Link>
            <a href="#how-it-works" className="text-button">
              See how it works <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-footnote">
            <Check size={13} /> No sign-up. No download. Bring your UPI app.
          </div>
          <ResumeSession />
        </div>
        <BillPreview />
      </section>
      <div className="value-rail container">
        <span>
          <ScanLine size={18} />
          Real UPI intents & QR codes
        </span>
        <span>
          <SlidersHorizontal size={18} />
          Exact splits. Down to the paisa.
        </span>
        <span>
          <Fingerprint size={18} />
          No account. Stored on your device.
        </span>
      </div>
      <section className="product-story container" id="how-it-works">
        <div className="story-heading">
          <div>
            <span className="eyebrow">
              FROM THE FIRST TAP TO THE LAST RUPEE
            </span>
            <h2>
              A simpler way
              <br />
              to settle the table.
            </h2>
          </div>
          <p>
            One destination for every payment.
            <br />
            One place to keep the picture clear.
          </p>
        </div>
        <div className="story-steps">
          <article>
            <div className="story-step-top">
              <span>01 / SET UP</span>
              <StoreIcon />
            </div>
            <div className="mini-field">
              <span>Merchant UPI ID</span>
              <strong>your-merchant@bank</strong>
              <Check size={16} />
            </div>
            <h3>Start with the bill.</h3>
            <p>
              Add the merchant, UPI ID, and total. That’s all you need to get
              started.
            </p>
          </article>
          <article>
            <div className="story-step-top">
              <span>02 / MAKE IT YOURS</span>
              <Split size={24} />
            </div>
            <div className="mini-strategies">
              <span className="selected">By amount</span>
              <span>Equal</span>
              <span>Custom</span>
            </div>
            <h3>Find your kind of split.</h3>
            <p>
              Choose equal payments, an amount per request, or a custom
              breakdown.
            </p>
          </article>
          <article>
            <div className="story-step-top">
              <span>03 / PAY & KEEP TRACK</span>
              <ScanLine size={24} />
            </div>
            <div className="mini-progress">
              <span>
                <Check size={14} />
                Manually confirmed
              </span>
              <span>1 / 3</span>
              <i />
            </div>
            <h3>Pay. Confirm. Keep going.</h3>
            <p>
              Open your UPI app or scan a QR. Return to mark the request paid
              yourself.
            </p>
          </article>
        </div>
      </section>
      <section className="film-feature container">
        <div className="film-feature-copy">
          <span className="eyebrow">
            A LITTLE LESS EXPLAINING. A LITTLE MORE SHOWING.
          </span>
          <h2>
            Meet your next
            <br />
            <span>dinner-time experiment.</span>
          </h2>
          <p>
            A ₹6,000 bill. Three requests.
            <br />
            See the whole flow in 36 seconds.
          </p>
          <Link
            href="/launch/splitupi-film.html"
            className="button button-primary"
          >
            <Play size={15} fill="currentColor" />
            Watch the product film
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <Link
          href="/launch/splitupi-film.html"
          className="film-cover"
          aria-label="Watch the animated SplitUPI product film"
        >
          <div className="film-cover-brand">
            SplitUPI <MoveUpRight size={21} />
          </div>
          <div className="film-cover-amount">₹6,000</div>
          <div className="film-cover-line" />
          <div className="film-cover-splits">
            <span>₹2,000</span>
            <span>₹2,000</span>
            <span>₹2,000</span>
          </div>
          <div className="film-play">
            <Play size={18} fill="currentColor" />
          </div>
          <div className="film-cover-bottom">
            <span>ONE BILL. MULTIPLE POSSIBILITIES.</span>
            <span>00:36</span>
          </div>
        </Link>
      </section>
      <section className="demo-section container">
        <span className="eyebrow">EXPLORE IT. NO MONEY MOVES.</span>
        <h2>
          Take a seat.
          <br />
          Try the split.
        </h2>
        <p>
          A sample merchant. A ready-to-go ₹6,000 bill.
          <br />
          The full experience, with no real transfer.
        </p>
        <DemoButton variant="primary" />
        <span className="demo-small-print">
          <ShieldCheck size={14} />
          Sample demo uses a non-payable QR.
        </span>
      </section>
      <section className="honesty-note container">
        <ShieldCheck size={24} />
        <div>
          <h3>Built with the fine print upfront.</h3>
          <p>
            Payment confirmations are manual and not bank-verified. Splitting a
            bill does not guarantee any change in fees. Payment fees and
            transaction treatment depend on current NPCI, bank and PSP rules.
          </p>
          <Link href="/about">
            Read about the experiment
            <ChevronRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
function StoreIcon() {
  return <Layers3 size={24} />;
}
