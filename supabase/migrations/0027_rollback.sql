-- Reverte a 0027_daily_scores_and_seals.sql: remove gatilhos, funções e as tabelas de resultado
-- diário e de selos (o histórico de pontos e os selos se perdem) e volta a política de inserção
-- dos registros de carga ao texto da 0021 (sem limite de data).
-- Rode DEPOIS de voltar o deploy do app para uma versão sem selos.

drop trigger if exists score_from_meal_log on public.meal_logs;
drop trigger if exists score_from_load_log on public.exercise_load_logs;
drop function if exists public.score_from_meal_log();
drop function if exists public.score_from_load_log();
drop function if exists public.recompute_daily_score(uuid, date);

drop table if exists public.achievements;
drop table if exists public.daily_scores;
drop function if exists public.can_read_student_scores(uuid);

drop policy if exists "load_logs_insert" on public.exercise_load_logs;
create policy "load_logs_insert" on public.exercise_load_logs for insert
  with check (created_by = (select auth.uid()) and public.owns_exercise_as_student(exercise_id));
