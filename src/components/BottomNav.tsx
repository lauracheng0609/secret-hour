"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";

export default function BottomNav() {
  const pathname = usePathname();
  useTheme(); // apply saved theme on every page

  const isCalendar = pathname === "/schedule";
  const isHome = pathname === "/";
  const isTherapists = pathname.startsWith("/therapists");

  const active = "var(--accent)";
  const inactive = "var(--text-secondary)";

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-center pb-4 z-50 pointer-events-none" style={{ maxWidth: 480, margin: "0 auto", left: 0, right: 0 }}>
      <div className="pointer-events-auto rounded-full px-6 py-3 flex items-center gap-8 shadow-lg shadow-black/10" style={{ background: "var(--nav-bg)" }}>
        {/* 行程 */}
        <Link href="/schedule" className="flex flex-col items-center justify-center w-10 h-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke={isCalendar ? active : inactive} strokeWidth="1.8" fill="none"/>
            <path d="M3 9h18" stroke={isCalendar ? active : inactive} strokeWidth="1.8"/>
            <path d="M8 2v4M16 2v4" stroke={isCalendar ? active : inactive} strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="8" cy="14" r="1" fill={isCalendar ? active : inactive}/>
            <circle cx="12" cy="14" r="1" fill={isCalendar ? active : inactive}/>
            <circle cx="16" cy="14" r="1" fill={isCalendar ? active : inactive}/>
          </svg>
        </Link>

        {/* 首頁（中央大按鈕）*/}
        <Link
          href="/"
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-md -mt-5"
          style={{ background: "var(--accent)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="white"
            />
          </svg>
        </Link>

        {/* 師傅 */}
        <Link href="/therapists" className="flex flex-col items-center justify-center w-10 h-10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke={isTherapists ? active : inactive} strokeWidth="1.8" fill="none"/>
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke={isTherapists ? active : inactive} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </Link>

      </div>
    </nav>
  );
}
