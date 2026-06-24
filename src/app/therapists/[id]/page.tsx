"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTherapists, deleteTherapist, saveTherapistMemo } from "@/lib/storage";
import { Therapist } from "@/lib/types";
import TherapistForm from "@/components/TherapistForm";

export default function EditTherapistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [memo, setMemo] = useState("");
  const [memoSaved, setMemoSaved] = useState(false);

  useEffect(() => {
    const found = getTherapists().find((t) => t.id === id) ?? null;
    setTherapist(found);
    setMemo(found?.memo ?? "");
  }, [id]);

  function handleBack() {
    if (isDirty && !confirm("尚未儲存變更，是否確定要退出？")) return;
    router.push("/therapists");
  }

  function handleDelete() {
    if (!therapist) return;
    if (!confirm(`確定要刪除「${therapist.name}」嗎？`)) return;
    deleteTherapist(id);
    router.push("/therapists");
  }

  if (!therapist) return <p className="p-6 text-stone-400 text-sm">找不到師傅資料</p>;

  return (
    <main className="flex-1 px-4 pt-6 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="text-stone-400 text-lg">‹</button>
        <h1 className="text-xl font-bold text-stone-800">編輯師傅</h1>
      </div>
      <TherapistForm initial={therapist} onDirtyChange={setIsDirty} />

      {/* Memo */}
      <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-purple-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-stone-500">📝 專屬備忘錄</h2>
          {memoSaved && <span className="text-[10px] text-purple-400">已儲存</span>}
        </div>
        <textarea
          value={memo}
          onChange={(e) => { setMemo(e.target.value); setMemoSaved(false); }}
          onBlur={() => { saveTherapistMemo(id, memo); setMemoSaved(true); }}
          placeholder={"他喜歡的話題、偏好、上次聊到的事…\n寫下來讓每次見面更特別 ♥"}
          rows={5}
          className="w-full text-sm text-stone-600 placeholder:text-stone-300 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      <button
        onClick={handleDelete}
        className="w-full mt-4 py-3 text-sm text-red-400 text-center"
      >
        刪除這位師傅
      </button>
    </main>
  );
}
