import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.trim().length < 2) return NextResponse.json([]);

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=zh-TW&countrycodes=tw`;

  const res = await fetch(url, {
    headers: { "User-Agent": "SecretHourApp/1.0" },
  });

  if (!res.ok) return NextResponse.json([]);

  const data = await res.json();
  const results = data.map((item: { display_name: string }) => item.display_name);
  return NextResponse.json(results);
}
