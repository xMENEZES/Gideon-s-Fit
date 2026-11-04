-- Reverte a 0033_exercise_catalog.sql.
-- ATENÇÃO: apaga o catálogo inteiro, inclusive os nomes que cada pessoa guardou. Os exercícios dos
-- treinos não mudam (o nome sempre foi texto livre). Rode DEPOIS de voltar o deploy do app para uma
-- versão que não use o catálogo.

drop trigger if exists quota_exercise_catalog on public.exercise_catalog;
drop function if exists public.quota_exercise_catalog();
drop table if exists public.exercise_catalog;
drop function if exists public.can_edit_plans();
