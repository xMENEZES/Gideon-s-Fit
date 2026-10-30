-- Séries feitas no registro de carga: quantas séries o aluno fez com aquela carga e repetições.
--
-- A coluna é opcional. Quando o aluno deixa o campo em branco, o app grava o número de séries
-- previsto no exercício (a premissa é que ele fez as séries definidas). Os registros antigos não
-- mudam (ficam nulos) e continuam sendo mostrados como antes.
-- Reversão: 0029_rollback.sql

alter table public.exercise_load_logs
  add column sets_done int;

-- De 1 a 99, e só em registro de musculação (cardio não tem séries).
alter table public.exercise_load_logs
  add constraint load_logs_sets_done_range
    check (sets_done is null or (sets_done between 1 and 99 and weight_kg is not null));
