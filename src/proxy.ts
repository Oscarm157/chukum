import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { KB_COOKIE, expectedToken, constantTimeEqual } from "@/lib/campus-gate";

// Guard de borde SOLO para /campus. El resto del sitio corporativo es publico y
// no pasa por aqui (ver matcher). Sin cookie de acceso valida, cualquier ruta de
// /campus redirige a /campus/acceso. Las rutas de acceso se dejan pasar siempre.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deja pasar la pantalla de contrasena y su endpoint de unlock.
  if (pathname === "/campus/acceso" || pathname === "/campus/acceso/unlock") {
    return NextResponse.next();
  }

  const expected = await expectedToken();
  const cookie = req.cookies.get(KB_COOKIE)?.value;

  if (expected && cookie && constantTimeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/campus/acceso";
  url.search = "";
  return NextResponse.redirect(url);
}

// El matcher solo cubre /campus y /campus/**. Ninguna otra ruta del sitio pasa
// por el guard.
export const config = {
  matcher: ["/campus", "/campus/:path*"],
};
