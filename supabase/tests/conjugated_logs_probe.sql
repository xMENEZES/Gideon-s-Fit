-- Teste da migração 0028 (exercício conjugado). Rode DEPOIS da 0028, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Os itens "recusa" esperam um erro do banco.

do $$
declare
  v_ex uuid;
  v_out text := '';
  v_ok boolean;
begin
  select e.id into v_ex
  from public.exercises e
  where e.kind = 'strength'
  limit 1;
  if v_ex is null then raise exception 'sem exercicio de musculacao para testar'; end if;

  -- Registro simples continua valendo (sem texto).
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, logged_at)
    values (v_ex, 20, 10, date '2000-01-01');
  v_out := v_out || 'registro simples: ok | ';

  -- Conjugado: primeiro valor numérico + texto completo.
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, weight_text, reps_text, logged_at)
    values (v_ex, 10, 12, '10 + 15', '12 + 10', date '2000-01-02');
  v_out := v_out || 'conjugado 10 + 15: ok | ';

  -- Decimais e três valores.
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, weight_text, reps_text, logged_at)
    values (v_ex, 7.5, 12, '7.5 + 10 + 12.5', '12 + 10 + 8', date '2000-01-03');
  v_out := v_out || 'tres valores: ok | ';

  -- Recusa: texto fora do formato.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, weight_text, logged_at)
      values (v_ex, 10, '10 + abc', date '2000-01-04');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa texto invalido: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Recusa: mais de quatro valores.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, reps_text, logged_at)
      values (v_ex, 10, '1 + 2 + 3 + 4 + 5', date '2000-01-05');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa cinco valores: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Recusa: texto longo demais.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, weight_text, logged_at)
      values (v_ex, 10, repeat('1', 41) || ' + 2', date '2000-01-06');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa texto longo: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
