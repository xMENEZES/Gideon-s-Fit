import { SectionTabs } from "@/components/shared/section-tabs";
import { BottomNav } from "@/components/shared/bottom-nav";

export default function MeuPlanoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTabs
        desktopOnly
        basePath="/meu-plano"
        items={[
          { href: "/treino", label: "Prot. Treino" },
          { href: "/dieta", label: "Prot. Alimentar" },
          { href: "/status", label: "Status" },
          { href: "/time", label: "Entrar no Time" },
        ]}
      />
      {children}
      <BottomNav
        basePath="/meu-plano"
        items={[
          { href: "/treino", label: "Treino", icon: "treino" },
          { href: "/dieta", label: "Alimentar", icon: "dieta" },
          { href: "/status", label: "Status", icon: "status" },
          { href: "/time", label: "Time", icon: "time" },
        ]}
      />
    </div>
  );
}
