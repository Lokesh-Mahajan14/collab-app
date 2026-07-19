import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CollabFlow — Where Teams Build Together",
    template: "%s | CollabFlow",
  },
  description:
    "A real-time collaboration platform for modern teams. Manage projects, tasks, and conversations — all in one place.",
  keywords: ["collaboration", "project management", "team", "tasks", "real-time"],
  authors: [{ name: "CollabFlow" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://collabflow.app",
    title: "CollabFlow — Where Teams Build Together",
    description: "Real-time collaboration for modern teams.",
    siteName: "CollabFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "CollabFlow",
    description: "Real-time collaboration for modern teams.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
