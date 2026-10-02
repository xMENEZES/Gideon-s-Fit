import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";

const TRAINER_HOME = "/dashboard";
const STUDENT_HOME = "/aluno";
const ADMIN_HOME = "/admin";
const PUBLIC_PATHS = ["/login", "/cadastro", "/auth/callback"];
// /definir-senha fica de fora de propósito: quem clica no link de convite já
// chega autenticado (sessão criada antes de definir a senha), então não pode
// ser tratada como "página pública" — senão o redirect abaixo manda a pessoa
// direto pra home do papel dela antes de completar o cadastro.

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user) {
    if (
      pathname.startsWith(TRAINER_HOME) ||
      pathname.startsWith(STUDENT_HOME) ||
      pathname.startsWith(ADMIN_HOME)
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Usuário autenticado: descobre o role para redirecionar para a área correta
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const home =
    profile?.role === "admin"
      ? ADMIN_HOME
      : profile?.role === "trainer"
        ? TRAINER_HOME
        : STUDENT_HOME;

  if (pathname === "/" || (isPublicPath && pathname !== "/auth/callback")) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  const inWrongArea =
    (pathname.startsWith(TRAINER_HOME) && profile?.role !== "trainer") ||
    (pathname.startsWith(STUDENT_HOME) && profile?.role !== "student") ||
    (pathname.startsWith(ADMIN_HOME) && profile?.role !== "admin");

  if (inWrongArea) {
    return NextResponse.redirect(new URL(home, request.url));
  }

  return supabaseResponse;
}
