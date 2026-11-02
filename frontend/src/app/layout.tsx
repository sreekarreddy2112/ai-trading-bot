import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MarketMind India | AI Indian Stock Market Analyst",
  description:
    "AI-powered equity analytics, technical indicators, news sentiment, and quantitative backtester for Indian equities (NSE/BSE).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="stylesheet" href="/globals.compiled.css?v=2" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-slate-900 antialiased selection:bg-primary-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
