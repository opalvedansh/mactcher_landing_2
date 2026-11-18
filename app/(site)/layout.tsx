import type { Metadata } from "next";
import { Montserrat, Mulish } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "Matchr | Where Brands and Creators Create Impact",
  description:
    "Matchr connects brands and creators for authentic collaboration through a swipe-first discovery experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${mulish.variable}`}>{children}</body>
    </html>
  );
}
