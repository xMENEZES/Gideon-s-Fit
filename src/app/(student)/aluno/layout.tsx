import { getOwnTeamStudent } from "@/lib/data/students";
import { SectionTabs } from "@/components/shared/section-tabs";
import { BottomNav, type BottomNavItem } from "@/components/shared/bottom-nav";

type Tab = { href: string; label: string; nav: string; icon: BottomNavItem["icon"] };

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const student = await getOwnTeamStudent();

  const tabs = [
    (student?.has_workout ?? true) && { href: "/treino", label: "Prot. Treino", nav: "Treino", icon: "treino" },
    (student?.has_diet ?? true) && { href: "/dieta", label: "Prot. Alimentar", nav: "Alimentar", icon: "dieta" },
    { href: "/status", label: "Status", nav: "Status", icon: "status" },
    { href: "/time", label: "Time", nav: "Time", icon: "time" },
  ].filter((tab): tab is Tab => Boolean(tab));

  return (
    <div className="flex flex-col gap-6">
      <SectionTabs
        desktopOnly
        basePath="/aluno"
        items={tabs.map(({ href, label }) => ({ href, label }))}
      />
      {children}
      <BottomNav basePath="/aluno" items={tabs.map(({ href, nav, icon }) => ({ href, label: nav, icon }))} />
    </div>
  );
}
