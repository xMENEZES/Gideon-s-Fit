import Link from "next/link";
import { Dumbbell } from "lucide-react";

export const metadata = {
  title: "Como excluir sua conta | Gideon's Fit",
  description: "Passo a passo para excluir a sua conta e os dados do Gideon's Fit.",
};

const CONTACT_EMAIL = "gabrielprojects97@gmail.com";

export default function ExcluirContaPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2 text-brand">
          <Dumbbell className="size-6" strokeWidth={2.5} />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Gideon&apos;s Fit
          </span>
        </Link>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Como excluir sua conta</h1>
          <p className="text-sm text-muted-foreground">
            Você pode excluir a sua conta e todos os dados associados quando quiser.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Pelo aplicativo (mais rápido)</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Entre na sua conta no Gideon&apos;s Fit.</li>
            <li>
              Toque no ícone de pessoa no topo da tela (<strong>Minha conta</strong>).
            </li>
            <li>
              Na seção <strong>Excluir minha conta</strong>, digite o e-mail da conta para confirmar e
              toque em <strong>Excluir minha conta definitivamente</strong>.
            </li>
          </ol>
          <p className="text-sm text-muted-foreground">
            Se você ainda não entrou, faça o{" "}
            <Link className="text-primary underline" href="/login">
              login
            </Link>{" "}
            primeiro.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Por e-mail</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Se não conseguir acessar a conta, escreva para{" "}
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>{" "}
            a partir do e-mail cadastrado, com o assunto &quot;Excluir minha conta&quot;. Para sua
            segurança, só excluímos a conta a pedido do dono do e-mail.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">O que é apagado</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>O seu cadastro (nome, e-mail e acesso).</li>
            <li>
              Todos os seus dados no aplicativo: protocolos de treino e alimentares, refeições, cargas
              registradas, registros de &quot;fiz / não fiz&quot; e anotações.
            </li>
            <li>
              Para <strong>profissionais</strong>: os modelos e o que foi montado para o time. As
              contas dos alunos do time continuam existindo e voltam a ser contas de Usuário Padrão.
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A exclusão é definitiva e não pode ser desfeita. Cópias de segurança do provedor de
            hospedagem podem manter os dados por um período limitado antes de serem descartadas. Mais
            detalhes na{" "}
            <Link className="text-primary underline" href="/privacidade">
              Política de Privacidade
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
