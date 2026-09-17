import type { Metadata, Viewport } from "next";
import { AppHeader, AppFooter } from "@/components/app-shell";
import "./globals.css";
import "./premium.css";
import "./create-flow.css";
import "./mobile-flow.css";

const origin =
  process.env.NEXT_PUBLIC_SITE_URL || "https://splitupi.webnaut.in";
export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: "SplitUPI — One bill. Multiple UPI payments.",
  description: "An experimental UPI payment-splitting prototype.",
  openGraph: {
    title: "SplitUPI — One bill. Multiple UPI payments.",
    description: "An experimental UPI payment-splitting prototype.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f5",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('splitupi:theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}})()`,
          }}
        />
        <AppHeader />
        <main>{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
