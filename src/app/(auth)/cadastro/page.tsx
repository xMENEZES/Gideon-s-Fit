import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CadastroPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro por convite</CardTitle>
        <CardDescription>
          Novas contas de profissional são criadas apenas pelo administrador da plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Se você já foi convidado, verifique seu email para definir a senha e acessar. Caso
          contrário, entre em contato com o administrador para solicitar seu acesso.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full" nativeButton={false} render={<Link href="/login" />}>
          Ir para o login
        </Button>
      </CardFooter>
    </Card>
  );
}
