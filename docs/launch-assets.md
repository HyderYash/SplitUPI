# Launch assets

The local `/launch` page previews and downloads the complete kit. Nothing has been posted or deployed by this work. All assets carry the requested `splitupi.webnaut.in` domain; connect it to the verified build before posting. The hostname did not resolve during the September 17, 2026 check.

| Deliverable | File in `public/launch/` | Format |
| --- | --- | --- |
| Product graphic | `splitupi-linkedin-01.png` | 1080 × 1350 PNG |
| Workflow graphic | `splitupi-linkedin-02.png` | 1080 × 1350 PNG |
| Product film | `splitupi-product-film.mp4` | 36 seconds, 1080 × 1350, 30 fps, H.264 + AAC |
| Offline editable film | `SplitUPI-animated-demo.html` | Self-contained HTML, CSS, JavaScript and font |
| LinkedIn copy | `linkedin-post.txt` | Plain text |
| Complete package | `splitupi-launch-kit.zip` | Images, MP4, HTML, copy, usage notes and font license |

The film is rendered from UI built in HTML/CSS/JavaScript. Its seven scenes explain entering a bill, choosing a split, preparing requests to one merchant, opening a non-payable demo QR, recording manual confirmations and viewing the summary. Every scene is readable without audio. The MP4 adds original synthesized ambient music; the standalone HTML is silent. The video contains no voiceover or stock music.

The screenshots and film use clearly labelled sample data. They promise no fee savings or bank verification. See [current research and counterevidence](market-research-2026-09-17.md), [the post](linkedin-launch-post.md), and [the film storyboard](film-storyboard.md).

## Recreate the assets

Run the app locally on port 3000. Install FFmpeg and have Chrome or Playwright Chromium available. The renderer currently uses the Homebrew FFmpeg path on this development machine. Override `LAUNCH_BASE_URL` if the app is served elsewhere.

```sh
node scripts/render-launch.mjs images
node scripts/render-launch.mjs frames
node scripts/render-launch.mjs film
node scripts/package-launch.mjs
```

Source graphics are in `public/launch/linkedin-graphics.html`; film sources are `splitupi-film.html`, `film.css` and `film.js` in the same folder. Edit those sources, then rerender and package. Raw frames and the silent intermediate export are ignored under `artifacts/launch/`.
