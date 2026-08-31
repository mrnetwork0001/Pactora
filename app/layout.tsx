import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Pactora - Autonomous Multi-Role Escrow & SLA Marketplace",
  description:
    "Multi-role escrow marketplace verified by a closed-loop self-healing Kane CLI engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body
        data-app="pactora"
        className="min-h-screen bg-void-950 font-display text-white antialiased"
      >
        {children}
      </body>
    </html>
  );
}
