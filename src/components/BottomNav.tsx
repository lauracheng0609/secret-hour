"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";

export default function BottomNav() {
  const pathname = usePathname();
  useTheme(); // apply saved theme on every page

  const isHome      = pathname === "/";
  const isSchedule  = pathname === "/schedule";
  const isTherapists = pathname.startsWith("/therapists");

  const inactiveColor = "var(--text-faint, #B4AECC)";
  const activeColor   = "var(--accent, #8B72E8)";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center pb-5 z-50 pointer-events-none"
      style={{ maxWidth: 480, margin: "0 auto" }}
    >
      <div
        className="pointer-events-auto flex items-center gap-8 px-7 py-3.5 rounded-full"
        style={{
          background: "var(--nav-bg, rgba(255,255,255,0.72))",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.85)",
          boxShadow: "0 8px 28px rgba(124,98,214,0.14)",
        }}
      >
        {/* Calendar */}
        <Link href="/schedule" className="flex items-center justify-center w-10 h-10">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="3"
              stroke={isSchedule ? activeColor : inactiveColor} strokeWidth={isSchedule ? 2 : 1.7} />
            <path d="M3 9h18" stroke={isSchedule ? activeColor : inactiveColor} strokeWidth={isSchedule ? 2 : 1.7} />
            <path d="M8 2v4M16 2v4" stroke={isSchedule ? activeColor : inactiveColor} strokeWidth={isSchedule ? 2 : 1.7} strokeLinecap="round" />
            <circle cx="8"  cy="14" r="1" fill={isSchedule ? activeColor : inactiveColor} />
            <circle cx="12" cy="14" r="1" fill={isSchedule ? activeColor : inactiveColor} />
            <circle cx="16" cy="14" r="1" fill={isSchedule ? activeColor : inactiveColor} />
          </svg>
        </Link>

        {/* Home — center raised heart */}
        <Link
          href="/"
          className="flex items-center justify-center -mt-5"
          style={{
            width: 56, height: 56, borderRadius: "50%",
            background: isHome ? "var(--grad-primary)" : "var(--nav-bg, rgba(255,255,255,0.72))",
            border: isHome ? "3px solid rgba(255,255,255,0.9)" : "1.5px solid rgba(139,114,232,0.25)",
            boxShadow: isHome ? "0 10px 26px rgba(124,98,214,0.35)" : "0 4px 14px rgba(124,98,214,0.12)",
          }}
        >
          {isHome ? (
            /* filled heart */
            <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          ) : (
            /* outline heart */
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke={inactiveColor} strokeWidth="1.7" />
            </svg>
          )}
        </Link>

        {/* Person */}
        <Link href="/therapists" className="flex items-center justify-center w-10 h-10">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4"
              stroke={isTherapists ? activeColor : inactiveColor}
              strokeWidth={isTherapists ? 2 : 1.7} />
            <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
              stroke={isTherapists ? activeColor : inactiveColor}
              strokeWidth={isTherapists ? 2 : 1.7} strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
