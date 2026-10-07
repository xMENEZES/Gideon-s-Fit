# Gideon's Fit

Aplicativo web (PWA) para montar, acompanhar e avaliar **protocolos de treino e de alimentação**. Foi pensado para dois públicos: **profissionais** (personal trainers e nutricionistas) que acompanham um time de alunos, e **pessoas que treinam por conta própria** e querem o próprio plano organizado.

Produção: <https://gideons-fit.vercel.app>

## O que o app faz

**Protocolos**
- **Treino:** dias de treino em abas (A, B, C), com séries, repetições, descanso configurável com cronômetro, carga recomendada, observações e vídeo de execução (YouTube). Gráfico com os 7 registros de carga mais recentes de cada exercício.
- **Alimentação:** refeições com horário sugerido e **opções alternativas** por refeição, com alimentos e quantidades exatas.
- **Edição completa:** dia de treino, exercício, refeição, opção e alimento podem ser editados (lápis em cada item), não só criados e removidos.
- **Histórico:** ao iniciar um novo protocolo, o anterior vai para o histórico e continua consultável.

**Acompanhamento**
- **Registro diário de refeições:** "Fiz" ou "Não fiz" (com o motivo), válido para hoje e os 3 dias anteriores.
- **Registro de carga:** o aluno registra o que realmente levantou, e isso alimenta o histórico e o gráfico.
- **Status avaliativo:** dias treinados, refeições feitas por dia, aproveitamento em % e justificativas. O período pode ser o do protocolo, os últimos 7, 14 ou 30 dias, ou qualquer intervalo.

**Perfis**
- **Usuário Padrão:** monta o próprio treino e a própria alimentação e vê só o próprio status.
- **Profissional:** gerencia o time, vê o status de todos os alunos de uma vez e o detalhe de cada um.
- **Aluno:** acompanha o protocolo montado pelo profissional, registra cargas e refeições.
- **Administrador:** convida profissionais e gerencia contas.

**Times e modelos**
- **Time por código:** o profissional gera um código de 8 caracteres, a pessoa o digita e o profissional aprova a entrada. O aluno pode sair do time quando quiser e volta a ser Usuário Padrão.
- **Modelos de protocolo:** o profissional monta uma estrutura padrão uma vez e atribui a vários alunos de uma só vez (até 50). Também dá para salvar o protocolo de um aluno como modelo. Cada aluno recebe uma cópia própria e editável.

**Conta**
- Cadastro com Google ou e-mail, com aceite da Política de Privacidade.
- Confirmação por e-mail e recuperação de senha.
- Tema claro e escuro.
- **Exclusão de conta pelo próprio usuário** (menu "Minha conta"), com confirmação digitando o e-mail. Página pública de instruções em `/excluir-conta`.
- Política de privacidade em `/privacidade`.
- Funciona como PWA instalável e foi ajustado para telas pequenas.

## Tecnologias

- **Next.js 16** (App Router, Server Components, Server Actions) e **React 19**
- **TypeScript**, **Tailwind CSS 4**, componentes **shadcn/ui** (base-ui)
- **Supabase**: Auth, Postgres e Row Level Security (RLS)
- **Zod 4** e **React Hook Form** para validação
- **Recharts** para os gráficos
- **Vercel** para hospedagem (região `gru1`, São Paulo)

## Estrutura do projeto

```
src/
  app/
    (auth)/       login, cadastro, recuperação de senha, escolha de perfil
    (trainer)/    dashboard do profissional (alunos, status, modelos, alertas)
    (student)/    área do aluno do time
    (standard)/   plano próprio do Usuário Padrão (/meu-plano)
    (admin)/      painel do administrador
    (account)/    Minha conta (exclusão de conta)
  components/
    ui/           componentes base (shadcn/ui)
    shared/       cartões, diálogos e formulários compartilhados entre perfis
  lib/
    actions/      Server Actions (todas as escritas passam por aqui)
    data/         consultas compartilhadas e com cache por requisição
    supabase/     clientes (navegador, servidor, proxy e admin)
    validations/  schemas Zod
    quota.ts      mensagens dos limites de uso
supabase/
  migrations/     migrações SQL numeradas (0001 em diante)
  tests/          scripts de verificação (isolamento entre contas, cotas)
```

## Como rodar localmente

Pré-requisitos: Node.js 20 ou superior e um projeto no [Supabase](https://supabase.com).

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz com as variáveis abaixo (os valores vêm do painel do seu projeto Supabase; **nunca** os coloque no repositório):

   | Variável | Uso |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave pública (anon/publishable) |
   | `SUPABASE_SERVICE_ROLE_KEY` | chave de serviço, **somente no servidor** |
   | `NEXT_PUBLIC_SITE_URL` | URL pública do site (links de e-mail e redirecionamentos) |

3. Rode as migrações de `supabase/migrations` em ordem no SQL Editor do Supabase. A `0014` (que cria um valor de enum) precisa rodar sozinha. As migrações `*_rollback.sql` desfazem a migração de mesmo número e **não** fazem parte da sequência normal.

4. Configure no Supabase o provedor Google (opcional), as URLs de redirecionamento e os modelos de e-mail de confirmação e de recuperação de senha (que apontam para `/auth/confirm`).

5. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

Outros comandos: `npm run build` (compilação de produção), `npm run start` (servir a compilação) e `npm run lint`.

## Segurança

- **RLS em todas as tabelas:** cada pessoa só lê e escreve os próprios dados, e o profissional só os dados do próprio time. As regras de acesso das tabelas filhas usam funções `security definer` para manter o desempenho.
- **Escrita controlada:** perfis e vínculos de alunos só são alterados pelo servidor, com validação Zod. A chave `service_role` fica restrita a `src/lib/supabase/admin.ts`, protegido com `server-only`.
- **Cabeçalhos:** Content-Security-Policy em modo de bloqueio, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- **Entrada validada:** limites de tamanho nos formulários e no banco, links de vídeo apenas `http`/`https`, redirecionamento pós-login restrito a caminhos internos.
- **Limites de uso:** tentativas de código de time limitadas de forma atômica, e tetos de quantidade por conta (por exemplo, 200 alunos por profissional e 40 exercícios por dia de treino).
- **Dependências:** Dependabot semanal, e `npm audit` de produção sem vulnerabilidades.

Os scripts em `supabase/tests` verificam o isolamento entre contas (`rls_isolation_probe.sql`) e os tetos de cota (`quota_probe.sql`). Rode-os no SQL Editor; o de cotas desfaz tudo o que cria.

## Deploy

O deploy é feito na Vercel (`npx vercel --prod`). As mesmas variáveis do `.env.local` precisam estar configuradas no projeto da Vercel. Mudanças de banco entram **antes** do código que depende delas, rodando a migração correspondente no Supabase.

## Convenções

- Interface e mensagens em português do Brasil.
- Toda escrita passa por Server Actions, que validam a entrada com Zod e deixam o RLS decidir o acesso.
- Itens de lista, diálogos e cartões compartilhados entre perfis ficam em `src/components/shared`.
