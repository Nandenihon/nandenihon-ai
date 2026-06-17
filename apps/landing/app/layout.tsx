import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import React from "react";
import "./globals.css";

const notoSans = Noto_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nande Nihon",
  description: "Platform Belajar Bahasa Jepang",
};

interface NewAppLayoutProps {
  children: React.ReactNode;
}

function AppLayout({ children }: NewAppLayoutProps) {
  return (
    <html lang="en">
      <body className={`${notoSans.className} min-h-screen bg-white relative`}>
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

export default AppLayout;
