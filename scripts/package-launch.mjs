import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const directory = path.resolve("public/launch");
const read = (name) => fs.readFile(path.join(directory, name), "utf8");
const font = await fs.readFile("public/fonts/inter-latin-wght-normal.woff2");
const fontUri = `data:font/woff2;base64,${font.toString("base64")}`;
const css = (await read("film.css")).replaceAll(
  "/fonts/inter-latin-wght-normal.woff2",
  fontUri,
);
const script = await read("film.js");
const standalone = (await read("splitupi-film.html"))
  .replace(/\s*<link rel="preload"[^>]+>/, "")
  .replace('<link rel="stylesheet" href="film.css">', `<style>${css}</style>`)
  .replace('<script src="film.js"></script>', `<script>${script}</script>`);
await fs.writeFile(path.join(directory, "SplitUPI-animated-demo.html"), standalone);
await sharp("artifacts/launch/storyboard/frame-3.png")
  .jpeg({ quality: 92 })
  .toFile(path.join(directory, "splitupi-film-poster.jpg"));

const kitReadme = `SplitUPI — LinkedIn launch kit

splitupi-linkedin-01.png and splitupi-linkedin-02.png
Two 1080 × 1350 PNGs in portrait 4:5 format.

splitupi-product-film.mp4
36 seconds · 1080 × 1350 · 30 fps · H.264 video + AAC audio.
The soundtrack is original synthesized music. No voiceover is required;
the walkthrough is fully explained on screen and works with sound off.

SplitUPI-animated-demo.html
Editable, standalone animation with embedded font, CSS and JavaScript.
Open in a browser, even offline. This HTML version is silent.
Space plays/pauses, arrows seek, R replays. Mobile controls are included.

linkedin-post.txt
Ready-to-copy draft. No social post has been published.

The assets use splitupi.webnaut.in as requested. Connect the domain to
the verified build before publishing. Sample footage is non-payable;
payment confirmations in the app are manual, not bank-verified.

Inter-LICENSE.txt
License for the bundled Inter typeface.
`;
await fs.writeFile(path.join(directory, "README-launch.txt"), kitReadme);
await fs.copyFile("public/fonts/Inter-LICENSE.txt", path.join(directory, "Inter-LICENSE.txt"));
const files = [
  "splitupi-linkedin-01.png",
  "splitupi-linkedin-02.png",
  "splitupi-product-film.mp4",
  "SplitUPI-animated-demo.html",
  "linkedin-post.txt",
  "README-launch.txt",
  "Inter-LICENSE.txt",
];
const zip = path.join(directory, "splitupi-launch-kit.zip");
await fs.rm(zip, { force: true });
execFileSync("zip", ["-j", "-q", zip, ...files.map((name) => path.join(directory, name))]);
for (const name of [...files, "splitupi-launch-kit.zip"]) {
  const { size } = await fs.stat(path.join(directory, name));
  console.log(`${name}: ${(size / 1024 / 1024).toFixed(2)} MB`);
}
