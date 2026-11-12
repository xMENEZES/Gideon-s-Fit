-- Equipamento "Cross" no registro de carga (além de halter, máquina e barra).
--
-- Só amplia a lista de valores aceitos pela restrição da 0032. Registros antigos não mudam. O
-- código atual da main não conhece "cross" e segue funcionando: ao ler um valor desconhecido ele
-- só não mostra o equipamento, sem erro. Ninguém grava "cross" antes do deploy desta versão.
-- Reversão: 0036_rollback.sql

alter table public.exercise_load_logs
  drop constraint if exists load_logs_equipment_values;

alter table public.exercise_load_logs
  add constraint load_logs_equipment_values
    check (equipment is null or (equipment in ('halter', 'maquina', 'barra', 'cross') and weight_kg is not null));
