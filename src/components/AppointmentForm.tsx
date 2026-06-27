"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTherapists, saveAppointment, generateId } from "@/lib/storage";
import { Therapist, Appointment, AppointmentFeeItem, FeeItem } from "@/lib/types";

interface Props {
  initial?: Appointment;
  onDirtyChange?: (dirty: boolean) => void;
}

// tracks selected state per fee item; for timeunit stores unit count
type SelectionMap = Record<string, number>; // feeItemId -> units (1+ for timeunit, 1 for selected, 0 for unselected)

function initSelection(therapist: Therapist, existing?: Appointment): SelectionMap {
  const map: SelectionMap = {};
  for (const fi of therapist.feeItems) {
    if (existing) {
      const found = existing.selectedFeeItems.find((s) => s.feeItemId === fi.id);
      map[fi.id] = found ? (found.units ?? 1) : 0;
    } else {
      map[fi.id] = fi.type === "base" ? 1 : 0;
    }
  }
  return map;
}

function formatHr(units: number, unitMin: number) {
  const hrs = (units * unitMin) / 60;
  return hrs % 1 === 0 ? `${hrs}hr` : `${hrs}hr`;
}

function TimeUnitPicker({
  item,
  units,
  onChange,
}: {
  item: FeeItem;
  units: number;
  onChange: (u: number) => void;
}) {
  const unitMin = item.unitMinutes ?? 30;
  const maxUnits = Math.floor((10 * 60) / unitMin); // up to 10hr
  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-pink-100 bg-pink-50/40">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-stone-700">＋{item.label}</span>
          <span className="text-xs text-stone-400 ml-2">NT${item.amount.toLocaleString()} / {unitMin}min</span>
        </div>
        {units > 0 && (
          <span className="text-sm font-medium text-pink-600">
            NT${(item.amount * units).toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onChange(0)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            units === 0 ? "bg-stone-200 text-stone-500 border-stone-200" : "text-stone-400 border-stone-200"
          }`}
        >
          不加
        </button>
        {Array.from({ length: maxUnits }, (_, i) => i + 1).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              units === u ? "bg-pink-500 text-white border-pink-500" : "text-stone-500 border-stone-200"
            }`}
          >
            +{formatHr(u, unitMin)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AppointmentForm({ initial, onDirtyChange }: Props) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);

  function markDirty() {
    if (!isDirty) {
      setIsDirty(true);
      onDirtyChange?.(true);
    }
  }

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapistId, setTherapistId] = useState(initial?.therapistId ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [selection, setSelection] = useState<SelectionMap>({});
  const [depositPaid, setDepositPaid] = useState(initial?.depositPaid ?? 0);
  const [note, setNote] = useState(initial?.note ?? "");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const locationDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const all = getTherapists();
    setTherapists(all);
    if (!initial && all.length > 0 && !therapistId) {
      const first = all[0];
      setTherapistId(first.id);
      setSelection(initSelection(first));
      setDepositPaid(first.depositAmount);
    } else if (initial) {
      const t = all.find((t) => t.id === initial.therapistId);
      if (t) setSelection(initSelection(t, initial));
    }
  }, []);

  const therapist = therapists.find((t) => t.id === therapistId);

  useEffect(() => {
    if (!therapist || initial) return;
    setSelection(initSelection(therapist));
    setDepositPaid(therapist.depositAmount);
  }, [therapistId]);

  function setUnits(feeItemId: string, units: number) {
    markDirty();
    setSelection((prev) => ({ ...prev, [feeItemId]: units }));
  }

  function toggleAddon(feeItemId: string) {
    markDirty();
    setSelection((prev) => ({ ...prev, [feeItemId]: prev[feeItemId] ? 0 : 1 }));
  }

  const selectedItems: AppointmentFeeItem[] =
    therapist?.feeItems
      .filter((fi) => (selection[fi.id] ?? 0) > 0)
      .map((fi) => {
        const units = selection[fi.id] ?? 1;
        return {
          feeItemId: fi.id,
          label: fi.type === "timeunit"
            ? `${fi.label}（+${units * (fi.unitMinutes ?? 30)}min）`
            : fi.label,
          amount: fi.amount * units,
          units: fi.type === "timeunit" ? units : undefined,
          unitMinutes: fi.type === "timeunit" ? fi.unitMinutes : undefined,
        };
      }) ?? [];

  const totalAmount = selectedItems.reduce((sum, fi) => sum + fi.amount, 0);
  const balanceDue = Math.max(0, totalAmount - depositPaid);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!therapist || !date || !time || !location) return;
    setIsDirty(false);
    onDirtyChange?.(false);
    const appt: Appointment = {
      id: initial?.id ?? generateId(),
      therapistId: therapist.id,
      therapistName: therapist.name,
      date,
      time,
      location,
      selectedFeeItems: selectedItems,
      depositPaid,
      totalAmount,
      balanceDue,
      note: note.trim() || undefined,
      status: initial?.status ?? "upcoming",
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveAppointment(appt);
    router.push("/");
  }

  if (therapists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <span className="text-4xl">💆‍♀️</span>
        <p className="text-stone-500 text-sm">請先新增師傅資料</p>
        <a href="/therapists/new" className="bg-pink-500 text-white text-sm px-5 py-2 rounded-full shadow-md shadow-pink-200">
          前往新增師傅
        </a>
      </div>
    );
  }

  const baseItems = therapist?.feeItems.filter((fi) => fi.type === "base") ?? [];
  const timeItems = therapist?.feeItems.filter((fi) => fi.type === "timeunit") ?? [];
  const addonItems = therapist?.feeItems.filter((fi) => fi.type === "addon") ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">選擇師傅</h2>
        <div className="flex flex-wrap gap-2">
          {therapists.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { markDirty(); setTherapistId(t.id); }}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                therapistId === t.id
                  ? "bg-pink-500 text-white border-pink-500"
                  : "text-stone-500 border-stone-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">預約資訊</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-stone-400 mb-1 block">日期 *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => { markDirty(); setDate(e.target.value); }}
              required
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">時間 *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => { markDirty(); setTime(e.target.value); }}
              required
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
            />
          </div>
        </div>
        <div className="relative">
          <label className="text-xs text-stone-400 mb-1 block">地點 *</label>
          <input
            value={location}
            onChange={(e) => {
              markDirty();
              setLocation(e.target.value);
              const val = e.target.value;
              if (locationDebounce.current) clearTimeout(locationDebounce.current);
              if (val.trim().length < 2) { setLocationSuggestions([]); return; }
              locationDebounce.current = setTimeout(async () => {
                const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
                const data = await res.json();
                setLocationSuggestions(data);
              }, 400);
            }}
            onBlur={() => setTimeout(() => setLocationSuggestions([]), 150)}
            placeholder="例：捷運忠孝敦化站附近、飯店名稱"
            required
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300"
          />
          {locationSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 bg-white border border-stone-100 rounded-xl shadow-lg mt-1 overflow-hidden">
              {locationSuggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => { setLocation(s); setLocationSuggestions([]); markDirty(); }}
                  className="px-3 py-2.5 text-sm text-stone-600 hover:bg-purple-50 cursor-pointer border-b border-stone-50 last:border-0 truncate"
                >
                  📍 {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {therapist && (
        <section className="rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-stone-500">服務項目</h2>

          {baseItems.map((fi) => (
            <div key={fi.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center text-[10px] text-white">✓</span>
                <span className="text-sm text-stone-700">{fi.label}</span>
                <span className="text-[10px] text-pink-400 bg-pink-50 border border-pink-100 px-1.5 rounded-full">基礎</span>
              </div>
              <span className="text-sm font-medium text-stone-700">NT${fi.amount.toLocaleString()}</span>
            </div>
          ))}

          {timeItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-stone-400">加時服務</p>
              {timeItems.map((fi) => (
                <TimeUnitPicker
                  key={fi.id}
                  item={fi}
                  units={selection[fi.id] ?? 0}
                  onChange={(u) => setUnits(fi.id, u)}
                />
              ))}
            </div>
          )}

          {addonItems.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-stone-400">加購項目</p>
              {addonItems.map((fi) => {
                const isSelected = (selection[fi.id] ?? 0) > 0;
                return (
                  <button
                    key={fi.id}
                    type="button"
                    onClick={() => toggleAddon(fi.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm transition-colors ${
                      isSelected ? "bg-pink-50 border-pink-200" : "border-stone-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected ? "bg-pink-500 border-pink-500 text-white" : "border-stone-300"
                      }`}>
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className={isSelected ? "text-stone-800" : "text-stone-400"}>＋{fi.label}</span>
                    </div>
                    <span className={isSelected ? "font-medium text-pink-600" : "text-stone-400"}>
                      NT${fi.amount.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl p-4 shadow-sm border border-pink-50 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">金額計算</h2>
        {selectedItems.map((fi) => (
          <div key={fi.feeItemId} className="flex justify-between text-sm text-stone-600">
            <span>{fi.label}</span>
            <span>NT${fi.amount.toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-pink-100 pt-2 flex flex-col gap-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-stone-800">總金額</span>
            <span className="text-pink-600">NT${totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-400">已付訂金</span>
            <div className="flex items-center border border-stone-200 rounded-xl px-3 py-1.5 gap-1 w-36">
              <span className="text-xs text-stone-400">NT$</span>
              <input
                type="number"
                value={depositPaid || ""}
                onChange={(e) => { markDirty(); setDepositPaid(Number(e.target.value)); }}
                placeholder="0"
                className="w-full text-sm focus:outline-none text-right"
              />
            </div>
          </div>
          <div className="flex justify-between text-sm font-semibold bg-amber-50 rounded-xl p-2">
            <span className="text-amber-700">尾款</span>
            <span className="text-amber-600">NT${balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl p-4 shadow-sm border border-pink-50">
        <label className="text-xs text-stone-400 mb-1 block">備註</label>
        <textarea
          value={note}
          onChange={(e) => { markDirty(); setNote(e.target.value); }}
          placeholder="其他注意事項、偏好等"
          rows={3}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-300 resize-none"
        />
      </section>

      <button
        type="submit"
        className="bg-pink-500 text-white rounded-2xl py-3 font-semibold text-sm shadow-md shadow-pink-200"
      >
        儲存預約
      </button>
    </form>
  );
}
