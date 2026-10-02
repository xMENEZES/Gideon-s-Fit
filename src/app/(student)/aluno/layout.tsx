import { createClient } from "@/lib/supabase/server";
import { getSessionUserId } from "@/lib/auth/session";
import { LeaveTeamButton } from "@/components/shared/leave-team-button";
import { SectionTabs } from "@/components/shared/section-tabs";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const userId = await getSessionUserId();

  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("profile_id", userId!)
    .neq("trainer_id", userId!)
    .single();

  const tabs = [
    (student?.has_workout ?? true) && { href: "/treino", label: "Protoc. Treino" },
    (student?.has_diet ?? true) && { href: "/dieta", label: "Protoc. Alimentar" },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Meu plano</h1>
        <LeaveTeamButton />
      </div>
      {tabs.length > 0 && <SectionTabs basePath="/aluno" items={tabs} />}
      {children}
    </div>
  );
}
