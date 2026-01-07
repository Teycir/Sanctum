import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TubesCursor } from "./components/TubesCursor";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL('https://sanctumvault.online'),
  title: {
    default: "Sanctum - Zero-Trust Encrypted Vault with Plausible Deniability",
    template: "%s | Sanctum Vault"
  },
  description: "Military-grade encrypted vault for activists, journalists & whistleblowers. XChaCha20-Poly1305 encryption, IPFS storage, plausible deniability. 100% free, zero server trust.",
  keywords: ["encrypted vault", "plausible deniability", "zero trust", "XChaCha20", "IPFS storage", "client-side encryption", "secure storage", "privacy tool", "activist security", "journalist protection", "whistleblower security", "duress protection", "hidden vault", "decentralized storage"],
  authors: [{ name: "Teycir Ben Soltane", url: "https://teycirbensoltane.tn" }],
  creator: "Teycir Ben Soltane",
  publisher: "Sanctum Vault",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sanctumvault.online",
    title: "Sanctum - Zero-Trust Encrypted Vault with Plausible Deniability",
    description: "Military-grade encrypted vault for high-risk users. XChaCha20-Poly1305 encryption, IPFS storage, plausible deniability. 100% free.",
    siteName: "Sanctum Vault",
    images: [{
      url: "/sanctum_ascii.svg",
      width: 800,
      height: 180,
      alt: "Sanctum Vault - Zero-Trust Encryption"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanctum - Zero-Trust Encrypted Vault",
    description: "Military-grade encrypted vault with plausible deniability. XChaCha20-Poly1305, IPFS, 100% free.",
    images: ["/sanctum_ascii.svg"],
    creator: "@Sanctum"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://sanctumvault.online"
  },
  category: "Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Sanctum Vault",
              "applicationCategory": "SecurityApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Zero-trust encrypted vault system with plausible deniability for activists, journalists, and whistleblowers. Features XChaCha20-Poly1305 encryption and IPFS storage.",
              "url": "https://sanctumvault.online",
              "author": {
                "@type": "Person",
                "name": "Teycir Ben Soltane",
                "url": "https://teycirbensoltane.tn"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "5",
                "ratingCount": "1"
              },
              "featureList": [
                "XChaCha20-Poly1305 Encryption",
                "Plausible Deniability",
                "IPFS Decentralized Storage",
                "Zero Server Trust",
                "Auto-Lock Security",
                "Panic Key Protection"
              ]
            })
          }}
        />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <TubesCursor />
        {children}
      </body>
    </html>
  );
}
