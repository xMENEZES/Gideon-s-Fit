-- Reverte a 0032_load_equipment.sql.
-- ATENÇÃO: perde o equipamento escolhido em cada registro. Rode DEPOIS de voltar o deploy do
-- app para uma versão que não use equipment.

alter table public.exercise_load_logs
  drop constraint if exists load_logs_equipment_values;

alter table public.exercise_load_logs
  drop column if exists equipment;
