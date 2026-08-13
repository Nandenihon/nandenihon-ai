import "./globals.css";
import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_JP } from "next/font/google";

const notoSans = Noto_Sans({
    subsets: ["latin"],
    style: ["normal", "italic"],
    variable: "--font-noto-sans",
    display: "swap",
});

const notoSansJP = Noto_Sans_JP({
    subsets: ["latin"],
    weight: ["300", "400", "500", "700"],
    variable: "--font-noto-sans-jp",
    display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL("https://nandenihon.com"),
    title: "Nande Nihon — Student Portal",
    description: "Portal belajar Bahasa Jepang untuk siswa Nande Nihon. Akses kursus N5, N4, dan N3 lengkap dengan video, teks, dan kuis interaktif.",
    keywords: ["belajar bahasa jepang", "JLPT", "N5", "N4", "N3", "nande nihon"],
    alternates: {
        canonical: "./",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja" className={`${notoSans.variable} ${notoSansJP.variable}`}>
            <body className="bg-neutral-0 min-h-screen">{children}</body>
        </html>
    );
}
