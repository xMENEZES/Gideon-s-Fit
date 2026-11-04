# Registro de carga e equipamento

## O que é

Quem treina registra, por exercício de musculação, o que realmente fez: carga, repetições, séries feitas e, opcionalmente, o equipamento (halter, máquina ou barra). Os registros ficam em `exercise_load_logs` e alimentam o histórico de carga, o Status, os resultados diários e os selos.

## Regras

- **Quem registra:** o aluno (ou a pessoa no plano próprio). O profissional só lê. Quem levanta o peso é quem registra; a carga que o profissional sugere fica em `exercises.recommended_load_kg`.
- **Histórico só de acréscimo.** Não há editar nem apagar um registro. Um erro de digitação fica no histórico. Corrigir registro é uma ideia em aberto: exigiria nova regra de acesso e recalcular o resultado diário.
- **A data nunca vem do cliente.** O servidor grava sempre o dia de hoje em Brasília (`todayBR()`). O banco usa UTC e viraria o dia às 21h; a política `load_logs_insert` só aceita a data de hoje (com folga de um dia por causa do UTC).
- **Conjugado ("10 + 15").** Carga e repetições aceitam de 1 a 4 valores separados por " + ". O texto completo vai para `weight_text` e `reps_text`; o **primeiro valor** vai para `weight_kg` e `reps_done`, que são o que o gráfico, a carga atual, o dia treinado e os gatilhos usam. Migração `0028`.
- **Séries feitas** (`sets_done`, de 1 a 99, só musculação). É opcional: em branco, o servidor grava o número de séries definido no exercício (a premissa é que a pessoa fez o previsto). Registros antigos ficam nulos e aparecem como antes. Migração `0029`.
- **Equipamento** (`equipment`: `halter`, `maquina` ou `barra`, só musculação). Opcional; tocar de novo no botão marcado desmarca. O diálogo já vem com a **última escolha daquele exercício** (o registro mais recente que tem equipamento; desmarcar e salvar grava sem equipamento, mas a sugestão seguinte volta à escolha anterior). O Status mostra o equipamento no fim da linha ("4 séries · 30 kg x 10 · Máquina"). Migração `0032`.

- **Gráfico do histórico** (toque em "X kg atual"). Mostra os **7 registros mais recentes** do exercício (com a nota "Mostrando os 7 registros mais recentes de N" quando há mais), com a **data (dd/mm) de cada dia treinado embaixo do ponto correspondente**. Os rótulos usam `interval={0}` para nenhum ser escondido (por padrão o gráfico some com os que "se sobrepõem") e há folga nas bordas para o primeiro e o último ponto não ficarem cortados. A data é formatada em UTC, porque `logged_at` é só uma data e o fuso do Brasil faria perder um dia. Precisa de 2 registros ou mais; com 1 aparece o aviso para registrar mais cargas.

## Por que assim

- Séries, conjugado e equipamento são **colunas opcionais**: registros antigos continuam válidos, e a versão anterior do app continua funcionando com o banco já migrado.
- O primeiro valor do conjugado nas colunas numéricas evita mexer em tudo o que já lia números.

## Onde está

`src/components/shared/add-load-log-dialog.tsx`, `createLoadLog` em `src/lib/actions/workouts.ts`, `src/lib/load-values.ts`, `src/lib/equipment.ts`, `describeWorkoutSet` em `src/lib/status.ts`, `load-history-dialog.tsx`, `load-chart.tsx` e `src/lib/load-chart-data.ts` (dados do gráfico, com testes). Migrações `0028`, `0029` e `0032`.
