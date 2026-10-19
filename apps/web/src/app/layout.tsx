import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import OneStopAssistant from "../components/assistant/OneStopAssistant";
import Analytics from "../components/layout/Analytics";
import SiteFooter from "../components/layout/SiteFooter";
import SiteHeader from "../components/layout/SiteHeader";
import { SITE_URL, googleVerification, organizationJsonLd } from "../lib/seo";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('osl-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}})();`,
          }}
        />
      </head>
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
