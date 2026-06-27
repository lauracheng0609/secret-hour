"use client";

import { useEffect, useState } from "react";
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
  const [url, setUrl] = useState(item.url ?? "");
  const [memo, setMemo] = useState(item.memo ?? "");

  function handleSave() {
    if (!place.trim()) return;
    onSave({ ...item, place: place.trim(), url: url.trim() || undefined, memo: memo.trim() || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={GLASS}>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="想去的地方 *"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70"
          autoFocus
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="參考網址（選填）"
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70"
        />
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="備忘（選填）"
          rows={3}
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-300 bg-white/70 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "#8D6AFF" }}
          >
            儲存
          </button>
          {item.place !== "" && (
            <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-stone-400 border border-stone-200">
              取消
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={GLASS}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-stone-700 text-base">📍 {item.place}</p>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1 rounded-full border border-purple-200 text-purple-500">編輯</button>
          <button onClick={() => onDelete(item.id)} className="text-xs px-3 py-1 rounded-full border border-red-100 text-red-400">刪除</button>
        </div>
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-2 truncate"
          style={{ color: "#8D6AFF" }}>
          🔗 {item.url}
        </a>
      )}
      {item.memo && <p className="text-xs text-stone-400 whitespace-pre-wrap">{item.memo}</p>}
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
