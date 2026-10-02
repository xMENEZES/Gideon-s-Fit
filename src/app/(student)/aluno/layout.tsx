import { createClient } from "@/lib/supabase/server";
import { SectionTabs } from "@/components/shared/section-tabs";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: student } = await supabase
    .from("students")
    .select("has_workout, has_diet")
    .eq("profile_id", user!.id)
    .single();

  const tabs = [
    (student?.has_workout ?? true) && { href: "/treino", label: "Protoc. Treino" },
    (student?.has_diet ?? true) && { href: "/dieta", label: "Protoc. Alimentar" },
  ].filter((tab): tab is { href: string; label: string } => Boolean(tab));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Meu plano</h1>
      {tabs.length > 0 && <SectionTabs basePath="/aluno" items={tabs} />}
      {children}
    </div>
  );
}
