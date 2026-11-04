# Banco e migrações

O banco é o Postgres do Supabase, acessado **só por HTTP** (PostgREST e Auth) pelo `supabase-js`. Não há driver de Postgres nem `DATABASE_URL`, e por isso não há pooler a configurar. As migrações ficam em `supabase/migrations/` e os testes de banco em `supabase/tests/`.

## Convenções

- **Só acrescenta.** Migração nova adiciona coluna opcional, tabela ou função; não remove nem renomeia o que o código atual usa. Assim, a migração roda em produção **antes** do deploy sem quebrar a versão que está no ar.
- **Numeração sequencial** (`NNNN_assunto.sql`) e, para cada migração, um **`NNNN_rollback.sql`** que a desfaz e um **script de teste** em `supabase/tests/` (`*_probe.sql`).
- **Quem roda:** a migração é rodada à mão no SQL Editor do Supabase, primeiro no banco de testes e depois no de produção. Migrações com `alter type ... add value` precisam rodar sozinhas.
- **Tipos do banco** (`src/lib/types/database.types.ts`) são mantidos à mão: ao criar coluna ou tabela, atualize o arquivo na mesma mudança.

## Regras de acesso (RLS)

- **RLS ligado em todas as tabelas**, com `revoke` para `anon` e concessões mínimas para `authenticated` (às vezes por coluna: por exemplo só `body` e `active` podem ser alterados em `incentive_messages`).
- Funções auxiliares de política são `security definer` com `set search_path = public` e `execute` concedido só a quem precisa. Elas evitam reavaliar RLS de outras tabelas linha a linha.
- Dados que o **servidor calcula** não aceitam escrita do cliente: resultado diário, selos e ranking passam por gatilhos e funções, e os selos são gravados com a chave de serviço.
- **Linhas do sistema** têm `owner_id` nulo e só a migração as grava (mensagens de incentivo, catálogo de exercícios).

## Cotas

Gatilhos `quota_*` levantam `quota_exceeded:<chave>` quando a conta passa do limite (alunos, modelos, dias, exercícios, refeições, itens, mensagens, nomes do catálogo). `src/lib/quota.ts` traduz a chave em mensagem; **os números do gatilho e da mensagem devem ser iguais**.

## Testes do banco (probes)

- Rodam no SQL Editor como `postgres`, depois da migração, e **desfazem tudo**: terminam com um erro de propósito (`TESTE CONCLUIDO (tudo revertido): ...`) que reverte as linhas criadas. A mensagem lista cada item como `ok` ou `FALHOU`.
- Para agir como um usuário, o teste ajusta `request.jwt.claims` com o `sub` da pessoa e usa `set local role authenticated`; no fim, `reset role`.
- **Lembrete:** colunas obrigatórias (como `created_by` em `exercise_load_logs`) precisam ser preenchidas nos inserts de teste, senão o teste falha antes de checar o que importa.
- O comando de isolamento entre contas (`rls_isolation_probe.sql`) tem a referência em `rls_baseline_2026-10-07.md`.

## Ambientes

Há um **banco de testes (staging)** separado do de produção, com contas e dados fictícios. O ambiente local e os previews da Vercel usam o de testes; só o deploy de produção usa o de produção. Detalhes e a ordem de deploy em [VERSIONAMENTO](../VERSIONAMENTO.md).
