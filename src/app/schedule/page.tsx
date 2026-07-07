"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAppointments, getTherapists } from "@/lib/storage";
import { Appointment, Therapist } from "@/lib/types";
import AppointmentCard from "@/components/AppointmentCard";

function PastModal({ past, therapists, onClose }: { past: Appointment[]; therapists: Therapist[]; onClose: () => void }) {
  const therapistOptions = Array.from(
    new Map(past.map((a) => [a.therapistId, a.therapistName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const [selectedId, setSelectedId] = useState(therapistOptions[0]?.id ?? "");
  const filtered = past.filter((a) => a.therapistId === selectedId);
  const hasMultiple = therapistOptions.length > 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", maxWidth:480, margin:"0 auto", left:0, right:0 }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(62,53,88,0.35)", backdropFilter:"blur(4px)" }} onClick={onClose} />
      <div style={{
        position:"relative", width:"100%", maxHeight:"85dvh", display:"flex", flexDirection:"column",
        borderRadius:"28px 28px 0 0",
        background:"rgba(255,255,255,0.75)", backdropFilter:"blur(28px) saturate(180%)",
        WebkitBackdropFilter:"blur(28px) saturate(180%)",
        border:"1px solid rgba(255,255,255,0.9)", borderBottom:"none",
        boxShadow:"0 -8px 40px rgba(124,98,214,0.18)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 12px", flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:15, color:"var(--ink-section)" }}>全部歷史紀錄</span>
          <button onClick={onClose} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, color:"var(--text-muted)", background:"none", border:"none" }}>×</button>
        </div>

        <div style={{ padding:"0 20px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexShrink:0 }}>
          <p style={{ fontSize:13.5, flex:1, color:"var(--accent)" }}>
            已經跟 <strong>{therapistOptions.find((t) => t.id === selectedId)?.name}</strong> 見面{" "}
            <strong>{filtered.length}</strong> 次囉 ❤️
          </p>
          <div style={{ position:"relative", flexShrink:0 }}>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} disabled={!hasMultiple}
              style={{
                appearance:"none", paddingLeft:12, paddingRight:28, paddingTop:6, paddingBottom:6,
                borderRadius:999, fontSize:13, fontWeight:600, border:`1.5px solid`,
                borderColor: hasMultiple ? "var(--accent)" : "var(--text-faint)",
                color: hasMultiple ? "var(--accent)" : "var(--text-muted)",
                background:"rgba(255,255,255,0.8)", outline:"none",
              }}>
              {therapistOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", fontSize:9, color: hasMultiple ? "var(--accent)" : "var(--text-faint)" }}>▼</span>
          </div>
        </div>

        <div style={{ height:1, background:"rgba(139,114,232,0.12)", flexShrink:0 }} />

        <div style={{ overflowY:"auto", flex:1, padding:"12px 16px", display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((a, i) => (
            <div key={a.id} className="card-enter" style={{ animationDelay:`${i*60}ms` }}>
              <AppointmentCard appt={a} therapists={therapists} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists,   setTherapists]   = useState<Therapist[]>([]);
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
    <main style={{ flex:1, padding:"74px 22px 120px" }}>
      {/* Header */}
      <p style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)", letterSpacing:"0.14em", marginBottom:4 }}>
        我的行程
      </p>
      <h1 style={{
        fontFamily:"var(--font-cormorant,serif)", fontStyle:"italic", fontWeight:500,
        fontSize:50, lineHeight:1, margin:"0 0 24px",
        background:"var(--grad-title)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
      }}>Schedule</h1>

      {appointments.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:12, textAlign:"center" }}>
          <span style={{ fontSize:48 }}>🗓</span>
          <p style={{ color:"var(--text-muted)", fontSize:14 }}>還沒有預約紀錄</p>
          <Link href="/appointments/new" style={{ fontSize:13.5, color:"white", padding:"8px 20px", borderRadius:999, background:"var(--grad-pink-cta)", textDecoration:"none", fontWeight:600, boxShadow:"0 6px 16px rgba(241,121,174,0.35)" }}>
            新增預約
          </Link>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
          {upcoming.length > 0 && (
            <section>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)", letterSpacing:"0.08em", display:"block", marginBottom:12 }}>即將到來</span>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {upcoming.map((a, i) => (
                  <div key={a.id} className="card-enter" style={{ animationDelay:`${i*60}ms` }}>
                    <AppointmentCard appt={a} therapists={therapists} showCountdown />
                  </div>
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)", letterSpacing:"0.08em", display:"block", marginBottom:12 }}>歷史紀錄</span>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {past.slice(0, 3).map((a, i) => (
                  <div key={a.id} className="card-enter" style={{ animationDelay:`${i*60}ms` }}>
                    <AppointmentCard appt={a} therapists={therapists} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowPastModal(true)}
                style={{
                  marginTop:12, width:"100%", padding:"12px 0",
                  borderRadius:16, fontSize:13.5, fontWeight:600,
                  color:"var(--accent)", border:"1.5px solid rgba(139,114,232,0.3)",
                  background:"rgba(139,114,232,0.06)", cursor:"pointer",
                }}>
                看全部紀錄（共 {past.length} 筆）
              </button>
            </section>
          )}
        </div>
      )}

      {/* FAB */}
      <Link href="/appointments/new" style={{
        position:"fixed", bottom:100, right:22,
        width:52, height:52, borderRadius:"50%",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:26, color:"white", textDecoration:"none",
        background:"var(--grad-primary)",
        boxShadow:"0 8px 22px rgba(124,98,214,0.35)",
        zIndex:40,
      }}>+</Link>

      {showPastModal && (
        <PastModal past={past} therapists={therapists} onClose={() => setShowPastModal(false)} />
      )}
    </main>
  );
}
