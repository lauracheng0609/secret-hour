"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getTherapists, deleteTherapist } from "@/lib/storage";
import { Therapist } from "@/lib/types";
import TherapistForm from "@/components/TherapistForm";

export default function EditTherapistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [therapist, setTherapist] = useState<Therapist | null>(null);

  useEffect(() => {
    const found = getTherapists().find((t) => t.id === id) ?? null;
    setTherapist(found);
  }, [id]);

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
        <Link href="/therapists" className="text-stone-400 text-lg">‹</Link>
        <h1 className="text-xl font-bold text-stone-800">編輯師傅</h1>
      </div>
      <TherapistForm initial={therapist} />
      <button
        onClick={handleDelete}
        className="w-full mt-4 py-3 text-sm text-red-400 text-center"
      >
        刪除這位師傅
      </button>
    </main>
  );
}
