# Launch copy

Replace `[URL]` with the deployed application URL. These drafts describe the prototype’s capabilities; they do not claim a bank-verified collection or fee outcome.

## X

Built SplitUPI: one restaurant bill → multiple UPI requests.

Exact splits, real UPI links/QRs for your merchant VPA, and a polished mobile flow.

The safe demo uses manual confirmation, not bank verification. No fee-saving claims.

Try it: [URL]

## LinkedIn

I built SplitUPI, an experimental prototype exploring a simple question: what should the experience look like when one restaurant bill is paid through multiple UPI requests?

The demo turns a ₹6,000 bill into three ₹2,000 requests. You can also choose equal or custom splits, enter a real merchant VPA to generate UPI links and QR codes, and print a receipt-style summary.

One important boundary: a browser opening a UPI app cannot independently confirm payment. Completion in this prototype is manually recorded and clearly labelled as not bank-verified. The built-in demo cannot initiate a real transfer.

Built with Next.js and TypeScript, with exact integer-paise calculations and local browser persistence. This is a UX and engineering experiment, not a promise about MDR or payment-provider rules. A production version would need a legitimate PSP or bank integration for authoritative reconciliation.

Try it: [URL]
