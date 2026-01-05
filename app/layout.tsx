import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ExtensionWarning } from './components/ExtensionWarning';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });


export const metadata: Metadata = {
  title: 'Sanctum - Client-Side Encrypted Vault',
  description: 'Zero-trust, client-side encrypted vault system with XChaCha20-Poly1305',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <ExtensionWarning />
        {children}
      </body>
    </html>
  );
}
