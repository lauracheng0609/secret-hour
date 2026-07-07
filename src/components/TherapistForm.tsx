"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveTherapist, generateId } from "@/lib/storage";
import { Therapist, FeeItem } from "@/lib/types";

interface Props {
  initial?: Therapist;
  onDirtyChange?: (dirty: boolean) => void;
}

function emptyItem(type: FeeItem["type"]): FeeItem {
  return {
    id: generateId(),
    label: "",
    amount: 0,
    isBase: type === "base",
    type,
    unitMinutes: type === "timeunit" ? 30 : undefined,
  };
}

const iStyle: React.CSSProperties = {
  borderRadius: 12, padding: "9px 12px", fontSize: 14,
  background: "var(--input-bg)", color: "var(--input-text)",
  border: "1px solid var(--glass-border)", outline: "none",
  boxSizing: "border-box" as const,
};

function ItemRow({
  item, onUpdate, onRemove, canRemove,
}: {
  item: FeeItem;
  onUpdate: (field: keyof FeeItem, value: string | number | boolean) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      {/* Label — fills remaining space */}
      <input
        value={item.label}
        onChange={(e) => onUpdate("label", e.target.value)}
        placeholder={item.type === "timeunit" ? "加時服務名稱" : "服務項目名稱"}
        style={{ ...iStyle, flex:1, minWidth:0 }}
      />
      {/* Unit select for timeunit */}
      {item.type === "timeunit" && (
        <select
          value={item.unitMinutes ?? 30}
          onChange={(e) => onUpdate("unitMinutes", Number(e.target.value))}
          style={{ ...iStyle, width:80, paddingLeft:8, paddingRight:8, appearance:"none" as const }}
        >
          <option value={30}>30min</option>
          <option value={60}>60min</option>
        </select>
      )}
      {/* NT$ amount — fixed width */}
      <div style={{ ...iStyle, display:"flex", alignItems:"center", gap:4, width:104, flexShrink:0 }}>
        <span style={{ fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>NT$</span>
        <input
          type="number"
          value={item.amount || ""}
          onChange={(e) => onUpdate("amount", Number(e.target.value))}
          placeholder="0"
          style={{ width:"100%", fontSize:13.5, textAlign:"right", background:"transparent", border:"none", outline:"none", color:"var(--input-text)" }}
        />
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove}
          style={{ fontSize:20, color:"var(--text-faint)", background:"none", border:"none", cursor:"pointer", padding:"0 2px", flexShrink:0 }}>×</button>
      )}
    </div>
  );
}

