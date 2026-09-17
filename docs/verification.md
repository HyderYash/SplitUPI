# Verification record

Verified locally on September 17, 2026. The final production build was served with `pnpm start` on port 3000.

| Check | Result |
| --- | --- |
| Locked dependency installation | `pnpm install --frozen-lockfile` passed |
| ESLint | `pnpm lint` passed |
| Strict TypeScript | `pnpm typecheck` and production type check passed |
| Unit tests | 27 passed |
| Production build | `pnpm build` passed without build errors |
| Browser tests | 32 passed against the production server, desktop and mobile Chromium (30 in the full run plus both corrected fresh-entry checks) |

Covered the requested threshold amounts (₹2,000, ₹2,001, ₹5,500, ₹6,000, ₹7,400 and ₹75,000), exact decimal sums, equal/custom strategies, invalid VPAs, storage errors and reload persistence, sequential/parallel requests, cancellation, completed-request immutability, repeat-launch warnings, modal keyboard focus, and corrupt local data.

The actual SVG rendered in the browser was independently decoded and matched the UPI URI's payee, amount, currency, reference, and note. The sample demo QR was independently decoded as non-payment text. No UPI app was launched or bank transfer performed by these tests.

Desktop and mobile light/dark layouts were checked. A 320px landing-page overflow found during testing was fixed and the full browser suite passed afterward. The in-app browser independently confirmed 320px content width at a 320px viewport. The live demo was manually exercised through its final receipt.

The Open Graph endpoint returned a 1200×630 PNG. Print stylesheet rendering was visually inspected; the browser also generated a sample receipt PDF. Browser artifacts, including screenshots, the print-layout image and sample PDF, are written to the ignored `test-results/` directory when running tests. Re-running Playwright replaces those artifacts.

## Premium mobile and launch kit verification

The September 17 polish was checked at 320, 360, 390 and 430px, with desktop coverage at 1365px. The create screen uses static styles loaded from the root layout, avoiding a styled-jsx injection delay found during fresh-page QA. Direct entry, reload and client navigation display the same layout. Mobile payment cards, bottom-sheet dialogs, touch targets and dark receipts were visually inspected.

Both launch images are 1080 × 1350. FFprobe confirms the video has 1,080 frames at 30fps and exactly 36 seconds, with H.264 video and AAC audio. Full-file decoding reported no errors. Chrome successfully played the MP4, and the embedded standalone HTML played offline without page errors. Deterministic film seeks, all seven scenes, the sample QR and the final domain card were inspected. The ZIP passed archive integrity checks.

The requested hostname did not resolve during the launch preparation check. The app and launch kit are running locally; no public deployment is implied.

## Limits of this verification

- Mobile coverage uses Chromium viewport/device emulation, not physical Android/iOS UPI apps.
- A consenting merchant's VPA must be tested on a real phone to establish app-specific deep-link and scanning interoperability.
- Local confirmation is not settlement evidence. Authoritative reconciliation still requires a legitimate bank/PSP integration.
- No public deployment, repository push, social post, or real transfer was performed.
