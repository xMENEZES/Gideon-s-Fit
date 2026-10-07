import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy em modo de BLOQUEIO (medida em 07/10/2026 nos 4 papéis, sem
// violações além do teste de `eval` do zod, que é capturado e inofensivo). Para voltar a só
// registrar sem bloquear, troque o nome do cabeçalho para "Content-Security-Policy-Report-Only".
//  - 'unsafe-inline' em script/style é exigido pelos scripts embutidos do Next.js e pelo
//    estilo do Tailwind; o próximo passo de endurecimento é usar nonces.
//  - connect-src libera o Supabase (API e tempo real); frame-src libera só o YouTube.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // Impede o app de ser embutido em outro site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Impede o navegador de "adivinhar" o tipo de um arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Não vaza a URL completa (que pode ter parâmetros) para outros sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O app não usa nenhum desses recursos do aparelho.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
