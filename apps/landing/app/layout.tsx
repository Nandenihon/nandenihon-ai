import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import React, { Suspense } from "react";
import "./globals.css";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nandenihon.com"),
  title: "Nande Nihon",
  description: "Platform Belajar Bahasa Jepang",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Nande Nihon",
    description: "Platform Belajar Bahasa Jepang",
    url: "https://nandenihon.com",
    siteName: "Nande Nihon",
    type: "website",
  },
};

interface NewAppLayoutProps {
  children: React.ReactNode;
}

function AppLayout({ children }: NewAppLayoutProps) {
  return (
    <html lang="en" className={notoSans.variable}>
      <body className="min-h-screen bg-white relative">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        <main className="relative">{children}</main>
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}

export default AppLayout;
