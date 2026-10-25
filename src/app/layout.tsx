import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./global.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memora — seu rolê. suas memórias.",
  description: "Crie um mural com as fotos do seu dispositivo e compartilhe só com quem você escolher.",
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
    <html lang="pt-BR" className={dmSans.variable + " " + spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
