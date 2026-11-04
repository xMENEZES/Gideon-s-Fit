# Desempenho e abertura do app

## O que é

O app tem de abrir rápido no celular, mesmo depois de parado (partida fria da função na Vercel) e com o banco a uma ida e volta de distância. As decisões abaixo existem por causa disso.

## Abertura

- **Portão de login na borda (edge).** `src/middleware.ts` checa a sessão antes de renderizar qualquer coisa. Ele roda na edge, e não no `proxy.ts` do Next 16, porque o `proxy` só roda em Node e a partida fria dele custava mais de 1 s. O aviso de que `middleware` está obsoleto é esperado.
- **Chave pública embutida (JWKS).** O JWT é verificado localmente (`getClaims` com a chave em `src/lib/supabase/jwks.ts`), sem ir ao Supabase Auth a cada tela. Se o Supabase girar a chave, a biblioteca busca a nova online.
- **Cookie `gf_home`** (httpOnly, `<id>|<home>`, apagado ao sair) guarda a tela inicial da pessoa. Com ele, abrir `/` redireciona sem consultar o banco.
- **Tela de abertura própria** (`/abrindo/...`): quando o cookie é válido, `/` faz um rewrite para uma página estática que depois leva à home. Motivo: no app instalado no Android, a tela de abertura do sistema com o endereço da Vercel ficava visível durante a partida fria.
- As raízes das áreas redirecionam direto para a aba de treino, no `next.config.ts` (ver [menu-e-navegacao](menu-e-navegacao.md)).

## Consultas ao banco

- **Uma consulta por tela.** O protocolo vem com dias, exercícios e cargas numa única leitura (recursos embutidos do PostgREST), em vez de várias em sequência.
- **Cache por requisição** (`cache` do React) em `src/lib/data/`: layout e página que precisam do mesmo dado compartilham uma consulta só (aluno, perfil, estado do ranking, contagens do menu, resumos do time).
- **Disparar cedo.** `warmDailyScreen` inicia, em paralelo com a consulta do protocolo, as consultas de selos, mensagens e progresso do outro módulo.
- **Suspense** para o que não bloqueia a tela: bolinhas do menu do profissional, cabeçalho da ficha do aluno e resumos dos cards.
- **Regras de acesso rápidas.** As políticas das tabelas filhas usam funções `security definer` (`can_read_*`, `can_write_*`, migração `0021`), o que baixou as consultas aninhadas de cerca de 300 ms para cerca de 80 ms.
- **Marcação otimista** das refeições (✓/✕): a tela muda na hora e o servidor confirma depois.

## Medidas

A tela do aluno faz cerca de 7 consultas em paralelo. Sozinha leva cerca de 0,1 s; o comportamento sob muitos acessos simultâneos está em [TESTE_DE_CONCORRENCIA](../TESTE_DE_CONCORRENCIA.md). O que sobra de lentidão é a partida fria da função (cerca de 1,4 s) mais a primeira conexão ao banco.

## Regra para medir

Medição temporária de tempo de consulta se remove depois: `src/lib/supabase/server.ts` deve ficar idêntico ao do commit.
