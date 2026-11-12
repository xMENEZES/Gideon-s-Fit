# Ranking mensal do time

## O que é

Ranking do mês entre os alunos de um mesmo time. Só alunos de time participam (Usuário Padrão não tem time).

## Regras

- **Pontos:** 1 por dia de treino concluído e 1 por dia de alimentação completa, lidos do resultado diário (`daily_scores`). O mês é o de Brasília e só conta o mês atual.
- **Dupla permissão.** O **profissional liga** o ranking do time (`trainer_settings.ranking_enabled`, tela própria "Ranking" em `/dashboard/ranking`) e **cada aluno aceita participar** (`students.ranking_opt_in`). **Quem não participa não vê o ranking** e não aparece nele.
- **Privacidade:** a lista mostra só a posição, o apelido (ou o primeiro nome) e os pontos do mês. Nada de sequência, nome completo ou detalhe.
- **Empate** divide a posição (1º, 1º, 3º).
- **O profissional vê a classificação do mês** na mesma tela do liga/desliga (`TeamRankingList`): só quem aceitou participar, com apelido ou primeiro nome e pontos, e o aviso de quantos alunos do time não aparecem por não participarem. Fica oculta com o ranking desligado ou sem nenhum participante.
- A aba "Ranking" do aluno só existe quando o ranking do time está ligado.

## Por que assim

- Tudo passa por **funções no banco** (security definer): `my_ranking_state()`, `set_ranking_participation(bool)` e `team_leaderboard(mês)`. A lista dos colegas vem da função, que já devolve só o que pode ser mostrado, então a regra de privacidade não depende do app.
- A tabela de configurações do profissional tem RLS "só o próprio profissional".
- A lista do profissional **não usa função própria**: lê pelos acessos que o profissional já tem aos seus alunos (alunos, nomes e `daily_scores`) em `getTrainerMonthRanking`, e a soma e a ordem usam as mesmas regras do aluno (`trainerRankingRows` e `rankRows`). A lista visual é a mesma nas duas telas (`ranking-list.tsx`).

## Onde está

`src/lib/ranking.ts` (posição, empate, pontos do profissional e nomes, com testes), `src/lib/data/ranking.ts`, `src/lib/actions/ranking.ts`, `team-ranking-card.tsx`, `team-ranking-list.tsx` e `ranking-list.tsx`. Migração `0031`.
