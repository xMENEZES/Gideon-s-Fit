-- Equipamento no registro de carga: com o que a carga foi feita (halter, máquina ou barra).
--
-- A coluna é opcional. Quando o aluno não escolhe, fica nula. Os registros antigos não mudam
-- (ficam nulos) e continuam sendo mostrados como antes. O app sugere, no próximo registro do
-- mesmo exercício, a última escolha feita.
-- Só acrescenta: o código atual da main não conhece a coluna e segue funcionando.
-- Reversão: 0032_rollback.sql

alter table public.exercise_load_logs
  add column equipment text;

-- Só os três valores do app, e só em registro de musculação (cardio não tem carga nem equipamento).
alter table public.exercise_load_logs
  add constraint load_logs_equipment_values
    check (equipment is null or (equipment in ('halter', 'maquina', 'barra') and weight_kg is not null));
