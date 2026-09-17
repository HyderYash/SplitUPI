import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
const mode = process.argv[2] || "images";
const base = process.env.LAUNCH_BASE_URL || "http://localhost:3000";
const output = path.resolve("public/launch");
await fs.mkdir(output, { recursive: true });
await fs.mkdir("artifacts/launch", { recursive: true });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({
  headless: true,
  executablePath: existsSync(chrome) ? chrome : undefined,
});
const page = await browser.newPage({
  viewport: { width: 1080, height: 1350 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
try {
  if (mode === "images") {
    for (const [card, name] of [
      [1, "splitupi-linkedin-01.png"],
      [2, "splitupi-linkedin-02.png"],
    ]) {
      await page.goto(`${base}/launch/linkedin-graphics.html?card=${card}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
    if (mode !== "images") await page.waitForFunction(() => document.documentElement.dataset.filmReady === "true");
      await page.screenshot({
        path: path.join(output, name),
        animations: "disabled",
      });
      console.log(name);
    }
  } else if (mode === "film") {
    await page.goto(`${base}/launch/splitupi-film.html?export=1&paused=1&t=0`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    if (mode !== "images") await page.waitForFunction(() => document.documentElement.dataset.filmReady === "true");
    const duration = await page.evaluate(() => window.FILM_DURATION);
    if (duration !== 36) throw new Error("Expected 36-second film");
    const fps = 30;
    const frames = Math.round(duration * fps);
    const silent = path.resolve("artifacts/launch/splitupi-film-silent.mp4");
    const encoder = spawn(
      "/opt/homebrew/bin/ffmpeg",
      [
        "-y",
        "-f",
        "image2pipe",
        "-vcodec",
        "png",
        "-r",
        String(fps),
        "-i",
        "pipe:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        silent,
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let log = "";
    encoder.stderr.on("data", (d) => {
      log += d.toString();
      if (log.length > 6000) log = log.slice(-6000);
    });
    const done = new Promise((resolve, reject) =>
      encoder.on("exit", (code) =>
        code === 0 ? resolve() : reject(new Error(log)),
      ),
    );
    for (let frame = 0; frame < frames; frame++) {
      await page.evaluate((t) => window.seekFilm(t), frame / fps);
      const png = await page.screenshot({ type: "png" });
      if (!encoder.stdin.write(png)) await once(encoder.stdin, "drain");
      if (frame % 150 === 0) console.log(`Rendered ${frame}/${frames} frames`);
    }
    encoder.stdin.end();
    await done;
    console.log("Silent video complete.");
    const wav = path.resolve("artifacts/launch/splitupi-original-audio.wav");
    await createAudio(wav, duration);
    await new Promise((resolve, reject) => {
      const proc = spawn(
        "/opt/homebrew/bin/ffmpeg",
        [
          "-y",
          "-i",
          silent,
          "-i",
          wav,
          "-c:v",
          "copy",
          "-c:a",
          "aac",
          "-b:a",
          "160k",
          "-shortest",
          "-movflags",
          "+faststart",
          path.join(output, "splitupi-product-film.mp4"),
        ],
        { stdio: ["ignore", "ignore", "pipe"] },
      );
      let e = "";
      proc.stderr.on("data", (d) => (e += d));
      proc.on("exit", (c) => (c === 0 ? resolve() : reject(new Error(e))));
    });
    console.log("splitupi-product-film.mp4");
  } else if (mode === "frames") {
    await page.goto(`${base}/launch/splitupi-film.html?export=1&paused=1&t=0`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    if (mode !== "images") await page.waitForFunction(() => document.documentElement.dataset.filmReady === "true");
    await fs.mkdir("artifacts/launch/storyboard", { recursive: true });
    for (const t of [0, 3, 7, 12, 17, 22, 27, 33, 35.8]) {
      await page.evaluate((t) => window.seekFilm(t), t);
      await page.screenshot({
        path: `artifacts/launch/storyboard/frame-${String(t).replace(".", "_")}.png`,
      });
      console.log(`frame ${t}`);
    }
  } else throw new Error("Use images, film or frames");
} finally {
  await browser.close();
}
async function createAudio(file, seconds) {
  const rate = 48000,
    samples = rate * seconds;
  const data = Buffer.alloc(samples * 2);
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chords = [
    [50, 57, 61, 66],
    [47, 54, 57, 62],
    [43, 50, 57, 59],
    [45, 52, 57, 61],
  ];
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const beat = 60 / 88;
    const chord = chords[Math.floor(t / (beat * 8)) % 4];
    let x = 0;
    for (let j = 0; j < chord.length; j++) {
      const f = hz(chord[j]);
      const trem = 0.65 + 0.35 * Math.sin(t * 0.8 + j);
      x +=
        0.017 *
        trem *
        (Math.sin(2 * Math.PI * f * t) +
          0.15 * Math.sin(2 * Math.PI * f * 2 * t));
    }
    const step = Math.floor(t / (beat / 2)),
      age = t - step * (beat / 2);
    const note = chord[[0, 2, 1, 3, 2, 1, 3, 1][step % 8]] + 24;
    const env = Math.exp(-age * 10) * (1 - Math.exp(-age * 200));
    x += 0.07 * env * Math.sin(2 * Math.PI * hz(note) * t);
    const fade = Math.min(1, t / 1.5, (seconds - t) / 2.5);
    x *= Math.max(0, fade);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x)) * 32767), i * 2);
  }
  const head = Buffer.alloc(44);
  head.write("RIFF");
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  await fs.writeFile(file, Buffer.concat([head, data]));
}
