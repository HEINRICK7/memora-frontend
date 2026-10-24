import type { Metadata } from "next";
import { DM_Sans, Engagement } from "next/font/google";
import type { ReactNode } from "react";
import "./global.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const engagement = Engagement({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-engagement",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memora — Suas histórias merecem ser guardadas",
  description: "Toda foto conta uma história.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={dmSans.variable + " " + engagement.variable}>
        {children}
      </body>
    </html>
  );
}
