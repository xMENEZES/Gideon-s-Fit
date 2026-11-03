# Política de versionamento e entrega

Como uma mudança sai da ideia até a produção sem arriscar o que já funciona.

## Princípios

1. **A `main` é a produção.** Tudo que está nela está no ar ou pronto para ir. Ela é protegida no GitHub: ninguém empurra direto, tudo entra por Pull Request e só por "squash".
2. **Cada mudança nasce numa branch isolada**, com nome que diz o que está sendo feito, e só vai para a `main` depois de validada.
3. **Validar antes de mesclar, mesclar antes de publicar.** Merge e deploy são passos separados, e o deploy só acontece com autorização explícita do dono do projeto.
4. **Nada sobe para produção sem como voltar atrás.** Todo deploy tem uma versão marcada, e toda migração de banco tem rollback.

## Ambientes

| Ambiente | Onde roda | Banco | Quem acessa |
|---|---|---|---|
| Local | `npm run dev` (porta 3010), lendo o `.env.local` | banco de testes (staging) | quem desenvolve |
| Preview | `npx vercel` (sem `--prod`) a partir da branch | banco de testes (staging), pelas variáveis do ambiente Preview da Vercel | quem tiver o link |
| Produção | https://gideons-fit.vercel.app, deploy a partir da `main` | banco de produção, pelas variáveis do ambiente Production da Vercel | todos |

**Banco de testes (staging)** é um segundo projeto Supabase, com as mesmas migrações da produção e **nenhum dado pessoal real**. Só tem contas de teste (`@example.com`) e protocolos fictícios.

- **Nunca aponte o ambiente local para a produção.** O `.env.local` usa as chaves do banco de testes. As chaves de produção ficam só na Vercel (ambiente Production) e numa cópia local ignorada pelo Git; nenhuma chave entra no repositório.
- **Migrações:** rodam primeiro no banco de testes (SQL Editor, na ordem), são validadas pela branch, e só no dia do deploy rodam em produção.
- **Paridade:** o banco de testes deve continuar igual ao de produção. Depois de rodar uma migração nos dois, a consulta de conferência de esquema (contagens e assinaturas de colunas, políticas e funções) precisa dar o mesmo resultado nos dois projetos.
- **Variáveis da Vercel:** as do banco de testes existem **só** no ambiente Preview, e as de produção **só** no Production. Uma variável marcada para os dois ambientes faria o preview usar a produção.

A regra de migração compatível (seção "Banco de dados") continua valendo mesmo com o banco de testes.

## Fluxo de cada atualização

1. **Entendimento e impacto.** Antes de alterar qualquer coisa, o pedido é resumido e a análise de impacto é entregue. O dono confirma.
2. **Criar a branch** a partir da `main` atualizada: `git switch main && git pull && git switch -c tipo/descricao-curta`.
3. **Desenvolver na branch**, com commits pequenos, e enviar a branch ao GitHub.
4. **Abrir o Pull Request** para a `main`, preenchendo o modelo (checklist).
5. **Portão automático (CI):** tipos, lint, testes e build precisam passar. Roda sozinho a cada push do PR.
6. **Validação funcional**, no preview local (360 px, tema claro e escuro) e com o roteiro de [`TESTES_DE_REGRESSAO.md`](TESTES_DE_REGRESSAO.md). O que só funciona no celular (som, vibração, ícone, instalação) é validado pelo dono.
7. **Aprovação do dono** ("validei"). Sem ela, não há merge.
8. **Merge por squash** na `main`. A branch é apagada automaticamente.
9. **Deploy** a partir da `main` atualizada, **só com autorização explícita**, seguido de um teste rápido em produção. Se houver migração, ela roda em produção **antes** do deploy.
10. **Versão:** marcar a tag anotada no **commit que foi publicado** e registrar a versão no [`CHANGELOG.md`](../CHANGELOG.md) (a atualização do arquivo pode ir junto da próxima branch de documentação, porque a `main` só aceita Pull Request).

## Nomes

**Branches:** `tipo/descricao-curta`, em minúsculas, sem acento, com hífens.

