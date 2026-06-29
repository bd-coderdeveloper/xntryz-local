import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import SecurityLayer from "@/components/SecurityLayer";

const kanit = Kanit({ subsets: ["latin", "thai"], weight: "400" });

export const metadata: Metadata = {
  title: "UPFEEDTH",
  description: "Next-Gen Facebook Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${kanit.className} min-h-screen flex flex-col`}>
        <SecurityLayer />
        {children}
      </body>
    </html>
  );
}