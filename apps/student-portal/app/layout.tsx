import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Student Portal - Nande Nihon",
    description: "Learning portal for Nande Nihon students",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
