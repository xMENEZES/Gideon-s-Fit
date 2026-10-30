-- Teste da migração 0029 (séries feitas). Rode DEPOIS da 0029, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Os itens "recusa" esperam um erro do banco.

do $$
declare
  v_ex uuid;
  v_cardio uuid;
  v_out text := '';
  v_ok boolean;
begin
  select e.id into v_ex
  from public.exercises e
  where e.kind = 'strength'
  limit 1;
  if v_ex is null then raise exception 'sem exercicio de musculacao para testar'; end if;

  -- Registro sem séries continua valendo (registros antigos e campo em branco).
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, logged_at)
    values (v_ex, 20, 10, date '2000-01-01');
  v_out := v_out || 'sem series: ok | ';

  -- Com séries.
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, sets_done, logged_at)
    values (v_ex, 20, 10, 4, date '2000-01-02');
  v_out := v_out || 'com 4 series: ok | ';

  -- Limites 1 e 99.
  insert into public.exercise_load_logs (exercise_id, weight_kg, sets_done, logged_at)
    values (v_ex, 20, 1, date '2000-01-03'), (v_ex, 20, 99, date '2000-01-04');
  v_out := v_out || 'limites 1 e 99: ok | ';

  -- Recusa: zero série.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, sets_done, logged_at)
      values (v_ex, 20, 0, date '2000-01-05');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa 0 series: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Recusa: mais de 99.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, sets_done, logged_at)
      values (v_ex, 20, 100, date '2000-01-06');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa 100 series: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Recusa: séries em registro de cardio (sem carga).
  select e.id into v_cardio from public.exercises e where e.kind = 'cardio' limit 1;
  if v_cardio is not null then
    begin
      insert into public.exercise_load_logs (exercise_id, duration_minutes, sets_done, logged_at)
        values (v_cardio, 30, 3, date '2000-01-07');
      v_ok := false;
    exception when check_violation then v_ok := true; end;
    v_out := v_out || format('recusa series no cardio: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  else
    v_out := v_out || 'recusa series no cardio: pulado (sem exercicio de cardio) | ';
  end if;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
