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
      <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased min-h-full flex flex-col bg-[#111111]`}>
        
        {/* Phần nội dung chính của App sẽ co giãn đẩy Footer xuống đáy */}
        <div className="flex-1">
          {children}
        </div>

        {/* ĐÓNG DẤU BẢN QUYỀN TÁC GIẢ Ở ĐÁY MÀN HÌNH */}
        <footer className="w-full text-center py-4 mt-auto border-t border-gray-800 bg-[#111111]">
          <p className="text-gray-400 text-sm">
            Developed by <span className="text-green-500 font-bold uppercase tracking-wider">Nguyễn Phương Trường</span>
          </p>
          <p className="text-gray-600 text-xs mt-1">
            © 2026 iDean. All rights reserved.
          </p>
        </footer>

      </body>
    </html>
  );
}