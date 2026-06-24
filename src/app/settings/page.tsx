"use client";

import { useRef, useState } from "react";

const KEYS = ["sh_therapists", "sh_appointments"];

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  function handleExport() {
    const data: Record<string, unknown> = {};
    for (const key of KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) data[key] = JSON.parse(raw);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `secret-hour-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash("✅ 備份下載完成！");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        for (const key of KEYS) {
          if (data[key]) localStorage.setItem(key, JSON.stringify(data[key]));
        }
        flash("✅ 資料還原成功！重新整理頁面即可看到。");
      } catch {
        flash("❌ 檔案格式錯誤，請選擇正確的備份檔。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <main className="flex-1 px-4 pt-10 pb-32">
      <h2 className="text-lg font-semibold text-stone-500 mb-0.5">設定</h2>
      <h1 className="text-4xl font-bold text-stone-700 mb-8">Settings</h1>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-stone-500">資料備份與還原</h2>
          <p className="text-xs text-stone-400 -mt-2">
            重新安裝 App 前請先匯出備份，安裝後再匯入還原。
          </p>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-white"
            style={{ background: "#e8856a" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 3v13M7 11l5 5 5-5M4 20h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            匯出備份
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium border border-stone-200 text-stone-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 21V8M7 13l5-5 5 5M4 4h16" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            匯入還原
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {msg && (
          <div className="bg-white rounded-2xl px-4 py-3 text-sm text-center text-stone-600 shadow-sm">
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}