| Tipo | Quando | Exemplo |
|---|---|---|
| `feat/` | recurso novo | `feat/ranking-mensal-do-time` |
| `fix/` | correção de defeito | `fix/toast-de-sucesso-verde` |
| `chore/` | manutenção, dependências, configuração | `chore/corrigir-lint-paginas-auth` |
| `docs/` | só documentação | `docs/politica-de-versionamento` |
| `hotfix/` | urgência em produção | `hotfix/login-quebrado` |

**Commits e Pull Requests:** título curto no imperativo, em português, seguido de uma lista do que mudou. O título do PR vira o título do commit na `main`.

## Portões de validação

**Automáticos** (CI, `.github/workflows/ci.yml`): `tsc --noEmit`, `npm run lint`, `npm test` e `npm run build`. Têm que estar verdes para o merge.

**Manuais:**
- Preview local em 360 px, nos temas claro e escuro, sem estouro horizontal.
- Roteiro de regressão: os fluxos de [`TESTES_DE_REGRESSAO.md`](TESTES_DE_REGRESSAO.md) que a mudança pode afetar (na dúvida, todos).
- Testes só no celular, feitos pelo dono, quando a mudança envolver som, vibração, instalação, ícone ou tela de abertura.
- Dados de teste só em contas de teste, nunca na conta real de ninguém.

## Banco de dados

- **Migrações** ficam em `supabase/migrations`, numeradas em sequência, cada uma com `NNNN_rollback.sql` e, quando couber, um script de teste em `supabase/tests`. Quem roda é o dono, no SQL Editor.
- **Com o banco de testes:** a migração roda primeiro nele, é validada pela branch, e só no dia do deploy roda em produção.
- **Regra de compatibilidade (vale sempre):** a migração tem que ser compatível com o código que está hoje na `main`. Ela **só acrescenta** (tabela, coluna ou função nova). Remover ou renomear algo vai numa versão seguinte, depois que nenhum código antigo dependa dele. Assim, rodar a migração antes do deploy nunca quebra a produção.
- **Duas branches com migração ao mesmo tempo:** a segunda a ser mesclada renumera a sua.
- **Ordem do deploy com migração:** migração em produção, depois deploy, depois teste.

## Versões e voltar atrás

- **Versões** seguem SemVer, `vMAIOR.MENOR.CORREÇÃO`: recurso novo sobe o MENOR, correção sobe a CORREÇÃO, mudança que quebra compatibilidade de dados ou de uso sobe o MAIOR.
- **Cada deploy em produção** corresponde a uma tag anotada na `main` (`git tag -a vX.Y.Z -m "..."`) e a uma entrada no `CHANGELOG.md`.
- **Voltar atrás no código:** na Vercel, promover o deploy anterior (Deployments, menu do deploy, "Promote to Production"). É imediato.
- **Voltar atrás no banco:** rodar o rollback da migração (`NNNN_rollback.sql`), depois de voltar o código.

## Urgências (hotfix)

Defeito grave em produção: branch `hotfix/...` a partir da `main`, só a correção mínima, mesmos portões (podem ser enxutos, mas o CI não é pulado), merge, deploy autorizado e versão de CORREÇÃO. Depois, registrar no CHANGELOG.

## Dependabot

Cada atualização de dependência é uma branch e um Pull Request, e passa pelos mesmos portões. Atualizações de versão maior (por exemplo TypeScript ou ESLint) são tratadas como recurso novo, com validação manual. Nunca se mescla com o CI vermelho.

## Quem faz o quê

- **Dono do projeto:** decide o que fazer, confirma o entendimento, valida ("validei"), autoriza o deploy e roda as migrações.
- **Claude (assistente):** cria a branch, desenvolve, roda os portões, abre o Pull Request, faz o merge depois do "validei" e, quando autorizado, o deploy. Nunca faz commit direto na `main` nem deploy sem autorização.

## Resumo para colar na cabeça

`branch com nome do que faz` → `CI verde` → `teste e regressão` → `"validei"` → `merge (squash)` → `migração em produção, se houver` → `deploy autorizado` → `tag + CHANGELOG`
