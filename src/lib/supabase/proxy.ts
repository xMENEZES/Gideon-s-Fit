import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types/database.types";
import { HOME_BY_KEY, HOME_HINT_COOKIE, ONBOARDING_PATH, homeKeyOf, roleHome } from "@/lib/auth/roles";
import { SUPABASE_JWKS } from "@/lib/supabase/jwks";

const TRAINER_HOME = "/dashboard";
const STUDENT_HOME = "/aluno";
const STANDARD_HOME = "/meu-plano";
const ADMIN_HOME = "/admin";
const ACCOUNT_PATH = "/conta";
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

  const { data: claimsData } = await supabase.auth.getClaims(undefined, { jwks: SUPABASE_JWKS });
  const userId = claimsData?.claims?.sub;
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!userId) {
    if (
      pathname.startsWith(TRAINER_HOME) ||
      pathname.startsWith(STUDENT_HOME) ||
      pathname.startsWith(STANDARD_HOME) ||
      pathname.startsWith(ADMIN_HOME) ||
      pathname === ACCOUNT_PATH ||
      pathname.startsWith(`${ACCOUNT_PATH}/`)
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

  // Dica da home já descoberta (cookie): evita a ida ao banco no momento da abertura do app.
  // É só uma dica de navegação, sem valor de segurança: os layouts de cada área validam o papel.
  const hinted = readHomeHint(request.cookies.get(HOME_HINT_COOKIE)?.value, userId);
  if (hinted) {
    // Na abertura do app (raiz) mostra a tela estática de abertura, que responde na hora mesmo com
    // o servidor frio, e ela leva à home. Nas páginas públicas (login etc.) segue o redirect direto.
    const key = pathname === "/" ? homeKeyOf(hinted) : null;
    return key ? rewriteTo(`/abrindo/${key}`, request, supabaseResponse) : redirectTo(hinted, request, supabaseResponse);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", userId)
    .single();

  const home = profile?.onboarded === false ? ONBOARDING_PATH : roleHome(profile?.role);
  const response = redirectTo(home, request, supabaseResponse);
  // Só guarda a home definitiva; o perfil ainda não escolhido (onboarding) é consultado de novo.
  if (profile && home !== ONBOARDING_PATH) {
    response.cookies.set(HOME_HINT_COOKIE, `${userId}|${home}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: HOME_HINT_MAX_AGE,
    });
  }
  return response;
}

const HOME_HINT_MAX_AGE = 60 * 60 * 24 * 30;
const KNOWN_HOMES = new Set<string>(Object.values(HOME_BY_KEY));

// O cookie guarda "<id do usuário>|<home>": vale só para o mesmo usuário e para homes conhecidas.
function readHomeHint(value: string | undefined, userId: string): string | null {
  if (!value) return null;
  const [owner, home] = value.split("|");
  return owner === userId && KNOWN_HOMES.has(home) ? home : null;
}

// Serve outra página no mesmo endereço, levando junto os cookies da sessão renovada.
function rewriteTo(path: string, request: NextRequest, session: NextResponse) {
  const response = NextResponse.rewrite(new URL(path, request.url), { request });
  session.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

// Redireciona levando junto os cookies da sessão renovada pelo Supabase (um redirect novo
// perderia o refresh e a próxima requisição renovaria a sessão de novo).
function redirectTo(path: string, request: NextRequest, session: NextResponse) {
  const response = NextResponse.redirect(new URL(path, request.url));
  session.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
