import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../../../lib/api";

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key) return NextResponse.json({ message: "Choose a file" }, { status: 400 });
    const response = await apiFetch(`/storage/download?key=${encodeURIComponent(key)}`);
    const data = await response.json();
    if (!response.ok) return NextResponse.json(data, { status: response.status });
    const result = NextResponse.redirect(data.url);
    result.headers.set("Cache-Control", "no-store");
    result.headers.set("Referrer-Policy", "no-referrer");
    return result;
  } catch {
    return NextResponse.json({ message: "Unable to download your file. Try again." }, { status: 503 });
  }
}
