import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import PizzaBackground from "@/components/PizzaBackground";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cheeznad",
  description:
    "Bet on which Monad ecosystem zone burns hottest. Pizza-themed prediction market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${inter.variable} antialiased`}
        style={{ background: "#f4f3ee" }}
      >
        <PizzaBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
