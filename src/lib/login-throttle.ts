// Atraso progressivo nas tentativas de login (proteção contra força bruta). Funções puras, testadas
// em login-throttle.test.ts (este arquivo vale também para o navegador; o que usa criptografia do
// servidor está em login-throttle-keys.ts). A contagem e a espera ficam no banco (migração 0035); a rota
// /api/auth/login junta tudo. Veja docs/dev/senha-e-login.md.

type Counter = {
  // a cada quantas tentativas (ou erros) sobe um degrau de espera
  step: number;
  // segundos sem nova tentativa para o contador zerar
  decay: number;
  // esperas, em segundos, de cada degrau; depois do último repete o último
  schedule: number[];
  // true: conta na própria tentativa (e já barra as paralelas); false: conta só depois do erro
  count_now: boolean;
};

// Ordem fixa: [ip, e-mail+ip, e-mail]. A mesma ordem vale nas chaves e na função do banco.
export const LOGIN_THROTTLE_POLICY: [Counter, Counter, Counter] = [
  // Erros vindos do mesmo IP, em qualquer e-mail (quem testa muitos e-mails). Limite alto porque
  // várias pessoas podem dividir um IP (a rede de uma academia, por exemplo).
  { step: 20, decay: 60 * 60, schedule: [60, 5 * 60, 15 * 60, 60 * 60], count_now: false },
  // Mesmo e-mail, mesmo IP: o contador principal. 3 tentativas -> 1 min, 6 -> 5 min, 9 -> 15 min,
  // 12 em diante -> 1 h.
  { step: 3, decay: 24 * 60 * 60, schedule: [60, 5 * 60, 15 * 60, 60 * 60], count_now: true },
  // Mesmo e-mail, de qualquer IP (ataque vindo de vários IPs). Limite alto e espera curta, para
  // ninguém conseguir travar a conta de outra pessoa por muito tempo.
  { step: 10, decay: 60 * 60, schedule: [60, 5 * 60, 15 * 60], count_now: true },
];

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// "1:00", "0:45", "15:00", "1:00:00" para mostrar a contagem regressiva.
export function formatWait(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`;
}

export const LOCKED_MESSAGE = "Muitas tentativas de login.";
export const INVALID_MESSAGE = "Email ou senha inválidos.";
export const CAPTCHA_FAILED_MESSAGE = "Não foi possível confirmar a verificação de segurança. Tente de novo.";
export const RATE_LIMITED_MESSAGE = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

export type LoginResponse =
  | { ok: true }
  | { ok: false; error: "invalid" | "locked" | "rate_limited" | "captcha" | "bad_request"; retryAfter?: number };
