import { SectionTabs } from "@/components/shared/section-tabs";

export default function MeuPlanoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Meu plano</h1>
      <SectionTabs
        basePath="/meu-plano"
        items={[
          { href: "/treino", label: "Protoc. Treino" },
          { href: "/dieta", label: "Protoc. Alimentar" },
          { href: "/time", label: "Entrar no Time" },
        ]}
      />
      {children}
    </div>
  );
}
