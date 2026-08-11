import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dropify – Dashboard",
    template: "%s – Dropify",
  },
  description:
    "Manage Twitch-powered Shopify discounts, campaigns, usage and analytics.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={inter.variable}
    >
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
