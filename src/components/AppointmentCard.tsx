"use client";

import Link from "next/link";
import { Appointment, Therapist } from "@/lib/types";

const WEEKDAYS_ZH = ["日", "一", "二", "三", "四", "五", "六"];

function GradientAvatar({ src, name, size = 28 }: { src?: string; name: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src} alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #9F86F2, #E88BC4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "2px solid rgba(255,255,255,0.9)",
      boxShadow: "0 4px 10px rgba(159,134,242,0.3)",
    }}>
      <span style={{
        fontFamily: "var(--font-cormorant, serif)", fontStyle: "italic",
        fontWeight: 600, color: "white", fontSize: Math.round(size * 0.46),
        lineHeight: 1,
      }}>
        {name.charAt(0)}
      </span>
    </div>
  );
}

export default function AppointmentCard({
  appt,
  therapists,
  showCountdown = false,
}: {
  appt: Appointment;
  therapists: Therapist[];
  showCountdown?: boolean;
}) {
  const now = new Date();
  const apptTime = new Date(`${appt.date}T${appt.time}`);
  const isPast = apptTime < now;
  const diffMs = apptTime.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isHot = !isPast && diffMs <= 10 * 24 * 60 * 60 * 1000;
  const therapist = therapists.find((t) => t.id === appt.therapistId);
  const d = new Date(appt.date);

  let chipText = "";
  if (showCountdown && !isPast) {
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffDays === 0) chipText = diffHrs <= 0 ? "就是今天 ♥" : `今天再 ${diffHrs} 小時 ♥`;
    else if (diffDays === 1) chipText = "明天見 ♥";
    else chipText = `還有 ${diffDays} 天 ♥`;
  }

  const cardBg = isHot ? "var(--card-warm-bg)" : "var(--card-bg)";
  const cardShadow = isHot ? "var(--glass-shadow-pink)" : "var(--glass-shadow)";
  const dateGrad = isHot ? "var(--grad-pink-date)" : isPast ? "none" : "var(--grad-blue-date)";

  return (
    <Link href={`/appointments/${appt.id}`}>
      <div className="card-enter" style={{
        background: isPast ? "var(--card-bg)" : cardBg,
        border: "1px solid var(--glass-border)",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        boxShadow: cardShadow,
        borderRadius: 26,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        opacity: isPast ? 0.75 : 1,
      }}>
        {/* Date */}
        <div style={{ padding: "18px 14px 18px 20px", minWidth: 76, flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 1, letterSpacing: "0.04em" }}>
            {d.getFullYear()} · {WEEKDAYS_ZH[d.getDay()]}
          </div>
          <div style={{
            fontFamily: "var(--font-cormorant, serif)", fontStyle: "italic",
            fontWeight: 600, fontSize: 36, lineHeight: 1.05,
            ...(dateGrad !== "none"
              ? { background: dateGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }
              : { color: "var(--text-muted)" }),
          }}>
            {d.getMonth() + 1}/{d.getDate()}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: 1, alignSelf: "stretch", margin: "16px 0",
          background: isHot
            ? "linear-gradient(to bottom, transparent, rgba(239,109,168,0.3), transparent)"
            : "linear-gradient(to bottom, transparent, rgba(139,114,232,0.2), transparent)",
        }} />

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, padding: "14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <GradientAvatar src={therapist?.avatar} name={appt.therapistName} size={28} />
            <span style={{ fontWeight: 700, fontSize: 15.5, color: "var(--ink)", flex: "none" }}>
              {appt.therapistName}
            </span>
            {isHot && showCountdown && chipText && (
              <span style={{
                fontSize: 11, fontWeight: 500, padding: "2px 9px", borderRadius: 999,
                background: "rgba(239,109,168,0.12)", color: "var(--accent-hot)", flex: "none",
              }}>{chipText}</span>
            )}
            {isPast && (
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>已完成 ✓</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {appt.time}{appt.location ? ` · ${appt.location}` : " · 地點未定"}
          </div>
        </div>

        {/* Action */}
        {!isPast && (
          <div style={{ padding: "0 16px 0 6px", flexShrink: 0 }}>
            {isHot ? (
              <span style={{
                display: "inline-block", padding: "7px 16px", borderRadius: 999,
                fontSize: 13, fontWeight: 700, color: "white",
                background: "linear-gradient(135deg, #F179AE, #C77BD4)",
                boxShadow: "0 6px 16px rgba(239,109,168,0.35)",
                whiteSpace: "nowrap",
              }}>查看</span>
            ) : (
              <span style={{
                display: "inline-block", padding: "7px 16px", borderRadius: 999,
                fontSize: 13, fontWeight: 600, color: "var(--accent)",
                background: "rgba(139,114,232,0.12)",
                whiteSpace: "nowrap",
              }}>查看</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
