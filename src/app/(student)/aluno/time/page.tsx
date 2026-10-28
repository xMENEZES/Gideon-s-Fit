import { LeaveTeamButton } from "@/components/shared/leave-team-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlunoTimePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu time</CardTitle>
        <CardDescription>
          Você faz parte do time do seu profissional, que monta e acompanha os seus protocolos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Se quiser deixar o time e manter a conta, use o botão abaixo. Os protocolos que o profissional
          montou, com o histórico, serão apagados e o seu plano próprio volta a ficar disponível.
        </p>
        <div>
          <LeaveTeamButton />
        </div>
      </CardContent>
    </Card>
  );
}
