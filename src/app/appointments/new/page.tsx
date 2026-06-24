"use client";

import Link from "next/link";
import AppointmentForm from "@/components/AppointmentForm";

export default function NewAppointmentPage() {
  return (
    <main className="flex-1 px-4 pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-stone-400 text-lg">‹</Link>
        <h1 className="text-xl font-bold text-stone-800">新增預約</h1>
      </div>
      <AppointmentForm />
    </main>
  );
}
