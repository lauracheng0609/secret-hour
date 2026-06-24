"use client";

import Link from "next/link";
import TherapistForm from "@/components/TherapistForm";

export default function NewTherapistPage() {
  return (
    <main className="flex-1 px-4 pt-6 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/therapists" className="text-stone-400 text-lg">‹</Link>
        <h1 className="text-xl font-bold text-stone-800">新增師傅</h1>
      </div>
      <TherapistForm />
    </main>
  );
}
