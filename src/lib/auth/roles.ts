import type { UserRole } from "@/lib/types/database.types";

export const ONBOARDING_PATH = "/escolher-perfil";

export function roleHome(role: UserRole | null | undefined) {
  switch (role) {
    case "admin":
      return "/admin";
    case "trainer":
      return "/dashboard";
    case "standard":
      return "/meu-plano";
    default:
      return "/aluno";
  }
}
