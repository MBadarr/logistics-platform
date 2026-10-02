import { NextRequest, NextResponse } from "next/server";

const postActions = new Set([
  "signup",
  "login",
  "forgot-password",
  "reset-password",
  "logout",
]);

async function forward(
  request: NextRequest,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params;
  if (
    (request.method === "GET" && action !== "me") ||
    (request.method === "POST" && !postActions.has(action))
  ) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (request.method === "POST") {
    if (
      request.headers.get("origin") !== request.nextUrl.origin ||
      request.headers.get("sec-fetch-site") === "cross-site"
    ) {
      return NextResponse.json(
        { message: "Request origin is not allowed" },
        { status: 403 },
      );
    }
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return NextResponse.json(
        { message: "Use a JSON request body" },
        { status: 415 },
      );
    }
  }
  const body = request.method === "POST" ? await request.text() : undefined;
  if (body && Buffer.byteLength(body) > 16_384)
    return NextResponse.json(
      { message: "Request is too large" },
      { status: 413 },
    );
  try {
    const response = await fetch(
      new URL(
        `/auth/${action}`,
        process.env.API_URL ?? "http://localhost:3002",
      ),
      {
        method: request.method,
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") ?? "",
          ...(request.headers.get("origin")
            ? { Origin: request.headers.get("origin")! }
            : {}),
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      },
    );
    const result = new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
    for (const cookie of response.headers.getSetCookie())
      result.headers.append("Set-Cookie", cookie);
    return result;
  } catch {
    return NextResponse.json(
      { message: "We cannot reach the server right now. Please try again." },
      { status: 503 },
    );
  }
}
export const GET = forward;
export const POST = forward;
