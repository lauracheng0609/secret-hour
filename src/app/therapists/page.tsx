"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAppointments, getTherapists, getWishes, saveWish, deleteWish, generateId } from "@/lib/storage";
import { Therapist, WishItem } from "@/lib/types";

/* ── Gradient Avatar ── */
function GradientAvatar({ src, name, size = 64 }: { src?: string; name: string; size?: number }) {
  if (src) {
    return <img src={src} alt={name} style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"3px solid rgba(255,255,255,0.85)", boxShadow:"0 6px 18px rgba(159,134,242,0.25)" }} />;
  }
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:"var(--grad-primary)",
      display:"flex", alignItems:"center", justifyContent:"center",
      border:"3px solid rgba(255,255,255,0.9)",
      boxShadow:"0 6px 18px rgba(124,98,214,0.22)",
    }}>
      <span style={{
        fontFamily:"var(--font-cormorant,serif)", fontStyle:"italic", fontWeight:600,
        color:"white", fontSize:Math.round(size*0.42), lineHeight:1,
      }}>{name.charAt(0)}</span>
    </div>
  );
}

/* ── WishCard ── */
function WishCard({ item, onSave, onDelete, onCancel }: {
  item: WishItem;
  onSave: (w: WishItem) => void;
  onDelete: (id: string) => void;
  onCancel?: () => void;
}) {
  const [editing, setEditing] = useState(item.place === "");
  const [place, setPlace] = useState(item.place);
  const [address, setAddress] = useState(item.address ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [memo, setMemo] = useState(item.memo ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleAddressChange(val: string) {
    setAddress(val);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounce.current = setTimeout(async () => {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
      setSuggestions(await res.json());
    }, 400);
  }

  function handleSave() {
    if (!place.trim()) return;
    onSave({ ...item, place:place.trim(), address:address.trim()||undefined, url:url.trim()||undefined, memo:memo.trim()||undefined });
    setEditing(false);
  }

  function handleShareLine() {
    const lines = [`📍 ${item.place}`];
    if (item.address) lines.push(`地址：${item.address}`);
    if (item.url) lines.push(`參考：${item.url}`);
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }

  const inputStyle = {
    width:"100%", borderRadius:14, padding:"9px 12px", fontSize:13.5,
    background:"var(--input-bg)", color:"var(--input-text)", border:"1px solid var(--glass-border)",
    outline:"none", boxSizing:"border-box" as const,
  };

  if (editing) {
    return (
      <div className="glass" style={{ padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="地點名稱 *" style={inputStyle} autoFocus />
        <div style={{ position:"relative" }}>
          <input value={address} onChange={(e) => handleAddressChange(e.target.value)}
            onBlur={() => setTimeout(()=>setSuggestions([]),150)}
            placeholder="地址（選填）" style={inputStyle} />
          {suggestions.length > 0 && (
            <ul style={{ position:"absolute", zIndex:50, left:0, right:0, marginTop:4, borderRadius:14, overflow:"hidden", background:"var(--section-bg)", border:"1px solid var(--glass-border)", boxShadow:"0 8px 24px rgba(124,98,214,0.14)" }}>
              {suggestions.map((s, i) => (
                <li key={i} onMouseDown={() => { setAddress(s); setSuggestions([]); }}
                  style={{ padding:"9px 14px", fontSize:13, color:"var(--text-card)", borderBottom: i < suggestions.length-1 ? "1px solid var(--glass-border)" : "none", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  📍 {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="參考網址（選填）" style={inputStyle} />
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="備忘（選填）" rows={2}
          style={{ ...inputStyle, resize:"none" }} />
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={handleSave} style={{ flex:1, padding:"9px 0", borderRadius:14, fontSize:13.5, fontWeight:700, color:"white", background:"var(--grad-pink-cta)", border:"none", cursor:"pointer", boxShadow:"0 6px 16px rgba(124,98,214,0.28)" }}>儲存</button>
          <button onClick={() => item.place !== "" ? setEditing(false) : onCancel?.()}
            style={{ padding:"9px 16px", borderRadius:14, fontSize:13.5, color:"var(--text-muted)", background:"var(--glass-bg)", border:"1px solid var(--glass-border)", cursor:"pointer" }}>取消</button>
        </div>
        {item.place !== "" && (
          <button onClick={() => onDelete(item.id)} style={{ fontSize:12.5, color:"var(--accent-hot)", textAlign:"center", background:"none", border:"none", cursor:"pointer", padding:"4px 0" }}>
            刪除這個許願
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding:16, opacity: item.isRealized ? 0.65 : 1 }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:15, fontWeight:700, flex:1, color: item.isRealized ? "var(--text-muted)" : "var(--ink)", textDecoration: item.isRealized ? "line-through" : "none" }}>📍 {item.place}</span>
        {item.isRealized && <span style={{ fontSize:11, color:"var(--accent)", fontWeight:600, whiteSpace:"nowrap" }}>已實現 ✨</span>}
      </div>
      {item.address && <p style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:3 }}>🗺 {item.address}</p>}
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:12, color:"var(--accent)", display:"block", marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textDecoration:"underline" }}>
          🔗 {item.url}
        </a>
      )}
      {item.memo && <p style={{ fontSize:12, color:"var(--text-muted)", whiteSpace:"pre-wrap", marginBottom:6 }}>{item.memo}</p>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
        <button onClick={() => onSave({ ...item, isRealized: !item.isRealized })}
          style={{
            fontSize:12, padding:"6px 12px", borderRadius:999, cursor:"pointer",
            ...(item.isRealized
              ? { border:"1.5px solid var(--accent)", color:"var(--accent)", background:"rgba(139,114,232,0.08)" }
              : { border:"1.5px solid var(--glass-border)", color:"var(--text-muted)", background:"var(--glass-bg)" }),
          }}>
          {item.isRealized ? "✨ 已實現" : "✓ 標記實現"}
        </button>
        <button onClick={() => setEditing(true)}
          style={{ fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:999, color:"white", background:"var(--grad-primary)", border:"none", cursor:"pointer" }}>
          編輯
        </button>
        <button onClick={handleShareLine}
          style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, fontWeight:700, padding:"6px 12px", borderRadius:999, color:"white", background:"var(--accent-green)", border:"none", cursor:"pointer" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.18 6.79L4 22l4.43-1.47C9.55 20.83 10.75 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/>
          </svg>
          LINE
        </button>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function TherapistsPage() {
  const [tab, setTab] = useState<"therapists" | "wishes">("therapists");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [wishes,     setWishes]     = useState<WishItem[]>([]);
  const [apptCounts, setApptCounts] = useState<Record<string, number>>({});

  useEffect(() => { reloadAll(); }, []);

  function reloadAll() {
    setTherapists(getTherapists().sort((a,b) => (a.isFavorite ? -1 : b.isFavorite ? 1 : 0)));
    setWishes(getWishes());
    // count appointments per therapist
    const counts: Record<string, number> = {};
    getAppointments().filter(a => a.status !== "cancelled").forEach(a => {
      counts[a.therapistId] = (counts[a.therapistId] || 0) + 1;
    });
    setApptCounts(counts);
  }

  function handleAddWish() {
    const blank: WishItem = { id:generateId(), place:"", createdAt:new Date().toISOString() };
    setWishes(prev => [blank, ...prev]);
  }
  function handleSaveWish(item: WishItem) { saveWish(item); setWishes(getWishes()); }
  function handleDeleteWish(id: string) {
    if (!confirm("確定要刪除這個許願嗎？")) return;
    deleteWish(id); setWishes(getWishes());
  }

  return (
    <main style={{ flex:1, padding:"74px 22px 120px" }}>
      {/* Header */}
      <p style={{ fontSize:13, fontWeight:500, color:"var(--text-secondary)", letterSpacing:"0.14em", marginBottom:4 }}>屬於我的</p>
      <h1 style={{
        fontFamily:"var(--font-cormorant,serif)", fontStyle:"italic", fontWeight:500,
        fontSize:50, lineHeight:1, margin:"0 0 24px",
        background:"var(--grad-title)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
      }}>Your Secret</h1>

      {/* Segmented control */}
      <div className="glass" style={{ display:"flex", gap:6, padding:"5px 6px", marginBottom:22, borderRadius:18 }}>
        {(["therapists","wishes"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:"9px 0", borderRadius:14, fontSize:13.5, fontWeight:600, cursor:"pointer", border:"none",
            ...(tab === t
              ? { background:"var(--grad-primary)", color:"white", boxShadow:"0 6px 16px rgba(124,98,214,0.28)" }
              : { background:"transparent", color:"var(--text-muted)" }),
          }}>
            {t === "therapists" ? "我的師傅" : "許願池"}
          </button>
        ))}
      </div>

      {/* ── 師傅 tab ── */}
      {tab === "therapists" && (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <Link href="/therapists/new" style={{ fontSize:13.5, fontWeight:700, color:"white", padding:"8px 20px", borderRadius:999, background:"var(--grad-primary)", textDecoration:"none", boxShadow:"0 6px 16px rgba(124,98,214,0.28)" }}>
              新增 +
            </Link>
          </div>

          {therapists.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:12, textAlign:"center" }}>
              <p style={{ color:"var(--text-muted)", fontSize:14 }}>還沒有師傅資料</p>
              <Link href="/therapists/new" style={{ fontSize:13.5, fontWeight:700, color:"white", padding:"8px 20px", borderRadius:999, background:"var(--grad-primary)", textDecoration:"none" }}>新增師傅</Link>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {therapists.map((t, i) => {
                const totalAppts = apptCounts[t.id] || 0;
                const daysKnown = t.anniversaryDate
                  ? Math.floor((Date.now() - new Date(t.anniversaryDate).getTime()) / (1000*60*60*24))
                  : null;
                return (
                  <div key={t.id} className="glass card-enter" style={{ position:"relative", overflow:"visible", animationDelay:`${i*60}ms` }}>
                    {/* Bookmark ribbon */}
                    {t.isFavorite && (
                      <div style={{ position:"absolute", top:0, right:14, zIndex:1 }}>
                        <svg width="22" height="32" viewBox="0 0 22 32" fill="none">
                          <path d="M0 0h22v28l-11-7-11 7V0z" fill="var(--grad-pink-cta,#E88BC4)" opacity="0.9"/>
                        </svg>
                      </div>
                    )}
                    <div style={{ padding:"18px 18px 14px" }}>
                      {/* Top row */}
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <GradientAvatar src={t.avatar} name={t.name} size={60} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontWeight:700, fontSize:17, color:"var(--ink)", lineHeight:1.2, margin:0 }}>{t.name}</p>
                          {t.nickname && <p style={{ fontSize:13, color:"var(--text-secondary)", marginTop:2 }}>{t.nickname}</p>}
                          {daysKnown !== null && daysKnown >= 0 && (
                            <p style={{ fontSize:12, fontWeight:600, marginTop:3, color:"var(--accent)" }}>相遇 {daysKnown} 天 ♥</p>
                          )}
                        </div>
                        <Link href={`/therapists/${t.id}`}
                          style={{ fontSize:13, fontWeight:700, color:"white", padding:"7px 16px", borderRadius:999, background:"var(--grad-primary)", textDecoration:"none", flexShrink:0 }}>
                          編輯
                        </Link>
                      </div>

                      {/* Stats row */}
                      <div style={{ display:"flex", gap:8, marginTop:14, minWidth:0 }}>
                        <div style={{ flexShrink:0, width:72, padding:"8px 0", borderRadius:14, background:"rgba(139,114,232,0.08)", textAlign:"center" }}>
                          <p style={{ fontSize:22, fontFamily:"var(--font-cormorant,serif)", fontStyle:"italic", fontWeight:600, color:"var(--accent)", lineHeight:1, margin:0 }}>{totalAppts}</p>
                          <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:2, whiteSpace:"nowrap" }}>總次數</p>
                        </div>
                        {t.memo && (
                          <div style={{ flex:1, minWidth:0, padding:"8px 12px", borderRadius:14, background:"rgba(139,114,232,0.06)", display:"flex", alignItems:"center", overflow:"hidden" }}>
                            <p style={{ fontSize:12, color:"var(--text-secondary)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%" }}>📝 {t.memo}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── 許願池 tab ── */}
      {tab === "wishes" && (
        <>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
            <button onClick={handleAddWish} style={{ fontSize:13.5, fontWeight:700, color:"white", padding:"8px 20px", borderRadius:999, background:"var(--grad-primary)", border:"none", cursor:"pointer", boxShadow:"0 6px 16px rgba(124,98,214,0.28)" }}>
              新增 +
            </button>
          </div>
          {wishes.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 0", gap:12, textAlign:"center" }}>
              <span style={{ fontSize:48 }}>🌙</span>
              <p style={{ color:"var(--text-muted)", fontSize:14 }}>還沒有許願，快來許下第一個願望吧</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {wishes.map((w, i) => (
                <div key={w.id} className="card-enter" style={{ animationDelay:`${i*60}ms` }}>
                  <WishCard item={w} onSave={handleSaveWish} onDelete={handleDeleteWish}
                    onCancel={w.place === "" ? () => setWishes(prev=>prev.filter(x=>x.id!==w.id)) : undefined} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