export default function TherapistForm({ initial, onDirtyChange }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
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

  const [name, setName] = useState(initial?.name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [contact, setContact] = useState(initial?.contact ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [avatar, setAvatar] = useState<string | undefined>(initial?.avatar);
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [calendarColor, setCalendarColor] = useState(initial?.calendarColor ?? "");
  const [anniversaryDate, setAnniversaryDate] = useState(initial?.anniversaryDate ?? "");
  const [depositAmount, setDepositAmount] = useState(initial?.depositAmount ?? 0);
  const [feeItems, setFeeItems] = useState<FeeItem[]>(
    initial?.feeItems.map((fi) => ({ ...fi, type: fi.type ?? (fi.isBase ? "base" : "addon") })) ??
      [emptyItem("base"), emptyItem("addon")]
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    markDirty();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatar(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  function updateItem(id: string, field: keyof FeeItem, value: string | number | boolean) {
    markDirty();
    setFeeItems((prev) => prev.map((fi) => fi.id === id ? { ...fi, [field]: value } : fi));
  }
  function addItem(type: FeeItem["type"]) {
    markDirty();
    setFeeItems((prev) => [...prev, emptyItem(type)]);
  }
  function removeItem(id: string) {
    markDirty();
    setFeeItems((prev) => prev.filter((fi) => fi.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsDirty(false);
    onDirtyChange?.(false);
    const therapist: Therapist = {
      id: initial?.id ?? generateId(),
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      contact: contact.trim() || undefined,
      note: note.trim() || undefined,
      avatar,
      isFavorite,
      calendarColor: calendarColor || undefined,
      anniversaryDate: anniversaryDate || undefined,
      depositAmount,
      feeItems: feeItems.filter((fi) => fi.label.trim()),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    saveTherapist(therapist);
    router.push("/therapists");
  }

  const baseItems = feeItems.filter((fi) => fi.type === "base");
  const addonItems = feeItems.filter((fi) => fi.type === "addon");
  const timeItems = feeItems.filter((fi) => fi.type === "timeunit");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Avatar + Favorite */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <button type="button" onClick={() => fileRef.current?.click()} className="relative group">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover bg-stone-200" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-[10px] text-stone-400">上傳照片</span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-xs">更換</span>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <button
          type="button"
          onClick={() => { markDirty(); setIsFavorite((v) => !v); }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors text-sm"
          style={{
            borderColor: isFavorite ? "#5b9bd5" : "#e5e7eb",
            color: isFavorite ? "#5b9bd5" : "#9e9e9e",
            background: isFavorite ? "#eff6ff" : "white",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 20 28" fill="none">
            <path d="M0 0h20v24l-10-6-10 6V0z" fill={isFavorite ? "#5b9bd5" : "#d1d5db"}/>
          </svg>
          {isFavorite ? "已加入最愛（置頂）" : "加入最愛"}
        </button>
        {/* Calendar color */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-stone-400">月曆顏色</span>
          <div className="flex items-center gap-2 border border-stone-200 rounded-xl px-3 py-2 bg-white">
            {calendarColor && (
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: calendarColor }} />
            )}
            <select
              value={calendarColor}
              onChange={(e) => { markDirty(); setCalendarColor(e.target.value); }}
              className="text-sm text-stone-600 focus:outline-none bg-transparent"
            >
              <option value="">未設定（預設藍）</option>
              <option value="#FF4894">🩷 桃紅</option>
              <option value="var(--accent)">🧡 珊瑚橘</option>
              <option value="#f472b6">💗 粉紫</option>
              <option value="#fb7185">❤️ 玫瑰</option>
              <option value="#a78bfa">💜 薰衣草</option>
              <option value="#818cf8">🫐 靛紫</option>
              <option value="#60a5fa">💙 天藍</option>
              <option value="#2dd4bf">🩵 青綠</option>
              <option value="#34d399">💚 薄荷</option>
              <option value="#fbbf24">🌼 鵝黃</option>
            </select>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <section style={{ background:"var(--section-bg)", border:"1px solid var(--glass-border)", borderRadius:20, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>基本資料</span>
        {[
          { label:"師傅名稱 *", val:name, set:setName, placeholder:"例：王小明", required:true },
          { label:"暱稱",       val:nickname, set:setNickname, placeholder:"例：小可愛" },
          { label:"聯絡方式",   val:contact,  set:setContact,  placeholder:"LINE ID、電話等" },
          { label:"備註",       val:note,     set:setNote,     placeholder:"其他補充" },
        ].map(({ label, val, set, placeholder, required }) => (
          <div key={label}>
            <label style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>{label}</label>
            <input value={val} onChange={(e) => { markDirty(); set(e.target.value); }}
              placeholder={placeholder} required={required}
              style={{ ...iStyle, width:"100%" }} />
          </div>
        ))}
        <div>
          <label style={{ fontSize:12, color:"var(--text-muted)", display:"block", marginBottom:4 }}>我與師傅的紀念日</label>
          <input type="date" value={anniversaryDate}
            onChange={(e) => { markDirty(); setAnniversaryDate(e.target.value); }}
            style={{ ...iStyle, width:"100%" }} />
          {anniversaryDate && (() => {
            const days = Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 ? (
              <p style={{ fontSize:12, marginTop:6, fontWeight:600, color:"var(--accent)" }}>
                我與這個師傅已經相遇 {days} 天 ♥
              </p>
            ) : null;
          })()}
        </div>
      </section>

      {/* Base fee */}
      <section style={{ background:"var(--section-bg)", border:"1px solid var(--glass-border)", borderRadius:20, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>基礎服務（必選）</span>
        {baseItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f,v)=>updateItem(fi.id,f,v)} onRemove={()=>removeItem(fi.id)} canRemove={baseItems.length>1} />
        ))}
        <button type="button" onClick={()=>addItem("base")} style={{ fontSize:13, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:"2px 0" }}>＋ 新增基礎項目</button>
      </section>

      {/* Time unit */}
      <section style={{ background:"var(--section-bg)", border:"1px solid var(--glass-border)", borderRadius:20, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>加時服務</span>
          <span style={{ fontSize:10, color:"var(--text-muted)", background:"var(--input-bg)", border:"1px solid var(--glass-border)", padding:"2px 8px", borderRadius:999 }}>單位時間計費</span>
        </div>
        {timeItems.length === 0 && <p style={{ fontSize:12, color:"var(--text-faint)" }}>尚未設定</p>}
        {timeItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f,v)=>updateItem(fi.id,f,v)} onRemove={()=>removeItem(fi.id)} canRemove={true} />
        ))}
        <button type="button" onClick={()=>addItem("timeunit")} style={{ fontSize:13, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:"2px 0" }}>＋ 新增加時項目</button>
      </section>

      {/* Add-ons */}
      <section style={{ background:"var(--section-bg)", border:"1px solid var(--glass-border)", borderRadius:20, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>加購項目（可選）</span>
        {addonItems.length === 0 && <p style={{ fontSize:12, color:"var(--text-faint)" }}>尚未設定</p>}
        {addonItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f,v)=>updateItem(fi.id,f,v)} onRemove={()=>removeItem(fi.id)} canRemove={true} />
        ))}
        <button type="button" onClick={()=>addItem("addon")} style={{ fontSize:13, color:"var(--accent)", background:"none", border:"none", cursor:"pointer", textAlign:"left", padding:"2px 0" }}>＋ 新增加購項目</button>
      </section>

      {/* Deposit */}
      <section style={{ background:"var(--section-bg)", border:"1px solid var(--glass-border)", borderRadius:20, padding:16, display:"flex", flexDirection:"column", gap:10 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"var(--ink-section)" }}>訂金設定</span>
        <div style={{ ...iStyle, display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:12, color:"var(--text-muted)" }}>NT$</span>
          <input type="number" value={depositAmount || ""}
            onChange={(e) => { markDirty(); setDepositAmount(Number(e.target.value)); }}
            placeholder="預約時需支付的訂金"
            style={{ flex:1, fontSize:13.5, background:"transparent", border:"none", outline:"none", color:"var(--input-text)" }} />
        </div>
      </section>

      <button type="submit" style={{
        background:"var(--grad-primary)", color:"white", borderRadius:18,
        padding:"14px 0", fontWeight:700, fontSize:15, border:"none", cursor:"pointer",
        boxShadow:"0 8px 20px rgba(124,98,214,0.3)",
      }}>
        儲存師傅資料
      </button>
    </form>
  );
}
