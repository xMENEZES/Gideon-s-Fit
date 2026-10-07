import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { ONBOARDING_PATH, roleHome } from "@/lib/auth/roles";
import { TopBar } from "@/components/shared/top-bar";

// Área "Minha conta": vale para todos os perfis (profissional, aluno, Usuário Padrão e admin).
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect(ONBOARDING_PATH);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar fullName={profile.full_name} homeHref={roleHome(profile.role)} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
