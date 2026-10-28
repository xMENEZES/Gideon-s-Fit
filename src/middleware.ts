import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Este é o portão de login. Fica em `middleware.ts` (e não em `proxy.ts`) de propósito: o `proxy`
// do Next 16 só roda em Node.js e, na Vercel, cada partida fria dele custava mais de 1 s na
// abertura do app. O `middleware` roda por padrão na borda (edge), com partida fria de dezenas
// de ms; por isso não há `config.runtime` (o Next 16 só aceita "experimental-edge" ali).
// O Next 16 marca `middleware` como obsoleto, mas ainda o aceita e é a forma indicada na
// documentação para manter o runtime edge. Para voltar ao Node, renomeie para `proxy.ts` e
// troque o nome da função para `proxy`.
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
