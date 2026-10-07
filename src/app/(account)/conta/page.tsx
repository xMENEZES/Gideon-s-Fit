import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSessionUserId } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { DeleteAccountForm } from "@/components/shared/delete-account-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  trainer: "Profissional",
  student: "Aluno de um time",
  standard: "Usuário Padrão",
};

export default async function ContaPage() {
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
      <Link
        href={roleHome(profile?.role)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha conta</h1>
        <p className="text-sm text-muted-foreground">
          {profile?.full_name} · {email} · {ROLE_LABEL[role]}
        </p>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Excluir minha conta</CardTitle>
          <CardDescription>
            A exclusão é definitiva e não pode ser desfeita. Serão apagados o seu cadastro e todos os
            dados associados: protocolos de treino e alimentares, refeições, cargas, registros e
            anotações.
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
              do time&quot; em Meu plano.
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
