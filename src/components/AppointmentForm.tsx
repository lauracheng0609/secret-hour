"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTherapists, saveAppointment, generateId } from "@/lib/storage";
import { Therapist, Appointment, AppointmentFeeItem, FeeItem } from "@/lib/types";

interface Props {
  initial?: Appointment;
  onDirtyChange?: (dirty: boolean) => void;
}

type SelectionMap = Record<string, number>;

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

/* ── Shared input style ── */
const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  padding: "10px 12px",
  fontSize: 14,
  background: "var(--input-bg)",
  color: "var(--input-text)",
  border: "1px solid var(--glass-border)",
  outline: "none",
  boxSizing: "border-box",
};

const sectionStyle: React.CSSProperties = {
  background: "var(--glass-bg)",
  border: "1px solid var(--glass-border)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 20,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  display: "block",
  marginBottom: 4,
};

/* ── TimeUnitPicker ── */
function TimeUnitPicker({ item, units, onChange }: {
  item: FeeItem; units: number; onChange: (u: number) => void;
}) {
  const unitMin = item.unitMinutes ?? 30;
  const maxUnits = Math.floor((10 * 60) / unitMin);

  return (
    <div style={{ borderRadius: 16, padding: 12, background: "var(--input-bg)", border: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>＋{item.label}</span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
            NT${item.amount.toLocaleString()} / {unitMin}min
          </span>
        </div>
        {units > 0 && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-hot)" }}>
            NT${(item.amount * units).toLocaleString()}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => onChange(0)} style={{
          padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
          background: units === 0 ? "var(--accent)" : "transparent",
          color: units === 0 ? "white" : "var(--text-secondary)",
          border: `1.5px solid ${units === 0 ? "transparent" : "var(--glass-border)"}`,
          fontWeight: units === 0 ? 600 : 400,
        }}>不加</button>
        {Array.from({ length: maxUnits }, (_, i) => i + 1).map((u) => (
          <button key={u} type="button" onClick={() => onChange(u)} style={{
            padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
            background: units === u ? "var(--grad-primary)" : "transparent",
            color: units === u ? "white" : "var(--text-secondary)",
            border: `1.5px solid ${units === u ? "transparent" : "var(--glass-border)"}`,
            fontWeight: units === u ? 600 : 400,
          }}>+{formatHr(u, unitMin)}</button>
        ))}
      </div>
    </div>
  );
}

/* ── Form ── */
export default function AppointmentForm({ initial, onDirtyChange }: Props) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);

  function markDirty() {
    if (!isDirty) { setIsDirty(true); onDirtyChange?.(true); }
  }

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const [therapists,          setTherapists]          = useState<Therapist[]>([]);
  const [therapistId,         setTherapistId]         = useState(initial?.therapistId ?? "");
  const [date,                setDate]                = useState(initial?.date ?? "");
  const [time,                setTime]                = useState(initial?.time ?? "");
  const [location,            setLocation]            = useState(initial?.location ?? "");
  const [selection,           setSelection]           = useState<SelectionMap>({});
  const [depositPaid,         setDepositPaid]         = useState(initial?.depositPaid ?? 0);
  const [note,                setNote]                = useState(initial?.note ?? "");
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
      date, time, location,
      selectedFeeItems: selectedItems,
      depositPaid, totalAmount, balanceDue,
      note: note.trim() || undefined,
      status: initial?.status ?? "upcoming",
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveAppointment(appt);
    router.push("/");
  }

  if (therapists.length === 0) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"64px 0", textAlign:"center", gap:12 }}>
        <span style={{ fontSize:48 }}>💆‍♀️</span>
        <p style={{ fontSize:14, color:"var(--text-muted)" }}>請先新增師傅資料</p>
        <a href="/therapists/new" style={{ background:"var(--grad-primary)", color:"white", fontSize:13.5, padding:"8px 20px", borderRadius:999, textDecoration:"none", fontWeight:600 }}>
          前往新增師傅
        </a>
      </div>
    );
  }

  const baseItems  = therapist?.feeItems.filter((fi) => fi.type === "base")     ?? [];
  const timeItems  = therapist?.feeItems.filter((fi) => fi.type === "timeunit") ?? [];
  const addonItems = therapist?.feeItems.filter((fi) => fi.type === "addon")    ?? [];

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* 選擇師傅 */}
      <section style={sectionStyle}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>選擇師傅</span>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {therapists.map((t) => (
            <button key={t.id} type="button"
              onClick={() => { markDirty(); setTherapistId(t.id); }}
              style={{
                padding:"7px 16px", borderRadius:999, fontSize:13.5, cursor:"pointer",
                background: therapistId === t.id ? "var(--grad-primary)" : "transparent",
                color: therapistId === t.id ? "white" : "var(--text-secondary)",
                border: `1.5px solid ${therapistId === t.id ? "transparent" : "var(--glass-border)"}`,
                fontWeight: therapistId === t.id ? 600 : 400,
              }}>
              {t.name}
            </button>
          ))}
        </div>
      </section>

      {/* 預約資訊 */}
      <section style={sectionStyle}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>預約資訊</span>
        {/* 日期 + 時間 — 各自獨立 */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={labelStyle}>日期 *</label>
            <input type="date" value={date}
              onChange={(e) => { markDirty(); setDate(e.target.value); }}
              required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>時間 *</label>
            <input type="time" value={time}
              onChange={(e) => { markDirty(); setTime(e.target.value); }}
              required style={inputStyle} />
          </div>
        </div>
        {/* 地點 */}
        <div style={{ position:"relative" }}>
          <label style={labelStyle}>地點 *</label>
          <input value={location}
            onChange={(e) => {
              markDirty();
              setLocation(e.target.value);
              const val = e.target.value;
              if (locationDebounce.current) clearTimeout(locationDebounce.current);
              if (val.trim().length < 2) { setLocationSuggestions([]); return; }
              locationDebounce.current = setTimeout(async () => {
                const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
                setLocationSuggestions(await res.json());
              }, 400);
            }}
            onBlur={() => setTimeout(() => setLocationSuggestions([]), 150)}
            placeholder="例：捷運忠孝敦化站附近、飯店名稱"
            required style={inputStyle} />
          {locationSuggestions.length > 0 && (
            <ul style={{ position:"absolute", zIndex:50, left:0, right:0, marginTop:4, borderRadius:14, overflow:"hidden", background:"var(--section-bg)", border:"1px solid var(--glass-border)", boxShadow:"0 8px 24px rgba(124,98,214,0.14)" }}>
              {locationSuggestions.map((s, i) => (
                <li key={i} onMouseDown={() => { setLocation(s); setLocationSuggestions([]); markDirty(); }}
                  style={{ padding:"10px 14px", fontSize:13, color:"var(--text-card)", borderBottom: i < locationSuggestions.length-1 ? "1px solid var(--glass-border)" : "none", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  📍 {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 服務項目 */}
      {therapist && (
        <section style={sectionStyle}>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>服務項目</span>

          {baseItems.map((fi) => (
            <div key={fi.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderRadius:14, background:"var(--input-bg)", border:"1px solid var(--glass-border)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:18, height:18, borderRadius:"50%", background:"var(--grad-primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"white", flexShrink:0 }}>✓</span>
                <span style={{ fontSize:13.5, color:"var(--ink)" }}>{fi.label}</span>
                <span style={{ fontSize:10, color:"var(--accent)", background:"rgba(139,114,232,0.1)", border:"1px solid rgba(139,114,232,0.2)", padding:"1px 7px", borderRadius:999 }}>基礎</span>
              </div>
              <span style={{ fontSize:13.5, fontWeight:600, color:"var(--ink)" }}>NT${fi.amount.toLocaleString()}</span>
            </div>
          ))}

          {timeItems.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>加時服務</span>
              {timeItems.map((fi) => (
                <TimeUnitPicker key={fi.id} item={fi} units={selection[fi.id] ?? 0} onChange={(u) => setUnits(fi.id, u)} />
              ))}
            </div>
          )}

          {addonItems.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>加購項目</span>
              {addonItems.map((fi) => {
                const isSelected = (selection[fi.id] ?? 0) > 0;
                return (
                  <button key={fi.id} type="button" onClick={() => toggleAddon(fi.id)}
                    style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"10px 14px", borderRadius:14, fontSize:13.5, cursor:"pointer",
                      background: isSelected ? "rgba(139,114,232,0.08)" : "transparent",
                      border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--glass-border)"}`,
                      textAlign:"left",
                    }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{
                        width:18, height:18, borderRadius:"50%", flexShrink:0,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
                        background: isSelected ? "var(--grad-primary)" : "transparent",
                        border: isSelected ? "none" : "1.5px solid var(--glass-border)",
                        color: "white",
                      }}>{isSelected ? "✓" : ""}</span>
                      <span style={{ color: isSelected ? "var(--ink)" : "var(--text-secondary)" }}>＋{fi.label}</span>
                    </div>
                    <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--accent)" : "var(--text-muted)" }}>
                      NT${fi.amount.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 金額計算 */}
      <section style={sectionStyle}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>金額計算</span>
        {selectedItems.map((fi) => (
          <div key={fi.feeItemId} style={{ display:"flex", justifyContent:"space-between", fontSize:13.5, color:"var(--text-secondary)" }}>
            <span>{fi.label}</span>
            <span>NT${fi.amount.toLocaleString()}</span>
          </div>
        ))}
        <div style={{ borderTop:"1px dashed var(--glass-border)", paddingTop:10, display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:700 }}>
            <span style={{ color:"var(--ink)" }}>總金額</span>
            <span style={{ color:"var(--accent-hot)" }}>NT${totalAmount.toLocaleString()}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"var(--text-muted)" }}>已付訂金</span>
            <div style={{ display:"flex", alignItems:"center", border:"1px solid var(--glass-border)", borderRadius:12, padding:"6px 12px", gap:4, width:140, background:"var(--input-bg)" }}>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>NT$</span>
              <input type="number" value={depositPaid || ""}
                onChange={(e) => { markDirty(); setDepositPaid(Number(e.target.value)); }}
                placeholder="0"
                style={{ width:"100%", fontSize:13.5, textAlign:"right", background:"transparent", border:"none", outline:"none", color:"var(--input-text)" }} />
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:700, background:"rgba(139,114,232,0.08)", borderRadius:12, padding:"8px 12px" }}>
            <span style={{ color:"var(--ink)" }}>尾款</span>
            <span style={{ color:"var(--accent)" }}>NT${balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* 備註 */}
      <section style={sectionStyle}>
        <label style={labelStyle}>備註</label>
        <textarea value={note}
          onChange={(e) => { markDirty(); setNote(e.target.value); }}
          placeholder="其他注意事項、偏好等"
          rows={3}
          style={{ ...inputStyle, resize:"none" }} />
      </section>

      <button type="submit" style={{
        background:"var(--grad-primary)", color:"white", borderRadius:18,
        padding:"14px 0", fontWeight:700, fontSize:15, border:"none", cursor:"pointer",
        boxShadow:"0 8px 20px rgba(124,98,214,0.3)",
      }}>
        儲存預約
      </button>
    </form>
  );
}
