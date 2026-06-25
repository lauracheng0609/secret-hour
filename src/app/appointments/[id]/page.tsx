"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getAppointments, deleteAppointment } from "@/lib/storage";
import { Appointment } from "@/lib/types";
import AppointmentForm from "@/components/AppointmentForm";

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [editing, setEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const found = getAppointments().find((a) => a.id === id) ?? null;
    setAppointment(found);
  }, [id]);

  function handleDelete() {
    if (!confirm("確定要刪除這筆預約嗎？")) return;
    deleteAppointment(id);
    router.push("/");
  }

  function handleShareLine() {
    if (!appointment) return;
    const d = new Date(appointment.date);
    const dateStr = d.toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    const text = `時間：${dateStr} | ${appointment.time}\n地點：${appointment.location || "待補"}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
  }

  if (!appointment) return <p className="p-6 text-stone-400 text-sm">找不到預約資料</p>;

  if (editing) {
    return (
      <main className="flex-1 px-4 pt-6 pb-36">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { if (isDirty && !confirm("尚未儲存變更，是否確定要退出？")) return; setEditing(false); setIsDirty(false); }} className="text-stone-400 text-lg">‹</button>
          <h1 className="text-xl font-bold text-stone-800">編輯預約</h1>
        </div>
        <AppointmentForm initial={appointment} onDirtyChange={setIsDirty} />
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-stone-400 text-lg">‹</Link>
          <h1 className="text-xl font-bold text-stone-800">預約詳細</h1>
        </div>
        <button onClick={() => setEditing(true)} className="text-xs text-pink-500 border border-pink-200 rounded-full px-3 py-1">
          編輯
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-800 text-lg">{appointment.therapistName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              appointment.status === "completed" ? "bg-stone-100 text-stone-400" :
              appointment.status === "cancelled" ? "bg-red-50 text-red-400" :
              "bg-pink-50 text-pink-500"
            }`}>
              {appointment.status === "completed" ? "已完成" : appointment.status === "cancelled" ? "已取消" : "即將到來"}
            </span>
          </div>
          <p className="text-stone-500 text-sm">
            {new Date(appointment.date).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
          <p className="text-stone-500 text-sm">{appointment.time}</p>
          {appointment.location ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm flex items-center gap-1 underline underline-offset-2"
              style={{ color: "#8D6AFF" }}
            >
              📍 {appointment.location}
            </a>
          ) : (
            <p className="text-stone-400 text-sm">📍 尚未設定地點</p>
          )}
          {appointment.note && <p className="text-stone-400 text-xs mt-1">{appointment.note}</p>}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-stone-500 mb-1">費用明細</h2>
          {appointment.selectedFeeItems.map((fi) => (
            <div key={fi.feeItemId} className="flex justify-between text-sm">
              <span className="text-stone-600">{fi.label}</span>
              <span className="text-stone-700">NT${fi.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-pink-100 mt-1 pt-2 flex flex-col gap-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-stone-800">總金額</span>
              <span className="text-pink-600">NT${appointment.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-400">已付訂金</span>
              <span className="text-stone-500">−NT${appointment.depositPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold bg-amber-50 rounded-xl p-2">
              <span className="text-amber-700">尾款</span>
              <span className="text-amber-600">NT${appointment.balanceDue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleShareLine}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 font-medium text-sm text-white"
          style={{ background: "#06C755" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.18 6.79L4 22l4.43-1.47C9.55 20.83 10.75 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2zm1 13H9v-1.5h4V15zm2-3H9v-1.5h6V12zm0-3H9V7.5h6V9z"/>
          </svg>
          分享到 LINE
        </button>

        <button
          onClick={() => router.push(`/appointments/new?copyFrom=${id}`)}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 font-medium text-sm text-white"
          style={{ background: "#8D6AFF" }}
        >
          ♥ 再約一次
        </button>

        <button
          onClick={handleDelete}
          className="text-red-400 text-sm text-center py-2"
        >
          刪除這筆預約
        </button>
      </div>
    </main>
  );
}
