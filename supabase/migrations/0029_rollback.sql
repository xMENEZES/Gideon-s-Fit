-- Reverte a 0029_sets_done.sql.
-- ATENÇÃO: perde o número de séries feitas de cada registro. Rode DEPOIS de voltar o deploy do
-- app para uma versão que não use sets_done.

alter table public.exercise_load_logs
  drop constraint if exists load_logs_sets_done_range;

alter table public.exercise_load_logs
  drop column if exists sets_done;
