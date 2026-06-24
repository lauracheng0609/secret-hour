"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAppointments } from "@/lib/storage";
import { Appointment } from "@/lib/types";
import AppointmentForm from "@/components/AppointmentForm";

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDirty, setIsDirty] = useState(false);
  const [template, setTemplate] = useState<Appointment | undefined>(undefined);

  useEffect(() => {
    const copyFrom = searchParams.get("copyFrom");
    if (copyFrom) {
      const source = getAppointments().find((a) => a.id === copyFrom);
      if (source) {
        setTemplate({ ...source, date: "", time: "", location: "" });
      }
    }
  }, []);

  function handleBack() {
    if (isDirty && !confirm("尚未儲存變更，是否確定要退出？")) return;
    router.push("/");
  }

  return (
    <main className="flex-1 px-4 pt-6 pb-36">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="text-stone-400 text-lg">‹</button>
        <h1 className="text-xl font-bold text-stone-800">
          {template ? `再約 ${template.therapistName}` : "新增預約"}
        </h1>
      </div>
      <AppointmentForm initial={template} onDirtyChange={setIsDirty} />
    </main>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <NewAppointmentContent />
    </Suspense>
  );
}
