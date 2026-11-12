import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { SectionTabs } from "@/components/shared/section-tabs";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  trainer: "Profissional",
  student: "Aluno de um time",
  standard: "Usuário Padrão",
};

// Perfil (antes "Minha conta"): duas opções em lista, "Meus Dados" (data de nascimento, altura e
// peso) e "Informações da Conta" (aviso de descanso e exclusão). O administrador não treina, então
// só tem "Informações da Conta".
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  const userId = await getSessionUserId();
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId!)
    .maybeSingle();

  const role = profile?.role ?? "standard";
  const email = account?.email ?? "";

  const tabs = [
    role !== "admin" && { href: "/dados", label: "Meus Dados" },
    { href: "/informacoes", label: "Informações da Conta" },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={roleHome(profile?.role)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.full_name} · {email} · {ROLE_LABEL[role]}
        </p>
      </div>

      <SectionTabs basePath="/conta" items={tabs} />

      {children}
    </div>
  );
}
