import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Cấu hình Metadata chung cho PWA
export const metadata: Metadata = {
  title: "Badminton Club",
  description: "App quản lý hội cầu lông",
  manifest: "/manifest.json",
};

// Cấu hình Viewport (Theme color cho PWA)
export const viewport: Viewport = {
  themeColor: "#1890ff",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}