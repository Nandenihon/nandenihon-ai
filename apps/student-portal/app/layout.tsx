import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nande Nihon — Student Portal",
    description: "Portal belajar Bahasa Jepang untuk siswa Nande Nihon. Akses kursus N5, N4, dan N3 lengkap dengan video, teks, dan kuis interaktif.",
    keywords: ["belajar bahasa jepang", "JLPT", "N5", "N4", "N3", "nande nihon"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ja">
            <body className="bg-neutral-0 min-h-screen">{children}</body>
        </html>
    );
}
