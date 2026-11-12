import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { DeleteAccountForm } from "@/components/shared/delete-account-form";
import { PushSettingsCard } from "@/components/shared/push-settings-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// "Informações da Conta": aviso de descanso e exclusão da conta. O cabeçalho (nome, e-mail, perfil e as
// opções Meus Dados / Informações da Conta) vem do layout do Perfil.
export default async function ContaInformacoesPage() {
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

  return (
    <div className="flex flex-col gap-6">
      {(role === "student" || role === "standard") && <PushSettingsCard />}

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Excluir minha conta</CardTitle>
          <CardDescription>
            A exclusão é definitiva e não pode ser desfeita. Serão apagados o seu cadastro e todos os
            dados associados: protocolos de treino e alimentares, refeições, cargas, registros,
            anotações e os seus dados pessoais (data de nascimento, altura e peso).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {role === "trainer" && (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Os alunos do seu time continuam com a conta deles e voltam a ser Usuários Padrão. O que
              você montou para eles (protocolos do time) e os seus modelos serão apagados.
            </p>
          )}
          {role === "student" && (
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Se você só quer deixar o time do seu profissional e manter a conta, use o botão &quot;Sair
              do time&quot; na aba Time.
            </p>
          )}
          {role === "admin" ? (
            <p className="text-sm text-muted-foreground">
              A conta de administrador não pode ser excluída por aqui.
            </p>
          ) : (
            <DeleteAccountForm email={email} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
