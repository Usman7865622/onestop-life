import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import OneStopAssistant from "../components/assistant/OneStopAssistant";
import Analytics from "../components/layout/Analytics";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import { SITE_URL, googleVerification, organizationJsonLd } from "../lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "OneStop Life | Everyday care made easier",
    template: "%s | OneStop Life",
  },
  description:
    "OneStop Life is Pakistan's healthcare super-app: book verified doctors, order lab tests with home sample collection, find blood banks, and get medicines delivered.",
  alternates: { canonical: SITE_URL },
  verification: googleVerification(),
  openGraph: {
    type: "website",
    siteName: "OneStop Life",
    title: "OneStop Life | Everyday care made easier",
    description:
      "Book verified doctors, order lab tests with home collection, find blood banks, and get medicines delivered across Pakistan.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/hero-home-health.jpg`, width: 1200, height: 798, alt: "OneStop Life" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OneStop Life | Everyday care made easier",
    description:
      "Book verified doctors, order lab tests with home collection, find blood banks, and get medicines delivered across Pakistan.",
    images: [`${SITE_URL}/hero-home-health.jpg`],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <SiteHeader />
        <div className="siteContent">{children}</div>
        <SiteFooter />
        <OneStopAssistant />
      </body>
    </html>
  );
}
