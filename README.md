# SplitUPI

**One restaurant bill. Multiple UPI payments.**

SplitUPI is an experimental, mobile-first Next.js prototype for preparing several UPI payment requests against one merchant bill. It builds amount-specific UPI deep links and QR codes, tracks user-reported completion locally, and produces a printable summary.

It is **not a payment processor, settlement verifier, or production-ready payment product**. It makes no promise about fees or how NPCI, banks, PSPs, or merchants classify transactions. The ₹2,000 default is a visible, editable demonstration setting, not a verified regulatory threshold. Current research verifies the announced framework in official sources, but does not establish any fee outcome for split requests; see [the launch research](docs/market-research-2026-09-17.md).

## What works

- Merchant name, VPA, invoice, and bill entry with validation.
- Transparent fixed-amount, equal, and custom splits that preserve the exact total.
- A payment session with progress, sequential payments by default, and an explicit parallel-payment option.
- `upi://pay` links and real QR encoding for merchant details entered by the user.
- Manual completion with the label **“Demo confirmation — not bank-verified.”**
- Local persistence, cancelled payment states, and a printable receipt-style summary.
- A safe, fictional demonstration session, responsive light/dark UI, and share metadata.

## Why this exists

This developer experiment explores the user experience of collecting one restaurant bill through multiple payment requests. Its useful building blocks are exact amount allocation, clear payment instructions, and honest reconciliation states. It does not implement or recommend bypassing fees, transaction limits, fraud controls, merchant controls, or provider rules.

## Local development

Use Node.js 24 or newer and pnpm 11.19.0. This project pins Next.js 16.3.5 and React 19.3.0. From the repository root:

```sh
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build:

```sh
pnpm build
pnpm start
```

No database, authentication, payment gateway, or required environment variable is needed. Share metadata defaults to `https://splitupi.webnaut.in`. Set `NEXT_PUBLIC_SITE_URL` to your actual public origin to override it. This value is public; do not put secrets in it.

## Money and splitting

All stored and calculated amounts use **integer paise**. The UI accepts rupee amounts with at most two decimal places; formatting adds the rupee symbol and Indian digit grouping. Never use floating-point rupee arithmetic to reconcile a bill.

| Bill | Default split |
| --- | --- |
| ₹2,000 | ₹2,000 |
| ₹2,001 | ₹2,000 + ₹1 |
| ₹5,500 | ₹2,000 + ₹2,000 + ₹1,500 |
| ₹6,000 | ₹2,000 + ₹2,000 + ₹2,000 |
| ₹7,400 | ₹2,000 + ₹2,000 + ₹2,000 + ₹1,400 |
| ₹75,000 | 37 × ₹2,000 + ₹1,000 |

The threshold strategy emits full chunks up to the chosen amount and then any remainder. Equal splitting distributes indivisible paise deterministically so the total remains exact. Custom splitting requires every amount to be positive and the sum to equal the bill. All strategies show the breakdown before session creation. See [the architecture notes](docs/architecture.md).

## UPI links and QR codes

The UPI utility builds a URI with `pa` (VPA), `pn` (payee name), `am` (fixed two-decimal INR amount), and `cu=INR`. Optional notes use `tn`; an optional transaction reference uses `tr`. Values are URL-encoded.

```text
upi://pay?pa=merchant%40upi&pn=Merchant&am=2000.00&cu=INR
```

