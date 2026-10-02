import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { ProfileChoice } from "@/components/shared/profile-choice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EscolherPerfilPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect(roleHome(profile.role));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Como você vai usar o app?</CardTitle>
        <CardDescription>Escolha o tipo de perfil para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileChoice />
      </CardContent>
    </Card>
  );
}
