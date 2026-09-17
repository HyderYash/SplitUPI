import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight, Download, Play } from "lucide-react";
export const metadata: Metadata = {
  title: "SplitUPI — Launch kit",
  description:
    "Two product graphics and a fully animated SplitUPI product film.",
};
export default function LaunchKit() {
  return (
    <div className="container launch-kit">
      <div className="eyebrow">SPLITUPI / LAUNCH KIT</div>
      <h1>Made to be shared.</h1>
      <p>
        Two high-resolution graphics. One 36-second product story, built in HTML
        and exported as a video. All in a portrait 4:5 format.
      </p>
      <div className="launch-actions">
        <a
          href="/launch/splitupi-launch-kit.zip"
          download
          className="button button-primary"
        >
          <Download size={16} />
          Download everything
        </a>
        <a
          href="/launch/splitupi-film.html"
          className="button button-secondary"
        >
          <Play size={15} />
          Open the animated HTML
          <ArrowUpRight size={14} />
        </a>
      </div>
      <video
        className="launch-video"
        controls
        playsInline
        preload="metadata"
        poster="/launch/splitupi-film-poster.jpg"
      >
        <source src="/launch/splitupi-product-film.mp4" type="video/mp4" />
        Your browser does not support video playback.
      </video>
      <div className="launch-actions">
        <a
          href="/launch/splitupi-product-film.mp4"
          download
          className="button button-secondary"
        >
          <Download size={15} />
          Download MP4
        </a>
        <a
          href="/launch/SplitUPI-animated-demo.html"
          download
          className="button button-secondary"
        >
          <Download size={15} />
          Download standalone HTML
        </a>
        <a
          href="/launch/linkedin-post.txt"
          download
          className="button button-secondary"
        >
          <Download size={15} />
          LinkedIn post
        </a>
      </div>
      <div className="launch-grid">
        {[1, 2].map((n) => (
          <article className="launch-item" key={n}>
            <Image
              src={`/launch/splitupi-linkedin-0${n}.png`}
              alt={
                n === 1
                  ? "SplitUPI: one ₹6,000 bill split into three ₹2,000 requests to the same merchant"
                  : "SplitUPI: setup, split, and manually track each payment"
              }
              width={1080}
              height={1350}
              sizes="(max-width:700px) 100vw, 50vw"
            />
            <div>
              <h2>
                {n === 1
                  ? "One bill. Multiple possibilities."
                  : "Keep the picture clear."}
              </h2>
              <a
                href={`/launch/splitupi-linkedin-0${n}.png`}
                download
                className="button button-secondary"
              >
                <Download size={15} />
                Download PNG
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
