// Chaves do contador de login e IP do cliente. Só para o servidor (usa criptografia do Node). Testado
// em login-throttle.test.ts.

import { createHmac } from "node:crypto";
import { normalizeEmail } from "@/lib/login-throttle";

// Chaves guardadas no banco: hashes (HMAC) do e-mail e do IP, nunca os valores. A chave do HMAC é
// segredo do servidor, então a tabela sozinha não revela e-mails nem IPs.
export function throttleKeys(email: string, ip: string, secret: string): [string, string, string] {
  const h = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  const e = h(`email:${normalizeEmail(email)}`);
  const i = h(`ip:${ip}`);
  return [`ip:${i}`, `ei:${h(`${e}|${i}`)}`, `em:${e}`];
}

// O IP do cliente como a Vercel informa (ela preenche estes cabeçalhos, não o navegador).
export function clientIp(headers: Pick<Headers, "get">): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "desconhecido";
}
