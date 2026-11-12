// Traduz erros do Supabase Auth em frases para a pessoa. Funções puras, testadas em auth-errors.test.ts.

type AuthLikeError = { status?: number; code?: string } | null | undefined;

export const CAPTCHA_MESSAGE = "Não foi possível confirmar a verificação de segurança. Tente de novo.";
export const RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";

// Erros do Auth em cadastro, definição e redefinição de senha e pedido de nova senha. `fallback` vale
// para os demais casos.
export function passwordErrorMessage(error: AuthLikeError, fallback: string): string {
  if (!error) return fallback;
  if (error.code === "captcha_failed") return CAPTCHA_MESSAGE;
  if (error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return RATE_LIMIT_MESSAGE;
  }
  if (error.code === "weak_password") {
    return "Essa senha não atende às regras de segurança. Use letras maiúsculas e minúsculas, número e símbolo.";
  }
  if (error.code === "same_password") return "A nova senha precisa ser diferente da senha atual.";
  return fallback;
}
