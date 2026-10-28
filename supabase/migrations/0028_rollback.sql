-- Reverte a 0028_conjugated_logs.sql.
-- ATENÇÃO: perde o texto dos registros conjugados ("10 + 15"); o primeiro valor de cada um
-- continua em weight_kg / reps_done. Rode DEPOIS de voltar o deploy do app para uma versão
-- que não use weight_text / reps_text.

alter table public.exercise_load_logs
  drop constraint if exists load_logs_weight_text_format,
  drop constraint if exists load_logs_reps_text_format;

alter table public.exercise_load_logs
  drop column if exists weight_text,
  drop column if exists reps_text;
