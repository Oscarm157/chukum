import { NextRequest, NextResponse } from "next/server";
import { KB_COOKIE, expectedToken, tokenFor, constantTimeEqual } from "@/lib/campus-gate";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");
  const expected = await expectedToken();

  const dest = new URL("/campus", req.url);

  if (!expected || !constantTimeEqual(await tokenFor(submitted), expected)) {
    const back = new URL("/campus/acceso", req.url);
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  // Solo marca Secure si la conexion es https real. Sobre http (preview por IP
  // del VPS, localhost sin TLS) el navegador rechazaria una cookie Secure y el
  // login quedaria en loop aunque la contrasena sea correcta.
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const isHttps = proto === "https";

  const res = NextResponse.redirect(dest, { status: 303 });
  res.cookies.set(KB_COOKIE, expected, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/campus",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
