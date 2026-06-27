"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getTherapists, getWishes, saveWish, deleteWish, generateId } from "@/lib/storage";
import { Therapist, WishItem } from "@/lib/types";

const GLASS = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  boxShadow: "0 4px 24px rgba(141,106,255,0.08)",
} as React.CSSProperties;

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) return <img src={src} alt={name} className="w-16 h-16 rounded-full object-cover bg-stone-200" />;
  return (
    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-2xl font-medium">
      {name.charAt(0)}
    </div>
  );
}

function WishCard({ item, onSave, onDelete }: { item: WishItem; onSave: (w: WishItem) => void; onDelete: (id: string) => void }) {
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
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
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
          style={{ background: photo ? `url(${photo}) center/cover` : "#f3f0ff" }}
          onClick={() => fileRef.current?.click()}
        >
          {photo && <div className="absolute inset-0 bg-white/40" />}
          <div className="relative flex flex-col items-center gap-1 text-purple-300">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs">{photo ? "更換底圖" : "上傳底圖"}</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="地點名稱 *"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70" autoFocus />

          {/* Address autocomplete */}
          <div className="relative">
            <input value={address} onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder="地址（選填）"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70" />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 bg-white border border-stone-100 rounded-xl shadow-lg mt-1 overflow-hidden">
                {suggestions.map((s, i) => (
                  <li key={i} onMouseDown={() => { setAddress(s); setSuggestions([]); }}
                    className="px-3 py-2.5 text-sm text-stone-600 hover:bg-purple-50 cursor-pointer border-b border-stone-50 last:border-0 truncate">
                    📍 {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="參考網址（選填）"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70" />
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="備忘（選填）" rows={2}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70 resize-none" />
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#8D6AFF" }}>儲存</button>
            {item.place !== "" && (
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-stone-400 border border-stone-200">取消</button>
            )}
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
    <div className="rounded-2xl overflow-hidden" style={GLASS}>
      {/* Photo background */}
      {item.photo && (
        <div className="relative h-36" style={{ background: `url(${item.photo}) center/cover` }}>
          <div className="absolute inset-0 bg-white/40" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2">
        <p className="font-semibold text-stone-700 text-base">📍 {item.place}</p>
        {item.address && <p className="text-xs text-stone-500">🗺 {item.address}</p>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="text-xs underline underline-offset-2 truncate" style={{ color: "#8D6AFF" }}>
            🔗 {item.url}
          </a>
        )}
        {item.memo && <p className="text-xs text-stone-400 whitespace-pre-wrap">{item.memo}</p>}

        <div className="flex gap-2 mt-1">
          <button onClick={() => setEditing(true)}
            className="text-xs font-medium text-white px-4 py-1.5 rounded-full"
            style={{ background: "#8D6AFF" }}>
            編輯
          </button>
          <button onClick={handleShareLine}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
            style={{ background: "#06C755" }}>
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
      <h1 className="text-4xl font-bold mb-6" style={{ background: "linear-gradient(to right, #8E4DC8, #DABAE8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Your Secret</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 rounded-2xl p-1.5" style={GLASS}>
        {(["therapists", "wishes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={tab === t ? { background: "#8D6AFF", color: "white" } : { color: "#9e9e9e" }}
          >
            {t === "therapists" ? "我的師傅" : "許願池"}
          </button>
        ))}
      </div>

      {tab === "therapists" && (
        <>
          <div className="flex justify-end mb-4">
            <Link href="/therapists/new" className="text-sm font-medium text-white px-5 py-2 rounded-full" style={{ background: "#8D6AFF" }}>
              Add +
            </Link>
          </div>
          {therapists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <p className="text-stone-400 text-sm">還沒有師傅資料</p>
              <Link href="/therapists/new" className="text-sm text-white px-5 py-2 rounded-full" style={{ background: "#8D6AFF" }}>新增師傅</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {therapists.map((t) => (
                <div key={t.id} className="rounded-2xl overflow-hidden relative" style={GLASS}>
                  {t.isFavorite && (
                    <div className="absolute top-0 right-3">
                      <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
                        <path d="M0 0h20v24l-10-6-10 6V0z" fill="#5b9bd5"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex items-center gap-4 px-4 py-4">
                    <Avatar src={t.avatar} name={t.name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg text-stone-700 leading-tight">{t.name}</p>
                      {t.nickname && <p className="text-sm text-stone-400">{t.nickname}</p>}
                    </div>
                    <Link href={`/therapists/${t.id}`} className="text-sm font-medium text-white px-4 py-1.5 rounded-full shrink-0" style={{ background: "#8D6AFF" }}>
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
            <button onClick={handleAddWish} className="text-sm font-medium text-white px-5 py-2 rounded-full" style={{ background: "#8D6AFF" }}>
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
              {wishes.map((w) => (
                <WishCard key={w.id} item={w} onSave={handleSaveWish} onDelete={handleDeleteWish} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
