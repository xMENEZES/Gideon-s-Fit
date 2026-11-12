"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// CAPTCHA do Cloudflare Turnstile para o login, o cadastro e o "esqueci a senha". O token que o
// widget gera vale uma vez só e vai ao Supabase (opção captchaToken), que confere com a Cloudflare.
// Sem NEXT_PUBLIC_TURNSTILE_SITE_KEY o widget não aparece e nada muda (é assim que o código pode ir ao
// ar antes de o CAPTCHA ser ligado no Supabase). Veja docs/dev/captcha.md.

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile ausente")));
    script.onerror = () => {
      scriptPromise = null; // permite tentar de novo
      reject(new Error("falha ao carregar o Turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Estado do CAPTCHA de um formulário. `ready` libera o botão de enviar: sempre true quando o CAPTCHA
// está desligado; com ele ligado, só depois que o widget entregar um token. O token vale uma vez,
// então chame `reset()` depois de cada envio.
export function useCaptcha() {
  const enabled = SITE_KEY !== "";
  const [token, setToken] = useState<string | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const reset = useCallback(() => {
    setToken(null);
    setResetSignal((n) => n + 1);
  }, []);
  return { enabled, token, setToken, resetSignal, reset, ready: !enabled || token !== null };
}

export type Captcha = ReturnType<typeof useCaptcha>;

export function TurnstileWidget({ captcha }: { captcha: Captcha }) {
  const { enabled, setToken, resetSignal } = captcha;
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled || !container.current) return;
    const el = container.current;
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(el, {
          sitekey: SITE_KEY,
          // Só mostra algo quando a Cloudflare precisa de uma interação; senão resolve sozinho.
          appearance: "interaction-only",
          theme: "auto",
          language: "pt-br",
          callback: (value: string) => {
            setFailed(false);
            setToken(value);
          },
          "expired-callback": () => setToken(null),
          "error-callback": () => {
            setToken(null);
            setFailed(true);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [enabled, setToken]);

  // Depois de cada envio o token é descartado e o widget gera outro.
  useEffect(() => {
    if (resetSignal > 0 && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetSignal]);

  if (!enabled) return null;
  return (
    <div className="flex flex-col gap-2">
      <div ref={container} />
      {failed && (
        <p className="text-sm text-destructive">
          Não foi possível carregar a verificação de segurança. Desative bloqueadores de anúncio para este site
          ou recarregue a página.
        </p>
      )}
    </div>
  );
}
