-- Exercício conjugado: o registro de carga e de repetições aceita mais de um valor ("10 + 15").
--
-- weight_kg e reps_done continuam numéricos e guardam o PRIMEIRO valor (é o que o gráfico, a
-- carga atual, o dia treinado e os gatilhos já usam). Quando o aluno informa mais de um valor,
-- o texto completo fica em weight_text / reps_text, e é ele que as telas mostram.
-- Os registros antigos não mudam (os textos ficam nulos).
-- Reversão: 0028_rollback.sql

alter table public.exercise_load_logs
  add column weight_text text,
  add column reps_text text;

-- Texto curto, só números separados por " + " (o app grava sempre nesse formato).
alter table public.exercise_load_logs
  add constraint load_logs_weight_text_format
    check (weight_text is null or (
      char_length(weight_text) <= 40
      and weight_text ~ '^[0-9]+([.][0-9]+)?( [+] [0-9]+([.][0-9]+)?){1,3}$'
    )),
  add constraint load_logs_reps_text_format
    check (reps_text is null or (
      char_length(reps_text) <= 40
      and reps_text ~ '^[0-9]+( [+] [0-9]+){1,3}$'
    ));
