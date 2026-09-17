# Demo and phone test guide

No real UPI transfer was initiated as part of creating this prototype. Automated browser tests use local state and payment payloads, not bank settlement. The steps below let you distinguish a safe product demonstration from a real payment test.

## A no-money walkthrough

1. Run `pnpm dev` and open [http://localhost:3000](http://localhost:3000).
2. Select **Live demo** on the landing page. If you open `/demo` instead, select **Start live demo**. Each action creates a fresh ₹6,000 session for The Bombay Bistro, invoice `TABLE-42`.
3. Confirm the **SAMPLE SESSION** badge and **Live demo. No money moves.** notice. There are three ₹2,000 requests. **Open UPI App** is disabled.
4. Select **Show QR** on Payment 1. The dialog says **Demo QR · no payment** and **Sample ₹2,000**. **View demo QR content** reveals plain demo text, not a `upi://` instruction. The QR cannot initiate a transfer.
5. Select **Back to payments**, then **Payment completed**. The confirmation explains that this simulates a sample request. Select **Yes, mark paid** to record the manual state.
6. Confirm that Payment 2 unlocks and that the paid amount changes to ₹2,000. Refresh the page: the state should remain in this browser.
7. Complete the next two requests the same way, or explicitly enable **Parallel payments** to explore out-of-order manual tracking.
8. Select **View receipt**. The summary says **Sample demo · no money moved** and **Demo confirmation — not bank-verified**. Select **Download receipt**, then choose your browser’s **Save as PDF** destination.
9. Select **Copy demo link** to share the `/demo` entry page. It shares the public demonstration, not your local session or payment history.

The header’s **Toggle color theme** control switches light/dark mode. A session that is still in progress offers **Cancel session** with a confirmation dialog; this closes pending local requests and preserves any manually paid entries.

## Open the laptop server on a phone

Connect both devices to the same trusted Wi-Fi network. The development script already binds to `0.0.0.0`; an explicit equivalent is:

```sh
pnpm dev --hostname 0.0.0.0
```

On macOS, find the Wi-Fi IP address:

```sh
ipconfig getifaddr en0
```

For example, if it prints `192.168.1.23`, open `http://192.168.1.23:3000` on the phone. If `en0` has no address, check **System Settings → Wi-Fi → Details → TCP/IP** for the active interface’s IPv4 address. Permit the development server through the laptop’s firewall if needed. Some guest networks prevent devices from reaching one another.

The phone’s browser has its own local storage. Start a new demo or create a new session there; copying a laptop session URL does not copy its data. Using `localhost` versus a LAN IP also changes the origin and its storage, even on the same laptop.

Clipboard access can be unavailable on a plain HTTP LAN address. The app provides readable fallback content; manually copy the displayed UPI ID or demo link, or use an HTTPS deployment. This does not prevent scanning a QR displayed on the laptop.

## Prepare a real payment request

Only test a transfer with a merchant who has agreed to it and whose VPA you have verified through a trusted channel. Use a small agreed amount, starting at ₹1. Entering a VPA is a syntax check, not account or recipient verification.

1. Select **Use a real merchant UPI ID** in the demo notice, or open `/create`. The replacement form pre-fills the sample merchant name and invoice but deliberately leaves the VPA empty. Replace the name and invoice as appropriate too.
2. Enter the actual merchant VPA and your small test amount. Review **By amount**, **Equal split**, or **Custom** and confirm that the preview exactly matches the intended total. Select **Split payment**.
3. Confirm the **MANUAL TRACKING** badge. These requests are payable; they are different from **SAMPLE SESSION** requests. `demo@upi` is reserved for the safe sample and cannot be used in this form.
4. On a phone, select **Open UPI App**. Alternatively, show the QR on a laptop and scan it with the phone’s UPI app. **View encoded UPI intent** reveals the actual URI for inspection.
5. Review the recipient identity and exact amount inside the UPI app before approving. Stop if the recipient, amount, or provider warnings do not match your intent. Generic UPI links and optional fields can behave differently across apps.
6. Verify the outcome in the UPI app and with the merchant before manually marking the request paid. SplitUPI’s confirmation remains self-reported and cannot independently verify that outcome.

When a request has already opened a UPI app, reopening it shows **Check before paying again**. Check transaction history first. Sequential controls and warnings cannot stop a second transfer made outside this website, invalidate a saved QR, or reverse a payment. The QR has no automatic expiry.

## Interpreting the result

- **Sample demo · no money moved** means only the prototype’s demonstration state changed.
- **Paid · manual** or **Self-reported · not bank-verified** means somebody used the confirmation control, not that a bank reported success.
- A printed receipt is a local record of those assertions, not a bank receipt.
- Production-grade confirmation requires the legitimate provider integration described in [architecture.md](architecture.md#future-authoritative-verification).
