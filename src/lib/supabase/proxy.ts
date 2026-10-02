import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";

const TRAINER_HOME = "/dashboard";
const STUDENT_HOME = "/aluno";
const STANDARD_HOME = "/meu-plano";
const ADMIN_HOME = "/admin";
const PUBLIC_PATHS = ["/login", "/cadastro", "/esqueci-senha", "/auth/callback", "/auth/confirm"];
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

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!userId) {
    if (
      pathname.startsWith(TRAINER_HOME) ||
      pathname.startsWith(STUDENT_HOME) ||
      pathname.startsWith(STANDARD_HOME) ||
      pathname.startsWith(ADMIN_HOME)
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Só precisa do papel para decidir a home de quem cai na raiz ou numa página
  // pública. As áreas protegidas validam o papel nos próprios layouts (e
  // redirecionam), então não gastamos uma consulta ao banco em cada navegação.
  const isAuthReturn = pathname.startsWith("/auth/");
  const needsHome = pathname === "/" || (isPublicPath && !isAuthReturn);
  if (!needsHome) return supabaseResponse;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", userId)
    .single();

  const home = profile?.onboarded === false ? ONBOARDING_PATH : roleHome(profile?.role);

  return NextResponse.redirect(new URL(home, request.url));
}
