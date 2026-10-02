import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logistics | Your workspace",
  description: "Sign in to your logistics operations workspace.",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
