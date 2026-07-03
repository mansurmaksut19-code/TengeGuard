import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("tg_user_id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 0
  });
  return response;
}
