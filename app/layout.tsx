import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Düşünce Haritası", description: "Kavramlar, modeller ve aralarındaki canlı bağlar." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f3f0e8" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}
