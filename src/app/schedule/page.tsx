"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments, getTherapists } from "@/lib/storage";
import { Appointment, Therapist } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AppointmentCard({ appt, therapists }: { appt: Appointment; therapists: Therapist[] }) {
  const apptTime = new Date(`${appt.date}T${appt.time}`);
  const now = new Date();
  const isPast = apptTime < now;
  const isWithinWeek = !isPast && apptTime.getTime() - now.getTime() <= 10 * 24 * 60 * 60 * 1000;

  const d = new Date(appt.date);
  const dateColor = isWithinWeek ? "var(--accent-hot)" : "var(--accent-cool)";

  return (
    <Link href={`/appointments/${appt.id}`}>
      <div
        className={`rounded-2xl shadow-sm flex items-center overflow-hidden ${isPast ? "opacity-50" : ""}`}
        style={{
          background: isWithinWeek ? "var(--card-warm-bg)" : "var(--card-bg)",
        }}
      >
        {/* Date block */}
        <div className="flex flex-col justify-center pl-5 pr-4 py-5 w-[96px] flex-shrink-0">
          <span className="text-xs font-medium" style={{ color: dateColor }}>{d.getFullYear()}</span>
          <span className="text-4xl font-bold leading-tight" style={{ color: dateColor }}>
            {d.getMonth() + 1}/{d.getDate()}
          </span>
          <span className="text-xs font-medium mt-0.5" style={{ color: dateColor }}>
            {WEEKDAYS[d.getDay()]}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px self-stretch my-4" style={{ background: isWithinWeek ? "var(--card-warm-divider)" : "var(--border-subtle)" }} />

        {/* Info */}
        <div className="flex-1 min-w-0 px-4 py-5">
          <div className="flex items-center gap-2 mb-0.5">
            {(() => {
              const t = therapists.find((t) => t.id === appt.therapistId);
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
            <span className="font-semibold text-stone-600 text-base">{appt.therapistName}</span>
            {appt.status === "completed" && (
              <span className="text-[10px] bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">已完成</span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-1">時間：{appt.time}</p>
          <p className="text-xs text-stone-400">地點：{appt.location || "尚未決定"}</p>
        </div>

        <div className="pr-4 flex flex-col items-center gap-2">
          {isWithinWeek && (
            <span className="heartbeat text-base" style={{ color: "var(--accent-hot)" }}>♥</span>
          )}
          <span className="text-xs font-medium text-white px-3 py-1 rounded-full" style={{ background: isWithinWeek ? "var(--accent-hot)" : "var(--accent)" }}>查看</span>
        </div>
      </div>
    </Link>
  );
}

function PastModal({ past, therapists, onClose }: { past: Appointment[]; therapists: Therapist[]; onClose: () => void }) {
  // build unique therapist list from past records
  const therapistOptions = Array.from(
    new Map(past.map((a) => [a.therapistId, a.therapistName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const [selectedId, setSelectedId] = useState(therapistOptions[0]?.id ?? "");

  const filtered = past.filter((a) => a.therapistId === selectedId);
  const hasMultiple = therapistOptions.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ maxWidth: 480, margin: "0 auto", left: 0, right: 0 }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative rounded-t-3xl w-full max-h-[85dvh] flex flex-col shadow-2xl" style={{ background: "var(--section-bg)" }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold text-stone-700">全部歷史紀錄</h2>
          <button onClick={onClose} className="text-stone-400 text-xl w-8 h-8 flex items-center justify-center">×</button>
        </div>

        {/* Stats row */}
        <div className="px-5 pb-3 flex items-center justify-between gap-3 flex-shrink-0">
          <p className="text-sm flex-1" style={{ color: "var(--accent)" }}>
            已經跟 <span className="font-semibold">{therapistOptions.find((t) => t.id === selectedId)?.name}</span> 見面{" "}
            <span className="font-semibold">{filtered.length}</span> 次囉❤️
          </p>
          <div className="relative flex-shrink-0">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={!hasMultiple}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-sm font-medium border focus:outline-none"
              style={{
                borderColor: hasMultiple ? "var(--accent)" : "#d1d5db",
                color: hasMultiple ? "var(--accent)" : "#9e9e9e",
                background: "white",
              }}
            >
              {therapistOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
              style={{ color: hasMultiple ? "var(--accent)" : "#9e9e9e" }}>▼</span>
          </div>
        </div>

        <div className="h-px bg-stone-100 flex-shrink-0" />

        <div className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2">
          {filtered.map((a, i) => <div key={a.id} className="card-enter" style={{ animationDelay: `${i * 60}ms` }}><AppointmentCard appt={a} therapists={therapists} /></div>)}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [showPastModal, setShowPastModal] = useState(false);

  useEffect(() => {
    const all = getAppointments().sort(
      (a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()
    );
    setAppointments(all);
    setTherapists(getTherapists());
  }, []);

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status !== "cancelled" && new Date(`${a.date}T${a.time}`) >= now);
  const past = appointments.filter((a) => a.status !== "cancelled" && new Date(`${a.date}T${a.time}`) < now).reverse();

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <h2 className="text-lg font-semibold text-stone-500 mb-0.5">我的行程</h2>
      <h1 className="text-4xl font-bold mb-6" style={{ background: "linear-gradient(to right, var(--title-from), var(--title-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Schedule</h1>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <span className="text-5xl">🗓</span>
          <p className="text-stone-400 text-sm">還沒有預約紀錄</p>
          <Link href="/appointments/new" className="text-sm text-white px-5 py-2 rounded-full" style={{ background: "var(--accent)" }}>
            新增預約
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">即將到來</h2>
              <div className="flex flex-col gap-2">
                {upcoming.map((a, i) => <div key={a.id} className="card-enter" style={{ animationDelay: `${i * 60}ms` }}><AppointmentCard appt={a} therapists={therapists} /></div>)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">歷史紀錄</h2>
              <div className="flex flex-col gap-2">
                {past.slice(0, 3).map((a, i) => <div key={a.id} className="card-enter" style={{ animationDelay: `${i * 60}ms` }}><AppointmentCard appt={a} therapists={therapists} /></div>)}
              </div>
              <button
                onClick={() => setShowPastModal(true)}
                className="mt-3 w-full py-2.5 rounded-2xl text-sm font-medium border"
                style={{ color: "var(--accent)", borderColor: "#c4b5fd" }}
              >
                看全部紀錄（共 {past.length} 筆）
              </button>
            </section>
          )}
        </div>
      )}

      <Link
        href="/appointments/new"
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full text-white text-2xl flex items-center justify-center shadow-lg z-40"
        style={{ background: "var(--accent)" }}
      >
        +
      </Link>

      {showPastModal && (
        <PastModal past={past} therapists={therapists} onClose={() => setShowPastModal(false)} />
      )}
    </main>
  );
}
