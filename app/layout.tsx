import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marga Yece Family | TikTok Anime",
  description: "Portal komunitas Marga Yece Family untuk generasi, anggota, statistik tagar TikTok, dan admin.",
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
