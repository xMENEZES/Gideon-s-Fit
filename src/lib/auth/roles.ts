import type { UserRole } from "@/lib/types/database.types";

export const ONBOARDING_PATH = "/escolher-perfil";

// Cookie com a dica da home do usuário (ver lib/supabase/proxy.ts); apagado ao sair.
export const HOME_HINT_COOKIE = "gf_home";

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
