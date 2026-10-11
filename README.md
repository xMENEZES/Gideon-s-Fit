# Gideon's Fit

Aplicativo web (PWA) para montar, acompanhar e avaliar **protocolos de treino e de alimentação**. Foi pensado para dois públicos: **profissionais** (personal trainers e nutricionistas) que acompanham um time de alunos, e **pessoas que treinam por conta própria** e querem o próprio plano organizado.

Produção: <https://gideons-fit.vercel.app>

## O que o app faz

**Protocolos**
- **Treino:** dias de treino em abas (A, B, C), com séries, repetições, descanso configurável com cronômetro, carga recomendada, observações e vídeo de execução (YouTube). Um dia também aceita **cardio** como tipo de exercício (atividade, meta em minutos e/ou quilômetros e registro das sessões). Gráfico com os 7 registros de carga mais recentes de cada exercício.
- **Alimentação:** refeições com horário sugerido e **opções** por refeição (Opção 1, Opção 2), com alimentos e quantidades exatas e menu de unidades (g, ml, unidade, fatia, porção, dose e outras). As alternativas de um mesmo alimento ("2 ovos OU 60 g de frango OU 80 g de atum") formam um **grupo de escolha** e aparecem em carrossel, um card por vez, com esferas indicando a posição.
- **Edição completa:** dia de treino, exercício, refeição, opção e alimento podem ser editados (lápis em cada item), não só criados e removidos.
- **Histórico:** ao iniciar um novo protocolo, o anterior vai para o histórico e continua consultável.

**Acompanhamento**
- **Telas do dia:** com o protocolo pronto, as abas de treino e de alimentação mostram o **treino de hoje** (o dia sugerido pela sequência) e a **alimentação de hoje**. A montagem do plano fica em "Editar plano".
- **Registro diário de refeições:** ícones de feita (✓) e não feita (✕, com o motivo), para hoje e os 3 dias anteriores. A refeição marcada recolhe e a tela rola até a próxima pendente.
- **Registro de carga e de cardio:** o aluno registra o que realmente fez, e isso alimenta o histórico e o gráfico. O registro vale sempre para o dia de hoje: não há campo de data.
- **Status avaliativo:** dias treinados (musculação ou cardio, cada dia recolhível), refeições feitas por dia (o dia só entra na conta depois de encerrado), aproveitamento em % e justificativas. O período pode ser o do protocolo, os últimos 7, 14 ou 30 dias, ou qualquer intervalo.

**Gamificação**
- **Mensagens de incentivo:** ao concluir o treino (todos os exercícios do dia registrados), a alimentação ou o dia completo, e ao conquistar um selo. O aluno de um time vê as mensagens do profissional, que parte das padrão do sistema e pode editar, adicionar e desativar. O Usuário Padrão vê as do sistema.
- **Sequências e selos:** a sequência de treino quebra no 3º dia seguido sem treinar, a de dieta no 2º dia incompleto, e a de treino + dieta conta só os dias com os dois. São 21 selos em SVG (3 linhas, marcos de 3 a 200 dias). O card da conquista aparece uma vez; depois fica o ícone do maior selo no topo das telas do dia, e a tela de Status mostra as sequências e os selos conquistados.

**Perfis**
- **Usuário Padrão:** monta o próprio treino e a própria alimentação e vê só o próprio status.
- **Profissional:** gerencia o time, vê o status de todos os alunos de uma vez e o detalhe de cada um, e personaliza as mensagens de incentivo.
- **Aluno:** acompanha o protocolo montado pelo profissional, registra cargas e refeições.

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
- **Vitest** para os testes das regras de negócio (`npm test`)
- **Vercel** para hospedagem (região `gru1`, São Paulo)

## Estrutura do projeto

```
src/
  app/
    (auth)/       login, cadastro, recuperação de senha, escolha de perfil
    (trainer)/    dashboard do profissional (alunos, status, modelos, mensagens, alertas)
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
    gamification/ concessão de selos (só no servidor)
    supabase/     clientes (navegador, servidor, proxy e admin)
    validations/  schemas Zod
    quota.ts      mensagens dos limites de uso
    *.ts          regras puras (sequências, status, cardio, mensagens...), cada uma com seu *.test.ts
supabase/
  migrations/     migrações SQL numeradas (0001 em diante)
  tests/          scripts de verificação (isolamento entre contas, cotas, cardio, mensagens, grupos de escolha, resultado diário)
```

## Segurança

- **RLS em todas as tabelas:** cada pessoa só lê e escreve os próprios dados, e o profissional só os dados do próprio time. As regras de acesso das tabelas filhas usam funções `security definer` para manter o desempenho.
- **Escrita controlada:** perfis e vínculos de alunos só são alterados pelo servidor, com validação Zod. A chave `service_role` fica restrita a `src/lib/supabase/admin.ts`, protegido com `server-only`.
- **Cabeçalhos:** Content-Security-Policy em modo de bloqueio, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- **Entrada validada:** limites de tamanho nos formulários e no banco, links de vídeo apenas `http`/`https`, redirecionamento pós-login restrito a caminhos internos.
- **Limites de uso:** tentativas de código de time limitadas de forma atômica, e tetos de quantidade por conta (por exemplo, 200 alunos por profissional, 40 exercícios por dia de treino e 10 mensagens por tipo).
- **Pontos não vêm do cliente:** o resultado diário (treino concluído e dieta completa) é gravado por gatilhos do banco a partir dos registros, e os selos só pelo servidor. O registro de carga só aceita a data de hoje.
- **Dependências:** Dependabot semanal, e `npm audit` de produção sem vulnerabilidades.

Os scripts em `supabase/tests` verificam o isolamento entre contas (`rls_isolation_probe.sql`) e as regras de cada migração (cotas, cardio, mensagens, grupos de escolha e resultado diário). Rode-os no SQL Editor; os de migração terminam com um erro de propósito que desfaz tudo o que criam.

## Deploy

O deploy é feito na Vercel (`npx vercel --prod`). As mesmas variáveis do `.env.local` precisam estar configuradas no projeto da Vercel. Mudanças de banco entram **antes** do código que depende delas, rodando a migração correspondente no Supabase (cada migração tem um arquivo `_rollback.sql` para reverter).

## Convenções

- Interface e mensagens em português do Brasil.
- Toda escrita passa por Server Actions, que validam a entrada com Zod e deixam o RLS decidir o acesso.
- Itens de lista, diálogos e cartões compartilhados entre perfis ficam em `src/components/shared`.
- Regra de negócio nova é escrita como função pura e testada com Vitest antes de ir para a tela.
