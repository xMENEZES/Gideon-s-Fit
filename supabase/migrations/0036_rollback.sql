-- Reverte a 0036_equipment_cross.sql.
-- ATENÇÃO: registros feitos com "Cross" perdem o equipamento (ficam sem escolha, como se o aluno
-- não tivesse marcado nada); o peso e as repetições ficam. Rode DEPOIS de voltar o deploy do app
-- para uma versão que não ofereça "Cross".

update public.exercise_load_logs set equipment = null where equipment = 'cross';

alter table public.exercise_load_logs
  drop constraint if exists load_logs_equipment_values;

alter table public.exercise_load_logs
  add constraint load_logs_equipment_values
    check (equipment is null or (equipment in ('halter', 'maquina', 'barra') and weight_kg is not null));
