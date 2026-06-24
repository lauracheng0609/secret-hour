"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TherapistForm from "@/components/TherapistForm";

export default function NewTherapistPage() {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);

  function handleBack() {
    if (isDirty && !confirm("尚未儲存變更，是否確定要退出？")) return;
    router.push("/therapists");
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="text-stone-400 text-lg">‹</button>
        <h1 className="text-xl font-bold text-stone-800">新增師傅</h1>
      </div>
      <TherapistForm onDirtyChange={setIsDirty} />
    </main>
  );
}
