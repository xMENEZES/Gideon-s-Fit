-- Reverte a 0030_rest_days.sql.
-- ATENÇÃO: apaga todos os dias de descanso marcados. Rode DEPOIS de voltar o deploy do app para
-- uma versão que não leia a tabela rest_days.

drop trigger if exists rest_days_no_workout_guard on public.rest_days;
drop function if exists public.rest_days_no_workout_guard();
drop table if exists public.rest_days;
drop function if exists public.owns_student_plan(uuid);