The QR library encodes the same URI used by the payment button. It is not an image representing a fake payment payload. Field definitions are documented in [NPCI’s merchant ecosystem circular](https://www.npci.org.in/PDF/npci/upi/circular/2017/Circular18_BankCompliances_to_enbaleUPIMerchantecosystem_0.pdf). This reference does not guarantee acceptance by every UPI app: deep-link handling, amount treatment, and merchant eligibility vary by app and payment provider. VPA syntax validation does not verify ownership or existence.

The landing page’s **Live demo** uses `demo@upi` only as a placeholder. Its ownership or nonexistence has not been verified. The demo therefore disables real payment launch and uses a clearly non-payable demo QR payload. Enter a merchant VPA that you are authorized to use to generate a real payment URI. The shareable `/demo` page requires **Start live demo** to create a fresh sample session in the visitor’s browser.

## Test a real UPI request

1. Obtain a consenting merchant’s correct VPA. Agree on a small real test amount, starting at ₹1, and any refund or accounting arrangement.
2. Open **Create payment**, enter the merchant’s name, real VPA, and test amount, then review the split.
3. On a phone with a supported UPI app, use **Open UPI App**. On a laptop, display the QR and scan it using the phone’s UPI app.
4. Verify the recipient identity, amount, currency, and any warnings **inside the UPI app** before approving. An entered display name is not proof of the account owner.
5. Check the actual result in the UPI app and with the recipient. Only then use the prototype’s manual completion control. That local status remains unverified.

To access a local development server from a phone on the same trusted Wi-Fi network:

```sh
pnpm dev --hostname 0.0.0.0
```

Open `http://<your-laptop-lan-ip>:3000` on the phone. The laptop must permit inbound access to that port. Alternatively, leave the app open on the laptop and scan its real QR. A desktop may have no handler for a `upi://` link.

For a complete no-money walkthrough and macOS phone setup, see [the demo guide](docs/demo-guide.md).

## Verification and persistence limits

Opening a UPI app, displaying a QR, returning to the browser, or clicking **Payment completed** does not prove payment. A raw deep link does not provide authoritative settlement confirmation to this website. The confirmation dialog records only the user’s statement; receipts and progress must be read in that context.

Sessions are stored in this browser’s `localStorage`, scoped to its origin. They are editable client data, can disappear when site data is cleared, and do not synchronize between devices or browsers. A copied demo link can start a demonstration elsewhere; it does not transfer a private payment session or its payment history. Do not enter sensitive information that does not belong in local browser storage.

Sequential gating, confirmation dialogs, and disabled controls reduce accidental repeated actions in this UI. They **cannot invalidate an already copied QR/URI, expire an external payment request, or prevent someone from making a second transfer in a UPI app**. Cancelling a local item does not cancel a bank transfer. There is no payment-expiry guarantee.

## Checks

Available verification commands:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For browser tests, keep the app running at `http://localhost:3000` with `pnpm dev` in one terminal and run this in another:

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

The Playwright configuration tests desktop and mobile Chromium viewports. It uses `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` when supplied, otherwise an installed macOS Google Chrome if found, otherwise Playwright’s downloaded Chromium. Browser installation is a one-time setup step.

The automated tests cover exact splitting, validation, decoding a generated QR back to its URI, storage state transitions, and browser flows. Review the test files for their precise coverage; these commands do not prove real bank settlement or universal UPI app compatibility. Automated tests do not send a real UPI transfer.

Manually check the landing → create → session → receipt flow on narrow and wide screens, light/dark themes, keyboard navigation, cancelling confirmation, sequential/parallel controls, local reload persistence, and print preview. Use a safe demo for interface checks. Real-payment interoperability requires the separate consenting-merchant test above.

## Deploy to Vercel

1. Commit the application to your own Git repository and push it to GitHub, GitLab, or Bitbucket.
2. In Vercel, choose **Add New → Project**, import that repository, and select its application root.
3. Choose the **Next.js** framework preset. Vercel should detect pnpm from `pnpm-lock.yaml`; use `pnpm install --frozen-lockfile` as the install command and `pnpm build` as the build command if entering them explicitly. Leave the output directory at the Next.js default.
4. Select Node.js 24.x or a newer supported version. No required environment variables or external services need configuration.
5. Optionally add `NEXT_PUBLIC_SITE_URL` with the final HTTPS origin. Redeploy after changing it because public environment variables are built into the application.
6. Choose **Deploy**. Open the deployed URL and run the safe demo through its receipt. Check share metadata, a fresh session, and refresh persistence on the production origin.

Use Vercel’s standard Next.js runtime. Do not enable static export: the application has dynamic session and receipt routes. Moving from localhost to a deployed origin starts with different local storage; existing sessions do not migrate automatically.

Reference: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs) and [supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

## Production direction

A legitimate production version needs an approved PSP/gateway/bank integration, a server-side session and transaction ledger, authenticated access appropriate to the product, provider-issued references, signed webhook verification, and authoritative amount/payee reconciliation. Browser intent launches and manual assertions must remain separate from verified payment records. See [the proposed architecture](docs/architecture.md#future-authoritative-verification).

**This is an experimental prototype and does not determine how NPCI, banks, PSPs or merchants classify or price transactions. Actual payment treatment depends on applicable rules and payment-provider implementation.**

The premium mobile interface uses a bundled Inter variable font, compact payment cards and touch-friendly controls. Open `/launch` for two LinkedIn graphics, a 36-second animated HTML walkthrough, its MP4 export and a downloadable launch kit. See [launch assets and rendering instructions](docs/launch-assets.md) and [the research-backed LinkedIn draft](docs/linkedin-launch-post.md).
