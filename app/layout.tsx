import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zero.AI - AI-Powered Trading Platform",
  description: "Advanced trading platform with AI predictions, market analysis powered by Claude Sonnet 4.5 and Delta Exchange API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.className} antialiased h-full overflow-hidden m-0 p-0`}
      >
        {children}
      </body>
    </html>
  );
}
