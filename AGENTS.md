<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Fluxo de trabalho (obrigatório)

Detalhes em `docs/VERSIONAMENTO.md`. O essencial:

- **Nunca faça commit direto na `main`** (ela é protegida). Toda mudança nasce numa branch `tipo/descricao-curta` (`feat/`, `fix/`, `chore/`, `docs/`, `hotfix/`), a partir da `main` atualizada.
- **Antes de alterar qualquer coisa**, resuma o entendimento e a análise de impacto e aguarde a confirmação do dono.
- A mudança entra por **Pull Request**, com o CI verde (`tsc`, lint, testes e build) e o roteiro de `docs/TESTES_DE_REGRESSAO.md` sem pendência.
- **Só faça o merge (squash) depois que o dono disser que validou.** Merge e deploy são passos separados.
- **Nunca faça deploy sem autorização explícita**, e sempre a partir da `main` já mesclada. Migração de banco roda em produção **antes** do deploy e só acrescenta (compatível com o código atual da `main`).
- Depois do deploy: tag da versão (SemVer) e entrada no `CHANGELOG.md`.
