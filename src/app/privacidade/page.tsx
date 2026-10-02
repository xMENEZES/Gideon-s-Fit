import Link from "next/link";
import { Dumbbell } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade — Gideon's Fit",
};

const CONTACT_EMAIL = "gabrielprojects97@gmail.com";
const UPDATED_AT = "2 de outubro de 2026";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Quem somos",
    body: (
      <p>
        O Gideon&apos;s Fit é uma plataforma para profissionais (personal trainers e nutricionistas)
        e pessoas que treinam organizarem protocolos de treino e protocolos alimentares. Para qualquer
        assunto sobre seus dados pessoais, fale com a gente em{" "}
        <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
  {
    title: "2. Dados que coletamos",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Conta:</strong> nome, e-mail e senha. A senha é protegida pelo provedor de
          autenticação e nunca fica visível para nós.
        </li>
        <li>
          <strong>Login com Google:</strong> quando você escolhe entrar com o Google, recebemos
          apenas seu nome e e-mail.
        </li>
        <li>
          <strong>Dados do seu plano:</strong> protocolos de treino e alimentação, exercícios,
          refeições, cargas registradas, observações, apelido e, se informada, data de nascimento.
          Esses dados podem revelar informações sobre saúde e bem-estar e são tratados com cuidado
          redobrado.
        </li>
        <li>
          <strong>Dados técnicos essenciais:</strong> cookies de sessão para manter você conectado
          e a preferência de tema (claro/escuro).
        </li>
      </ul>
    ),
  },
  {
    title: "3. Como usamos seus dados",
    body: (
      <p>
        Usamos os dados somente para fornecer o serviço: autenticar você, exibir e permitir a edição
        dos seus protocolos e enviar e-mails de confirmação de conta e redefinição de senha. Não
        vendemos seus dados e não os usamos para publicidade.
      </p>
    ),
  },
  {
    title: "4. Com quem compartilhamos",
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Seu profissional:</strong> se você entrar no time de um profissional, ele passa a
          ver e gerenciar seus protocolos e as cargas que você registrar.
        </li>
        <li>
          <strong>Provedores de infraestrutura:</strong> banco de dados e autenticação (Supabase),
          hospedagem (Vercel), login com Google (Google) e envio de e-mails. Eles tratam os dados
          apenas para nos prestar o serviço.
        </li>
        <li>Não compartilhamos seus dados com terceiros para fins comerciais.</li>
      </ul>
    ),
  },
  {
    title: "5. Segurança",
    body: (
      <p>
        A comunicação é protegida por HTTPS e o acesso aos dados é restrito por regras no próprio
        banco: cada usuário só enxerga os seus dados, e cada profissional só enxerga os alunos do
        seu time.
      </p>
    ),
  },
  {
    title: "6. Por quanto tempo guardamos",
    body: (
      <p>
        Mantemos seus dados enquanto sua conta existir. Você pode pedir a exclusão da conta e dos
        dados associados a qualquer momento pelo e-mail de contato.
      </p>
    ),
  },
  {
    title: "7. Seus direitos (LGPD)",
    body: (
      <p>
        Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar a
        confirmação do tratamento, acesso, correção, anonimização, portabilidade, eliminação dos
        dados, informação sobre compartilhamento e a revogação do consentimento. Basta escrever para{" "}
        <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
  {
    title: "8. Login com Google e dados do Google",
    body: (
      <p>
        O uso das informações recebidas das APIs do Google segue a Política de Dados do Usuário dos
        Serviços de API do Google, incluindo os requisitos de Uso Limitado. Usamos o nome e o e-mail
        do Google apenas para criar e identificar sua conta.
      </p>
    ),
  },
  {
    title: "9. Menores de idade",
    body: (
      <p>
        O serviço não é destinado a menores de 18 anos sem a supervisão de um responsável legal.
      </p>
    ),
  },
  {
    title: "10. Mudanças nesta política",
    body: (
      <p>
        Podemos atualizar esta política. A data da última atualização aparece no topo desta página.
      </p>
    ),
  },
];

export default function PrivacidadePage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>
        </div>
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <div className="text-sm leading-relaxed text-muted-foreground">{section.body}</div>
          </section>
        ))}
      </main>
    </div>
  );
}
