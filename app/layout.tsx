import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Yuzaki Creator Family | OFC",
    description: "nyusul.",
    icons: { icon: "/favicon.svg" }
};

export default function RootLayout({
    children
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="id">
            <body>{children}</body>
        </html>
    );
}
