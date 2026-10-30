import type { UserRole } from "@/lib/types/database.types";

export const ONBOARDING_PATH = "/escolher-perfil";

// Cookie com a dica da home do usuário (ver lib/supabase/proxy.ts); apagado ao sair.
export const HOME_HINT_COOKIE = "gf_home";

// Homes que a dica pode guardar, cada uma com a chave usada na tela de abertura (/abrindo/<chave>).
export const HOME_BY_KEY = {
  admin: "/admin",
  painel: "/dashboard",
  plano: "/meu-plano/treino",
  aluno: "/aluno/treino",
} as const;

export type HomeKey = keyof typeof HOME_BY_KEY;

export function homeKeyOf(home: string): HomeKey | null {
  const entry = Object.entries(HOME_BY_KEY).find(([, path]) => path === home);
  return entry ? (entry[0] as HomeKey) : null;
}

// Destino final de cada papel. Aponta direto para a tela de abertura (e não para uma rota que só
// redireciona): cada salto a mais renderiza o layout e consulta o perfil só para redirecionar.
export function roleHome(role: UserRole | null | undefined) {
  switch (role) {
    case "admin":
      return "/admin";
    case "trainer":
      return "/dashboard";
    case "standard":
      return "/meu-plano/treino";
    default:
      return "/aluno/treino";
  }
}
