import "./globals.css";
import type { Metadata } from "next";

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
        <html lang="en">
            <body className="bg-neutral-10 min-h-screen">{children}</body>
        </html>
    );
}
