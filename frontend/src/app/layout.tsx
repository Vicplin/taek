import type { Metadata } from "next";
import { Rajdhani, Orbitron } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
});

const orbitron = Orbitron({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-orbitron",
});

export const metadata: Metadata = {
  title: "Taek | The Ultimate Taekwondo Tournament Platform",
  description: "Manage tournaments, registrations, and scores with Taek.",
  openGraph: {
    title: "Taek",
    description: "The Ultimate Taekwondo Tournament Platform",
    url: "https://www.taek.com",
    siteName: "Taek",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rajdhani.variable} ${orbitron.variable} antialiased font-rajdhani bg-[#0D0D0D] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
