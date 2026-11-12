import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validations/auth.schema";
import { LOGIN_THROTTLE_POLICY, type LoginResponse } from "@/lib/login-throttle";
import { clientIp, throttleKeys } from "@/lib/login-throttle-keys";

// Login por e-mail e senha com atraso progressivo nas tentativas (proteção contra força bruta).
// O navegador chama esta rota em vez de falar direto com o Supabase, para que a espera seja imposta
// no servidor. A sessão volta por cookie, como antes. O login com Google não passa por aqui.
// Veja docs/dev/senha-e-login.md.

// O navegador manda o cabeçalho Origin nos pedidos de outro site; recusa se não for o nosso.
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function reply(body: LoginResponse, status: number) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if ("retryAfter" in body && body.retryAfter) headers["Retry-After"] = String(body.retryAfter);
  return Response.json(body, { status, headers });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return reply({ ok: false, error: "bad_request" }, 403);

  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ ok: false, error: "bad_request" }, 400);
  const { email, password } = parsed.data;

  const keys = throttleKeys(email, clientIp(request.headers), process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");
  const [ipKey, eiKey, emKey] = keys;
  const admin = createAdminClient();

  // Se o contador falhar (banco fora do ar, migração ainda não rodada), o login segue sem ele: as
  // pessoas não ficam sem entrar, e o limite do próprio Supabase continua valendo.
  let throttleOk = true;
  let waitAfter = 0;
  const begin = await admin.rpc("login_throttle_begin", { p_keys: keys, p_policy: LOGIN_THROTTLE_POLICY });
  if (begin.error) {
    throttleOk = false;
    console.error("login_throttle_begin falhou:", begin.error.code);
  } else {
    const row = begin.data?.[0];
    if (row?.blocked) return reply({ ok: false, error: "locked", retryAfter: row.wait_seconds }, 429);
    waitAfter = row?.wait_seconds ?? 0;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) {
    if (throttleOk) {
      const cleared = await admin.rpc("login_throttle_clear", { p_keys: [eiKey, emKey] });
      if (cleared.error) console.error("login_throttle_clear falhou:", cleared.error.code);
    }
    return reply({ ok: true }, 200);
  }

  if (error.status === 429) return reply({ ok: false, error: "rate_limited" }, 429);

  // Só erro de e-mail ou senha conta contra o IP; falha do servidor ou e-mail por confirmar, não.
  let retryAfter = waitAfter;
  if (error.code === "invalid_credentials" && throttleOk) {
    const [ip] = LOGIN_THROTTLE_POLICY;
    const failed = await admin.rpc("login_throttle_fail", {
      p_key: ipKey,
      p_step: ip.step,
      p_decay: ip.decay,
      p_schedule: ip.schedule,
    });
    if (failed.error) console.error("login_throttle_fail falhou:", failed.error.code);
    else retryAfter = Math.max(retryAfter, failed.data ?? 0);
  }
  return reply({ ok: false, error: "invalid", retryAfter: retryAfter || undefined }, 401);
}
