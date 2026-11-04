# Cardio

## O que é

Além da musculação, um dia de treino aceita exercícios de **cardio**: uma atividade (corrida, bicicleta etc.) com meta de duração e/ou distância. A pessoa registra a sessão feita (minutos e/ou quilômetros).

## Regras

- `exercises.kind` é `strength` ou `cardio` e **não muda depois de criado**. Musculação exige séries e repetições; cardio exige a atividade e **pelo menos uma meta** (`target_minutes` e/ou `target_distance_km`).
- Os registros de cardio ficam na **mesma tabela** dos de musculação (`exercise_load_logs`), com `duration_minutes` e/ou `distance_km` e `weight_kg` nulo. Um gatilho (`exercise_load_logs_kind_guard`) impede misturar os dois tipos, e as restrições de séries feitas e de equipamento só valem em registro com carga (musculação).
- **Dia treinado** é qualquer registro na data (musculação ou cardio), contado uma vez. **Treino concluído** (para mensagem, ponto e sequência) exige todos os exercícios do dia, cardio incluso.
- As atividades são uma lista fixa mais "Outra" (`src/lib/cardio.ts`). O catálogo de nomes de exercícios **não** cobre cardio.
- Copiar protocolo (novo ciclo, modelo) copia os exercícios de cardio.

## Por que assim

Reaproveitar a tabela de registros evita duplicar o histórico, o Status, o resultado diário e os gatilhos; o gatilho de proteção mantém os dois tipos separados.

## Onde está

`src/lib/cardio.ts`, `add-cardio-log-dialog.tsx`, `createCardioLog` em `src/lib/actions/workouts.ts`. Migração `0024` (com `supabase/tests/cardio_probe.sql`).
