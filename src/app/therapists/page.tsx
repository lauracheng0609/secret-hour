"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTherapists, getWishes, saveWish, deleteWish, generateId } from "@/lib/storage";
import { Therapist, WishItem } from "@/lib/types";

const GLASS = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 4px 24px var(--glass-shadow)",
} as React.CSSProperties;

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) return <img src={src} alt={name} className="w-16 h-16 rounded-full object-cover bg-stone-200" />;
  return (
    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-2xl font-medium">
      {name.charAt(0)}
    </div>
  );
}

function WishCard({ item, onSave, onDelete, onCancel }: { item: WishItem; onSave: (w: WishItem) => void; onDelete: (id: string) => void; onCancel?: () => void }) {
  const [editing, setEditing] = useState(item.place === "");
  const [place, setPlace] = useState(item.place);
  const [address, setAddress] = useState(item.address ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [memo, setMemo] = useState(item.memo ?? "");
  const [photo, setPhoto] = useState(item.photo);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

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
    onSave({ ...item, place: place.trim(), address: address.trim() || undefined, url: url.trim() || undefined, memo: memo.trim() || undefined, photo });
    setEditing(false);
  }

  function handleShareLine() {
    const lines = [`📍 ${item.place}`];
    if (item.address) lines.push(`地址：${item.address}`);
    if (item.url) lines.push(`參考：${item.url}`);
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }

  if (editing) {
    return (
      <div className="rounded-2xl overflow-hidden" style={GLASS}>
        {/* Photo preview */}
        <div
          className="relative h-28 flex items-center justify-center cursor-pointer"
          style={{ background: photo ? `url(${photo}) center/cover` : "var(--upload-bg)" }}
          onClick={() => fileRef.current?.click()}
        >
          {photo && <div className="absolute inset-0 bg-white/40" />}
          <div className="relative flex flex-col items-center gap-1" style={{ color: "var(--upload-icon)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs">{photo ? "更換底圖" : "上傳底圖"}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="地點名稱 *"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border-subtle)" }} autoFocus />

          {/* Address autocomplete */}
          <div className="relative">
            <input value={address} onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder="地址（選填）"
              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border-subtle)" }} />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 border rounded-xl shadow-lg mt-1 overflow-hidden" style={{ background: "var(--section-bg)", borderColor: "var(--border-subtle)" }}>
                {suggestions.map((s, i) => (
                  <li key={i} onMouseDown={() => { setAddress(s); setSuggestions([]); }}
                    className="px-3 py-2.5 text-sm cursor-pointer border-b last:border-0 truncate"
                    style={{ color: "var(--text-card)", borderColor: "var(--border-subtle)" }}>
                    📍 {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="參考網址（選填）"
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none"
            style={{ background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border-subtle)" }} />
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="備忘（選填）" rows={2}
            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
            style={{ background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--border-subtle)" }} />
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--accent)" }}>儲存</button>
            <button
              onClick={() => item.place !== "" ? setEditing(false) : onCancel?.()}
              className="px-4 py-2 rounded-xl text-sm text-stone-400 border border-stone-200"
            >
              取消
            </button>
          </div>
          {item.place !== "" && (
            <button onClick={() => onDelete(item.id)} className="w-full text-sm text-red-400 text-center py-1">
              刪除這個許願
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden transition-opacity" style={{ ...GLASS, opacity: item.isRealized ? 0.5 : 1 }}>
      {/* Photo background */}
      {item.photo && (
        <div className="relative h-36" style={{ background: `url(${item.photo}) center/cover` }}>
          <div className="absolute inset-0 bg-white/40" />
          {item.isRealized && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl">✨</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-base flex-1 ${item.isRealized ? "line-through text-stone-400" : "text-stone-700"}`}>📍 {item.place}</p>
          {item.isRealized && <span className="text-xs text-purple-400 font-medium">已實現 ✨</span>}
        </div>
        {item.address && <p className="text-xs text-stone-500">🗺 {item.address}</p>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-xs underline underline-offset-2 truncate" style={{ color: "var(--accent)" }}>
            🔗 {item.url}
          </a>
        )}
        {item.memo && <p className="text-xs text-stone-400 whitespace-pre-wrap">{item.memo}</p>}

        <div className="flex gap-2 mt-1 justify-end">
          <button
            onClick={() => onSave({ ...item, isRealized: !item.isRealized })}
            className="text-xs px-3 py-1.5 rounded-full border transition-colors"
            style={item.isRealized
              ? { borderColor: "#c4b5fd", color: "var(--accent)", background: "#f5f3ff" }
              : { borderColor: "#e5e7eb", color: "#9e9e9e" }}
          >
            {item.isRealized ? "✨ 已實現" : "✓ 標記實現"}
          </button>
          <button onClick={() => setEditing(true)}
            className="text-xs font-medium text-white px-4 py-1.5 rounded-full"
            style={{ background: "var(--accent)" }}>
            編輯
          </button>
          <button onClick={handleShareLine}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
            style={{ background: "var(--accent-green)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.03 2 11c0 2.7 1.23 5.12 3.18 6.79L4 22l4.43-1.47C9.55 20.83 10.75 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z"/>
            </svg>
            分享到 LINE
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TherapistsPage() {
  const [tab, setTab] = useState<"therapists" | "wishes">("therapists");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [wishes, setWishes] = useState<WishItem[]>([]);

  useEffect(() => { reloadAll(); }, []);

  function reloadAll() {
    setTherapists(getTherapists().sort((a, b) => (a.isFavorite ? -1 : b.isFavorite ? 1 : 0)));
    setWishes(getWishes());
  }

  function handleAddWish() {
    const blank: WishItem = { id: generateId(), place: "", createdAt: new Date().toISOString() };
    setWishes((prev) => [blank, ...prev]);
  }

  function handleSaveWish(item: WishItem) {
    saveWish(item);
    setWishes(getWishes());
  }

  function handleDeleteWish(id: string) {
    if (!confirm("確定要刪除這個許願嗎？")) return;
    deleteWish(id);
    setWishes(getWishes());
  }

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <h2 className="text-lg font-semibold text-stone-500 mb-0.5">屬於我的</h2>
      <h1 className="text-4xl font-bold mb-6" style={{ background: "linear-gradient(to right, var(--title-from), var(--title-to))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Secret</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 rounded-2xl p-1.5" style={GLASS}>
        {(["therapists", "wishes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t ? { background: "var(--accent)", color: "white" } : { color: "#9e9e9e" }}
          >
            {t === "therapists" ? "我的師傅" : "許願池"}
          </button>
        ))}
      </div>

      {tab === "therapists" && (
        <>
          <div className="flex justify-end mb-4">
            <Link href="/therapists/new" className="text-sm font-medium text-white px-5 py-2 rounded-full" style={{ background: "var(--accent)" }}>
              Add +
            </Link>
          </div>
          {therapists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-stone-400 text-sm">還沒有師傅資料</p>
              <Link href="/therapists/new" className="text-sm text-white px-5 py-2 rounded-full" style={{ background: "var(--accent)" }}>新增師傅</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {therapists.map((t, i) => (
                <div key={t.id} className="card-enter rounded-2xl overflow-hidden relative" style={{ ...GLASS, animationDelay: `${i * 60}ms` }}>
                  {t.isFavorite && (
                    <div className="absolute top-0 right-3">
                      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                        <path d="M0 0h20v24l-10-6-10 6V0z" fill="var(--accent-cool)"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center gap-4 px-4 py-4">
                    <Avatar src={t.avatar} name={t.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg text-stone-700 leading-tight">{t.name}</p>
                      {t.nickname && <p className="text-sm text-stone-400">{t.nickname}</p>}
                      {t.anniversaryDate && (() => {
                        const days = Math.floor((Date.now() - new Date(t.anniversaryDate).getTime()) / (1000 * 60 * 60 * 24));
                        return days >= 0 ? <p className="text-xs font-medium mt-0.5" style={{ color: "var(--accent)" }}>相遇 {days} 天 ♥</p> : null;
                      })()}
                    </div>
                    <Link href={`/therapists/${t.id}`} className="text-sm font-medium text-white px-4 py-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }}>
                      編輯
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "wishes" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={handleAddWish} className="text-sm font-medium text-white px-5 py-2 rounded-full" style={{ background: "var(--accent)" }}>
              Add +
            </button>
          </div>
          {wishes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-4xl">🌙</p>
              <p className="text-stone-400 text-sm">還沒有許願，快來許下第一個願望吧</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {wishes.map((w, i) => (
                <div key={w.id} className="card-enter" style={{ animationDelay: `${i * 60}ms` }}>
                <WishCard item={w} onSave={handleSaveWish} onDelete={handleDeleteWish}
                  onCancel={w.place === "" ? () => setWishes((prev) => prev.filter((x) => x.id !== w.id)) : undefined} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
