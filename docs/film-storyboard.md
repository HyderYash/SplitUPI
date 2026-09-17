# SplitUPI animated launch film

A silent, self-explanatory, 36-second product film in a 1080 × 1350 (4:5) frame. Its type, UI cards and motion are rendered entirely in HTML/CSS/JavaScript, using the bundled Inter font. No remote assets, APIs or added packages are required.

## Playback

Open `/launch/splitupi-film.html`. The normal viewer scales the stage to the available width, including a 390px phone. Play/pause, replay and a seek bar sit outside the film frame. Space toggles playback, arrow keys move one second and R replays. Reduced-motion users start paused and can choose to play.

The HTML film includes no audio. The exported MP4 adds original synthesized ambient music. Every product step is explained on screen, so both versions work in a muted social feed.

## Timeline

| Time | Story | Motion |
| --- | --- | --- |
| 0–4.8s | One bill. Multiple UPI payments. A ₹6,000 sample dinner. | Amount counts up; three ₹2,000 cards fan out from the bill. |
| 4.8–10s | Enter The Bombay Bistro, sample merchant VPA and total. | Fields type in sequence; a cursor moves to and taps Preview split. |
| 10–15.5s | Choose an equal, custom or fixed split. | Equal tab slides into selection; the count becomes three; amounts divide into three cards. |
| 15.5–20.5s | All three requests point to the same merchant. | Payment cards arrive from alternating directions and settle into a clean stack. |
| 20.5–26.5s | Scan, pay in a UPI app, then confirm manually. | A scan line crosses a non-payable demo QR; the manual-confirmation dialog rises; a cursor taps. |
| 26.5–31.5s | Three manually confirmed shares, one summary. | Amount and progress fill; rows arrive in sequence, explicitly labelled Confirmed manually. |
| 31.5–36s | Split the bill. Keep the good part. | Green end card scales into position; logo settles; product URL and demo CTA appear. |

The persistent footer reads **Sample demo · no money moves**. The confirmation and receipt scenes additionally read **Manual confirmation · not bank-verified**. The QR encodes the plain text `SPLITUPI DEMO ONLY - NOT A PAYMENT`; it contains no UPI URI. The film has no clickable payment action and cannot launch a banking app. The sample VPA is display-only. The film does not claim fees are avoided, automatic settlement or live bank status.

## Deterministic render API

```js
window.FILM_DURATION; // 36
window.seekFilm(23.8); // pauses, renders the exact time; returns { time, duration, playing }
window.playFilm();
window.pauseFilm();
window.getFilmState(); // { time, duration, playing, width: 1080, height: 1350 }
```

Use `/launch/splitupi-film.html?export=1&paused=1&t=0` to render. Export mode fixes the viewport content to 1080 × 1350, hides viewer chrome, removes scaling, and starts paused. Set the browser viewport to those dimensions at device scale factor 1. Wait for `document.documentElement.dataset.filmReady === 'true'` before capturing.

All motion derives from the requested second. There are no independently running CSS animations or random values. Call `window.seekFilm(frame / fps)` before each screenshot; frame capture can therefore run faster or slower than real time. At 30 fps, capture frames 0 through 1079 for an exact 36-second export. The end card remains visible at `seekFilm(36)` for still captures.

Suggested visual QA frames: 2.8, 8.3, 13.8, 18.8, 23.3, 25.5, 30 and 34.8 seconds. `?paused=1&t=23.3` also opens any exact frame in the responsive viewer.

The film sources are `public/launch/splitupi-film.html`, `public/launch/film.css`, and `public/launch/film.js`. Rendered video is a separate export artifact; the HTML file itself is not an uploadable video.

## Verification on 17 September 2026

- Inspected nine 1080 × 1350 frames covering every scene, plus the three cursor tap moments.
- Inspected the responsive player at 390 × 844; document width remained 390px with no horizontal overflow.
- Verified play/pause controls advance and stop the film, and paused mode retains the requested timestamp.
- Repeated nonsequential seeks produced identical DOM and raw screenshot pixels for the same requested time.
- JavaScript syntax validation passed; the browser reported no page errors.
- Verified the embedded QR matrix exactly matches the QR library's encoding of the plain demonstration text. It contains no payment URI.
