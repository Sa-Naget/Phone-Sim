import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AU Phone Simulator",
  description: "An interactive social-media AU phone experience",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sf bg-[#050505]">{children}</body>
    </html>
  );
}
