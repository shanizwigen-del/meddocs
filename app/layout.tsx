import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "המסמכים של קרן",
  description: "מערכת ניהול מסמכים רפואיים",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "מסמכים",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="מסמכים" />
        <link rel="apple-touch-icon" href="/icon" sizes="180x180" />
        <link rel="apple-touch-icon" href="/icon" sizes="152x152" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
