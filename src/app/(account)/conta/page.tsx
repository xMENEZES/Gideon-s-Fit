import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";

// /conta continua valendo (links antigos, atalhos e a proteção de rotas): leva para a primeira
// opção do Perfil. O administrador não tem "Meus Dados".
export default async function ContaPage() {
  const profile = await getProfile();
  redirect(profile?.role === "admin" ? "/conta/informacoes" : "/conta/dados");
}
