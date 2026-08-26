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
        <footer className="w-full text-center py-3 bg-[#050505]">
          <p className="text-gray-600 text-[10px] tracking-widest font-mono uppercase">
            DEVELOPED BY <span className="text-[#00f3ff]">NGUYỄN PHƯƠNG TRƯỜNG</span> © 2026
          </p>
        </footer>

      </body>
    </html>
  );
}