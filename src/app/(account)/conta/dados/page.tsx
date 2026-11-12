import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { getMyBodyData } from "@/lib/data/body-data";
import { BodyDataForm, type BodyDataAudience } from "@/components/shared/body-data-form";

export default async function ContaDadosPage() {
  const profile = await getProfile();
  // O administrador não treina: não tem dados corporais.
  if (profile?.role === "admin") redirect("/conta/informacoes");

  const data = await getMyBodyData();
  const audience: BodyDataAudience =
    profile?.role === "student" ? "student" : profile?.role === "trainer" ? "trainer" : "standard";

  return (
    <BodyDataForm
      // Recria o formulário quando os dados mudam (salvar, apagar), para ele mostrar o valor atual.
      key={data?.updated_at ?? "novo"}
      initial={
        data
          ? {
              birthDate: data.birth_date,
              heightCm: data.height_cm,
              weightKg: data.weight_kg,
              consentedAt: data.consented_at,
            }
          : null
      }
      audience={audience}
    />
  );
}
