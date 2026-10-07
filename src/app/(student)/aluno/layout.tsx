import { getOwnTeamStudent } from "@/lib/data/students";
import { LeaveTeamButton } from "@/components/shared/leave-team-button";
import { SectionTabs } from "@/components/shared/section-tabs";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const student = await getOwnTeamStudent();

  const tabs = [
    (student?.has_workout ?? true) && { href: "/treino", label: "Prot. Treino" },
    (student?.has_diet ?? true) && { href: "/dieta", label: "Prot. Alimentar" },
    { href: "/status", label: "Status" },
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
