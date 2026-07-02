"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAppointments, getTherapists } from "@/lib/storage";
import { Appointment, Therapist } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import AppointmentCard from "@/components/AppointmentCard";

/* ── Helpers ── */
const MONTHS_ZH = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const DAYS_ZH   = ["日","一","二","三","四","五","六"];
const WEEKDAYS_FULL = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

function todayKicker() {
  const d = new Date();
  return `${d.getMonth()+1}月${d.getDate()}日 ${WEEKDAYS_FULL[d.getDay()]} · 你好`;
}

/* ── Calendar ── */
function CalendarView({ appointments }: { appointments: Appointment[] }) {
  const [year,  setYear]  = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  const apptDays = new Set<number>();
  appointments.forEach((a) => {
    const d = new Date(a.date);
    if (d.getFullYear() === year && d.getMonth() === month && a.status !== "cancelled")
      apptDays.add(d.getDate());
  });

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  function prev() { if (month === 0) { setYear(y=>y-1); setMonth(11); } else setMonth(m=>m-1); }
  function next() { if (month === 11) { setYear(y=>y+1); setMonth(0); } else setMonth(m=>m+1); }

  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length:daysInMonth},(_,i)=>i+1)];

  return (
    <div className="glass" style={{ padding: "20px 16px 16px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
        <button onClick={prev} style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:18, background:"none", border:"none" }}>‹</button>
        <span style={{ fontWeight:700, fontSize:15, color:"var(--ink-section)" }}>{year}年 {MONTHS_ZH[month]}</span>
        <button onClick={next} style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)", fontSize:18, background:"none", border:"none" }}>›</button>
      </div>
      {/* Weekday row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:4 }}>
        {DAYS_ZH.map(d=>(
          <div key={d} style={{ textAlign:"center", fontSize:11, color:"#A79ECB", paddingBottom:6 }}>{d}</div>
        ))}
      </div>
      {/* Days */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", rowGap:4 }}>
        {cells.map((day, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"2px 0" }}>
            {day !== null && (
              <>
                <div style={{
                  width:30, height:30,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  borderRadius:"50%",
                  fontSize:13.5, fontWeight: isToday(day) ? 700 : 400,
                  color: isToday(day) ? "white" : "var(--ink)",
                  background: isToday(day) ? "linear-gradient(135deg,#9F86F2,#E88BC4)" : "transparent",
                  boxShadow: isToday(day) ? "0 6px 14px rgba(159,134,242,0.45)" : "none",
                  transition: "all 0.15s ease",
                }}>{day}</div>
                {apptDays.has(day) && !isToday(day) && (
                  <div style={{ width:4, height:4, borderRadius:"50%", background:"#EF6DA8", marginTop:2 }} />
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Export/Import helpers (kept from original) ── */
const KEYS = ["sh_therapists", "sh_appointments"];
function handleExport() {
  const data: Record<string,unknown> = {};
  for (const key of KEYS) { const r = localStorage.getItem(key); if (r) data[key]=JSON.parse(r); }
  const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `secret-hour-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  URL.revokeObjectURL(url);
}
function handleImport(e: React.ChangeEvent<HTMLInputElement>, onDone:()=>void) {
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target?.result as string);
      if (!KEYS.some(k=>Array.isArray(data[k]))) { alert("格式不正確"); return; }
      if (!confirm("匯入後將覆蓋現有資料，確定繼續？")) return;
      for (const key of KEYS) { if (Array.isArray(data[key])) localStorage.setItem(key,JSON.stringify(data[key])); }
      onDone();
    } catch { alert("無法讀取檔案"); }
  };
  reader.readAsText(file); e.target.value="";
}
function scheduleNotifications(appointments: Appointment[]) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = new Date();
  appointments.filter(a=>a.status!=="cancelled"&&new Date(`${a.date}T${a.time}`)>now).forEach(appt=>{
    const apptTime = new Date(`${appt.date}T${appt.time}`);
    const twoHrsBefore = new Date(apptTime.getTime()-2*60*60*1000);
    const evening = new Date(apptTime); evening.setDate(evening.getDate()-1); evening.setHours(21,0,0,0);
    [evening,twoHrsBefore].forEach(t=>{
      const delay = t.getTime()-now.getTime();
      if (delay>0&&delay<24*60*60*1000) {
        setTimeout(()=>new Notification(t===evening?"明天要見面了 ♥":"再 2 小時就見到他了 ♥",{
          body:`${appt.therapistName}・${appt.time}・${appt.location||"地點待確認"}`,icon:"/icon-192.png",
        }),delay);
      }
    });
  });
}

/* ── Page ── */
export default function HomePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [therapists,   setTherapists]   = useState<Therapist[]>([]);
  const [toast,        setToast]        = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const { theme, toggle } = useTheme();

  function reload() {
    const appts = getAppointments();
    setAppointments(appts);
    setTherapists(getTherapists());
    scheduleNotifications(appts);
  }
  function showToast() { setToast(true); setTimeout(()=>setToast(false),2200); }

  useEffect(() => {
    reload();
    if ("Notification" in window && Notification.permission==="default")
      Notification.requestPermission().then(p=>{ if(p==="granted") scheduleNotifications(getAppointments()); });
  }, []);

  const now = new Date();
  const upcoming = appointments
    .filter(a=>a.status!=="cancelled"&&new Date(`${a.date}T${a.time}`)>=now)
    .sort((a,b)=>new Date(`${a.date}T${a.time}`).getTime()-new Date(`${b.date}T${b.time}`).getTime())
    .slice(0,3);

  return (
    <main style={{ flex:1, padding:"74px 22px 120px", maxWidth:480 }}>

      {/* Header row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:4 }}>
        <div>
          <p style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)", letterSpacing:"0.14em", marginBottom:4 }}>
            {todayKicker()}
          </p>
          <h1 style={{
            fontFamily:"var(--font-cormorant,serif)", fontStyle:"italic", fontWeight:500,
            fontSize:50, lineHeight:1, margin:0,
            background:"linear-gradient(100deg,#8B72E8 10%,#C77BD4 55%,#EF87B8 95%)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
          }}>Secret Hour</h1>
        </div>

        {/* Top-right actions */}
        <div style={{ display:"flex", gap:8, paddingTop:2 }}>
          <button onClick={toggle}
            style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, background:"var(--glass-bg)", border:"1px solid var(--glass-border)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", boxShadow:"0 4px 16px rgba(124,98,214,0.1)" }}
            title="切換配色">{theme==="purple"?"🌿":"🫧"}</button>
          <button onClick={()=>importRef.current?.click()}
            style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--glass-bg)", border:"1px solid var(--glass-border)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", boxShadow:"0 4px 16px rgba(124,98,214,0.1)" }}
            title="匯入備份">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 21V8M7 13l5-5 5 5M4 20h16" stroke="#8B72E8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={handleExport}
            style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--glass-bg)", border:"1px solid var(--glass-border)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", boxShadow:"0 4px 16px rgba(124,98,214,0.1)" }}
            title="匯出備份">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 11l5 5 5-5M4 20h16" stroke="#8B72E8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden"
            onChange={e=>handleImport(e,()=>{reload();showToast();})} />
        </div>
      </div>

      {/* Calendar */}
      <div style={{ marginTop:24, marginBottom:22 }}>
        <CalendarView appointments={appointments} />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--ink-section)", letterSpacing:"0.08em" }}>即將到來</span>
            <Link href="/schedule" style={{ fontSize:12.5, color:"#9B8BE0", textDecoration:"none" }}>查看全部 ›</Link>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {upcoming.map((a,i)=>(
              <div key={a.id} className="card-enter" style={{ animationDelay:`${i*60}ms` }}>
                <AppointmentCard appt={a} therapists={therapists} showCountdown />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:112, left:"50%", transform:"translateX(-50%)",
          padding:"10px 20px", borderRadius:999, fontSize:13, fontWeight:600,
          color:"white", background:"linear-gradient(135deg,#9F86F2,#E88BC4)",
          boxShadow:"0 8px 20px rgba(159,134,242,0.4)", zIndex:50, pointerEvents:"none",
          animation:"fadeSlideUp 0.3s ease both",
        }}>✓ 匯入成功</div>
      )}
    </main>
  );
}
