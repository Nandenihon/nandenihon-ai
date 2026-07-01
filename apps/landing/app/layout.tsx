import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Analytics } from "@vercel/analytics/next";
import { Metadata } from "next";
import React from "react";
import "./globals.css";

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
      <body className="min-h-screen bg-white relative">
        <Navbar />
        <main className="relative">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}

export default AppLayout;
