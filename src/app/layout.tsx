import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500", "600"],
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Secret Hour",
  description: "私密預約管理",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secret Hour",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F5FC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${cormorant.variable} ${notoSansTC.variable} h-full`}>
      <body className="min-h-dvh flex flex-col antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
