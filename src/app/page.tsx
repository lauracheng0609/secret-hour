"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments } from "@/lib/storage";
import { Appointment } from "@/lib/types";

function CalendarView({ appointments }: { appointments: Appointment[] }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const apptDates = new Set(
    appointments
      .filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month && a.status !== "cancelled";
      })
      .map((a) => new Date(a.date).getDate())
  );

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
                {apptDates.has(day) && (
                  <span className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: "#5b9bd5" }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    setAppointments(getAppointments());
  }, []);

  const now = new Date();
  const upcoming = appointments
    .filter((a) => a.status !== "cancelled" && new Date(`${a.date}T${a.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
    .slice(0, 3);

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <h2 className="text-lg font-semibold text-stone-500 mb-0.5">你好 💆‍♀️</h2>
      <h1 className="text-4xl font-bold text-stone-700 mb-6">Secret Hour</h1>

      <CalendarView appointments={appointments} />

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
                    <div className="flex flex-col justify-center pl-5 pr-4 py-4 min-w-[90px]">
                      <span className="text-xs font-medium" style={{ color: dateColor }}>{d.getFullYear()}</span>
                      <span className="text-4xl font-bold leading-tight" style={{ color: dateColor }}>
                        {d.getMonth() + 1}/{d.getDate()}
                      </span>
                      <span className="text-xs font-medium mt-0.5" style={{ color: dateColor }}>{WEEKDAYS[d.getDay()]}</span>
                    </div>
                    <div className="w-px self-stretch my-4" style={{ background: isWithinWeek ? "#f0c0e8" : "#e5e7eb" }} />
                    <div className="flex-1 min-w-0 px-4 py-4">
                      <p className="font-semibold text-stone-600 text-base">{a.therapistName}</p>
                      <p className="text-xs text-stone-400 mt-1">時間：{a.time}</p>
                      <p className="text-xs text-stone-400">地點：{a.location || "尚未決定"}</p>
                    </div>
                    <div className="pr-4 flex flex-col items-center gap-2">
                      {isWithinWeek && (
                        <span className="heartbeat text-base" style={{ color: "#FF4894" }}>♥</span>
                      )}
                      <span className="text-stone-300 text-sm">▶</span>
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
