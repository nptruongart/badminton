import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Badminton Club",
  description: "App quản lý hội cầu lông",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#111111",
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
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased min-h-full flex flex-col bg-[#111111]`}>
        
        {/* Lớp z-10 này sẽ kéo tất cả các nút bấm nổi lên trên cùng */}
        <div className="flex-1 relative z-10 pb-4">
          {children}
        </div>

        {/* Chữ ký được đặt z-0 và bỏ nền đen để không che mất nút */}
        <footer className="w-full text-center pt-8 pb-32 mt-auto relative z-0">
          <p className="text-gray-500 text-[11px] uppercase tracking-[0.2em] mb-1">
            Developed by
          </p>
          <p className="text-green-500 font-black text-sm uppercase tracking-widest drop-shadow-md">
            Nguyễn Phương Trường
          </p>
          <p className="text-gray-700 text-[10px] mt-2">
            © 2026 iDean. All rights reserved.
          </p>
        </footer>

      </body>
    </html>
  );
}