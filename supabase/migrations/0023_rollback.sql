-- Reverte a 0023_quotas.sql (remove os gatilhos e as funções de cota).
drop trigger if exists quota_students on public.students;
drop trigger if exists quota_templates on public.protocols;
drop trigger if exists quota_workout_days on public.workout_days;
drop trigger if exists quota_exercises on public.exercises;
drop trigger if exists quota_meals on public.meals;
drop trigger if exists quota_meal_items on public.meal_items;

drop function if exists public.quota_students();
drop function if exists public.quota_templates();
drop function if exists public.quota_workout_days();
drop function if exists public.quota_exercises();
drop function if exists public.quota_meals();
drop function if exists public.quota_meal_items();
