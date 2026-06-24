"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTherapists, saveTherapist, deleteTherapist } from "@/lib/storage";
import { Therapist } from "@/lib/types";

function Avatar({ src, name }: { src?: string; name: string }) {
  if (src) {
    return <img src={src} alt={name} className="w-16 h-16 rounded-full object-cover bg-stone-200" />;
  }
  return (
    <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 text-2xl font-medium">
      {name.charAt(0)}
    </div>
  );
}

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);

  useEffect(() => {
    const all = getTherapists().sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
    setTherapists(all);
  }, []);

  function handleDelete(id: string, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;
    deleteTherapist(id);
    reload();
  }

  function reload() {
    const all = getTherapists().sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return 0;
    });
    setTherapists(all);
  }

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <h2 className="text-lg font-semibold text-stone-500 mb-0.5">師傅管理</h2>
      <h1 className="text-4xl font-bold text-stone-700 mb-6">Your Secret</h1>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <Link
          href="/therapists/new"
          className="text-sm font-medium text-white px-5 py-2 rounded-full"
          style={{ background: "#e8856a" }}
        >
          Add +
        </Link>
      </div>

      {therapists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-stone-400 text-sm">還沒有師傅資料</p>
          <Link
            href="/therapists/new"
            className="text-sm text-white px-5 py-2 rounded-full"
            style={{ background: "#e8856a" }}
          >
            新增師傅
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {therapists.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl overflow-hidden shadow-sm relative">
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
                <Link
                  href={`/therapists/${t.id}`}
                  className="text-sm font-medium text-white px-4 py-1.5 rounded-full shrink-0"
                  style={{ background: "#e8856a" }}
                >
                  編輯
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
