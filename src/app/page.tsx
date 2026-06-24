"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments, getTherapists } from "@/lib/storage";
import { Appointment, Therapist } from "@/lib/types";

function CalendarView({ appointments, therapists }: { appointments: Appointment[]; therapists: Therapist[] }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  // Map: date number → therapist color (first appointment wins if multiple same day)
  const DEFAULT_COLOR = "#5b9bd5";
  const apptDateColors = new Map<number, string>();
  appointments
    .filter((a) => {
      const d = new Date(a.date);
      return d.getFullYear() === year && d.getMonth() === month && a.status !== "cancelled";
    })
    .forEach((a) => {
      const day = new Date(a.date).getDate();
      if (!apptDateColors.has(day)) {
        const therapist = therapists.find((t) => t.id === a.therapistId);
        apptDateColors.set(day, therapist?.calendarColor ?? DEFAULT_COLOR);
      }
    });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const dayNames = ["日","一","二","三","四","五","六"];

  function prev() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-50">‹</button>
        <span className="font-bold text-stone-700">{year}年 {monthNames[month]}</span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-50">›</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs text-stone-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => (
          <div key={i} className="flex flex-col items-center py-1">
            {day !== null && (
              <>
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isToday(day)
                      ? "text-white font-bold"
                      : "text-stone-600"
                  }`}
                  style={isToday(day) ? { background: "#e8856a" } : {}}
                >
                  {day}
                </span>
                {apptDateColors.has(day) && (
                  <span className="text-[8px] leading-none mt-0.5" style={{ color: apptDateColors.get(day) }}>♥</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const KEYS = ["sh_therapists", "sh_appointments"];

function handleExport() {
  const data: Record<string, unknown> = {};
  for (const key of KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) data[key] = JSON.parse(raw);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `secret-hour-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);

  useEffect(() => {
    setAppointments(getAppointments());
    setTherapists(getTherapists());
  }, []);

  const now = new Date();
  const upcoming = appointments
    .filter((a) => a.status !== "cancelled" && new Date(`${a.date}T${a.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 3);

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <div className="flex items-start justify-between mb-0.5">
        <h2 className="text-lg font-semibold text-stone-500">你好 💆‍♀️</h2>
        <button
          onClick={handleExport}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center"
          title="備份資料"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 3v13M7 11l5 5 5-5M4 20h16" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <h1 className="text-4xl font-bold text-stone-700 mb-6">Secret Hour</h1>

      <CalendarView appointments={appointments} therapists={therapists} />

      {upcoming.length > 0 && (
        <section className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500">即將到來</h2>
            <Link href="/schedule" className="text-xs" style={{ color: "#e8856a" }}>查看全部</Link>
          </div>
          <div className="flex flex-col gap-2">
            {upcoming.map((a) => {
              const apptTime = new Date(`${a.date}T${a.time}`);
              const now = new Date();
              const isWithinWeek = apptTime.getTime() - now.getTime() <= 10 * 24 * 60 * 60 * 1000;
              const d = new Date(a.date);
              const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
              const dateColor = isWithinWeek ? "#FF4894" : "#5b9bd5";
              return (
                <Link key={a.id} href={`/appointments/${a.id}`}>
                  <div
                    className="rounded-2xl shadow-sm flex items-center overflow-hidden"
                    style={{ background: isWithinWeek ? "linear-gradient(to right, #FFE3F9, #FFFFFF)" : "#FFFFFF" }}
                  >
                    <div className="flex flex-col justify-center pl-5 pr-4 py-4 w-[96px] flex-shrink-0">
                      <span className="text-xs font-medium" style={{ color: dateColor }}>{d.getFullYear()}</span>
                      <span className="text-4xl font-bold leading-tight" style={{ color: dateColor }}>
                        {d.getMonth() + 1}/{d.getDate()}
                      </span>
                      <span className="text-xs font-medium mt-0.5" style={{ color: dateColor }}>{WEEKDAYS[d.getDay()]}</span>
                    </div>
                    <div className="w-px self-stretch my-4" style={{ background: isWithinWeek ? "#f0c0e8" : "#e5e7eb" }} />
                    <div className="flex-1 min-w-0 px-4 py-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        {(() => {
                          const t = therapists.find((t) => t.id === a.therapistId);
                          return t?.avatar ? (
                            <img src={t.avatar} alt={t.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="8" r="4" fill="#f9a8d4"/>
                                <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          );
                        })()}
                        <p className="font-semibold text-stone-600 text-base">{a.therapistName}</p>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">時間：{a.time}</p>
                      <p className="text-xs text-stone-400">地點：{a.location || "尚未決定"}</p>
                      <p className="text-xs mt-2 font-medium" style={{ color: isWithinWeek ? "#FF4894" : "#5b9bd5" }}>
                        {(() => {
                          const diffMs = apptTime.getTime() - now.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                          if (diffDays === 0) return diffHrs <= 0 ? "就是今天 ♥" : `今天再 ${diffHrs} 小時 ♥`;
                          if (diffDays === 1) return "明天就要見面了 ♥";
                          return `還有 ${diffDays} 天見到他 ♥`;
                        })()}
                      </p>
                    </div>
                    <div className="pr-4 flex flex-col items-center gap-2">
                      {isWithinWeek && (
                        <span className="heartbeat text-base" style={{ color: "#FF4894" }}>♥</span>
                      )}
                      <span className="text-xs font-medium text-white px-3 py-1 rounded-full" style={{ background: "#e8856a" }}>查看</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <Link
        href="/appointments/new"
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg z-40"
        style={{ background: "#e8856a" }}
      >
        +
      </Link>
    </main>
  );
}
