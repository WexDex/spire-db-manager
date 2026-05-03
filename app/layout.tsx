import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSiteNav } from "./components/AppSiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Spire DB manager",
    template: "%s · Spire DB manager",
  },
  description:
    "Browse Slay the Spire card data (canonical STS_CARDS_DB from sts-planner-reworked)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
        <header className="shrink-0 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
          <AppSiteNav />
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
