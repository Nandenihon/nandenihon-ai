import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";

const notoSans = Noto_Sans({
    subsets: ["latin"],
    style: ["normal", "italic"],
    variable: "--font-noto-sans",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://nandenihon.com"),
    title: "Admin Portal - Nande Nihon",
    description: "Admin portal for managing Nande Nihon Japanese learning platform",
    alternates: {
        canonical: "./",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={notoSans.variable}>
            <body className="bg-neutral-10 min-h-screen">{children}</body>
        </html>
    );
}
