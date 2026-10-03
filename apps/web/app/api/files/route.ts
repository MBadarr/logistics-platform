import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "../../../lib/api";

async function forward(request: NextRequest) {
  if (request.method === "POST" && (
    request.headers.get("origin") !== request.nextUrl.origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )) return NextResponse.json({ message: "Request origin is not allowed" }, { status: 403 });
  try {
    let body: ArrayBuffer | undefined;
    if (request.method === "POST") {
      if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
        return NextResponse.json({ message: "Use a file upload form" }, { status: 415 });
      const reader = request.body?.getReader();
      if (!reader) return NextResponse.json({ message: "Choose a file" }, { status: 400 });
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        length += chunk.value.byteLength;
        if (length > 10 * 1024 * 1024 + 65_536) {
          await reader.cancel();
          return NextResponse.json({ message: "Files must be 10 MB or smaller" }, { status: 413 });
        }
        chunks.push(chunk.value);
      }
      body = new Uint8Array(Buffer.concat(chunks)).buffer;
    }
    const cursor = request.nextUrl.searchParams.get("cursor");
    const path = "/storage/files" + (cursor ? `?cursor=${encodeURIComponent(cursor)}` : "");
    const response = await apiFetch(path, {
      method: request.method,
      ...(body ? { body, headers: { "Content-Type": request.headers.get("content-type")! } } : {}),
    });
    return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "File storage is temporarily unavailable. Try again." }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
