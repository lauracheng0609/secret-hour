import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Secret Hour",
  description: "私密預約管理",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secret Hour",
  },
  icons: {
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#E5F6FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${geist.variable} h-full`}>
      <body className="min-h-dvh flex flex-col antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
