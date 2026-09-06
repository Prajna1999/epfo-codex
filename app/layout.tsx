import type { Metadata } from "next";
import "./globals.css";
import "./transitions.css";
import "./identity.css";
import "./finance-workspace.css";
import { LanguageProvider } from "./language";

export const metadata: Metadata = {
  title: "EPFO Member Portal",
  description: "One secure EPFO identity for your provident fund, employer responsibilities, and authorized roles.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title: "EPFO Member Portal", description: "One identity. Every EPFO role.", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "EPFO Member Portal — One identity. Every EPFO role." }] },
  twitter: { card: "summary_large_image", title: "EPFO Member Portal", description: "One identity. Every EPFO role.", images: ["/og.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>;
}
