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

function ItemRow({
  item,
  onUpdate,
  onRemove,
  canRemove,
}: {
  item: FeeItem;
  onUpdate: (field: keyof FeeItem, value: string | number | boolean) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex gap-2 items-center">
      <input
        value={item.label}
        onChange={(e) => onUpdate("label", e.target.value)}
        placeholder={item.type === "timeunit" ? "加時服務名稱" : "服務項目名稱"}
        className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
      />
      {item.type === "timeunit" && (
        <div className="flex items-center border border-stone-200 rounded-xl px-2 py-2 gap-1 w-24">
          <select
            value={item.unitMinutes ?? 30}
            onChange={(e) => onUpdate("unitMinutes", Number(e.target.value))}
            className="w-full text-xs focus:outline-none bg-transparent"
          >
            <option value={30}>30 min</option>
            <option value={60}>60 min</option>
          </select>
        </div>
      )}
      <div className="flex items-center border border-stone-200 rounded-xl px-3 py-2 gap-1 w-28">
        <span className="text-xs text-stone-400">NT$</span>
        <input
          type="number"
          value={item.amount || ""}
          onChange={(e) => onUpdate("amount", Number(e.target.value))}
          placeholder="0"
          className="w-full text-sm focus:outline-none text-right"
        />
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-stone-300 text-lg">×</button>
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
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
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
              <option value="#8D6AFF">🧡 珊瑚橘</option>
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
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">基本資料</h2>
        <div>
          <label className="text-xs text-stone-400 mb-1 block">師傅名稱 *</label>
          <input
            value={name}
            onChange={(e) => { markDirty(); setName(e.target.value); }}
            placeholder="例：王小明"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
            required
          />
        </div>
        <div>
          <label className="text-xs text-stone-400 mb-1 block">暱稱</label>
          <input
            value={nickname}
            onChange={(e) => { markDirty(); setNickname(e.target.value); }}
            placeholder="例：小可愛"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
          />
        </div>
        <div>
          <label className="text-xs text-stone-400 mb-1 block">聯絡方式</label>
          <input
            value={contact}
            onChange={(e) => { markDirty(); setContact(e.target.value); }}
            placeholder="LINE ID、電話等"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
          />
        </div>
        <div>
          <label className="text-xs text-stone-400 mb-1 block">備註</label>
          <input
            value={note}
            onChange={(e) => { markDirty(); setNote(e.target.value); }}
            placeholder="其他補充"
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
          />
        </div>
        <div>
          <label className="text-xs text-stone-400 mb-1 block">我與師傅的紀念日</label>
          <input
            type="date"
            value={anniversaryDate}
            onChange={(e) => { markDirty(); setAnniversaryDate(e.target.value); }}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8D6AFF]"
          />
          {anniversaryDate && (() => {
            const days = Math.floor((Date.now() - new Date(anniversaryDate).getTime()) / (1000 * 60 * 60 * 24));
            return days >= 0 ? (
              <p className="text-xs mt-1.5 font-medium" style={{ color: "#8D6AFF" }}>
                我與這個師傅已經相遇 {days} 天 ♥
              </p>
            ) : null;
          })()}
        </div>
      </section>

      {/* Base fee */}
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">基礎服務（必選）</h2>
        {baseItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f, v) => updateItem(fi.id, f, v)} onRemove={() => removeItem(fi.id)} canRemove={baseItems.length > 1} />
        ))}
        <button type="button" onClick={() => addItem("base")} className="text-xs text-left" style={{ color: "#8D6AFF" }}>＋ 新增基礎項目</button>
      </section>

      {/* Time unit */}
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-500">加時服務</h2>
          <span className="text-[10px] text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded-full">單位時間計費</span>
        </div>
        {timeItems.length === 0 && <p className="text-xs text-stone-300">尚未設定</p>}
        {timeItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f, v) => updateItem(fi.id, f, v)} onRemove={() => removeItem(fi.id)} canRemove={true} />
        ))}
        <button type="button" onClick={() => addItem("timeunit")} className="text-xs text-left" style={{ color: "#8D6AFF" }}>＋ 新增加時項目</button>
      </section>

      {/* Add-ons */}
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">加購項目（可選）</h2>
        {addonItems.length === 0 && <p className="text-xs text-stone-300">尚未設定</p>}
        {addonItems.map((fi) => (
          <ItemRow key={fi.id} item={fi} onUpdate={(f, v) => updateItem(fi.id, f, v)} onRemove={() => removeItem(fi.id)} canRemove={true} />
        ))}
        <button type="button" onClick={() => addItem("addon")} className="text-xs text-left" style={{ color: "#8D6AFF" }}>＋ 新增加購項目</button>
      </section>

      {/* Deposit */}
      <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-stone-500">訂金設定</h2>
        <div className="flex items-center border border-stone-200 rounded-xl px-3 py-2 gap-1">
          <span className="text-xs text-stone-400">NT$</span>
          <input
            type="number"
            value={depositAmount || ""}
            onChange={(e) => { markDirty(); setDepositAmount(Number(e.target.value)); }}
            placeholder="預約時需支付的訂金"
            className="flex-1 text-sm focus:outline-none"
          />
        </div>
      </section>

      <button
        type="submit"
        className="text-white rounded-2xl py-3 font-semibold text-sm shadow-md"
        style={{ background: "#8D6AFF", boxShadow: "0 4px 12px #8D6AFF44" }}
      >
        儲存師傅資料
      </button>
    </form>
  );
}
