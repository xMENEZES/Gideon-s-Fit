-- Teste da migração 0032 (equipamento no registro de carga). Rode DEPOIS da 0032, no SQL Editor
-- (papel postgres). Tudo é desfeito: o bloco termina com um erro de propósito, que reverte
-- qualquer linha criada. O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)".
-- Cada item deve dizer "ok". Os itens "recusa" esperam um erro do banco.

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

  -- Registro sem equipamento continua valendo (registros antigos e escolha em branco).
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, logged_at)
    values (v_ex, 20, 10, date '2000-01-01');
  v_out := v_out || 'sem equipamento: ok | ';

  -- Os três equipamentos.
  insert into public.exercise_load_logs (exercise_id, weight_kg, equipment, logged_at)
    values (v_ex, 20, 'halter', date '2000-01-02'),
           (v_ex, 20, 'maquina', date '2000-01-03'),
           (v_ex, 20, 'barra', date '2000-01-04');
  v_out := v_out || 'halter, maquina e barra: ok | ';

  -- Recusa: valor fora da lista.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, equipment, logged_at)
      values (v_ex, 20, 'polia', date '2000-01-05');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa valor fora da lista: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Recusa: equipamento em registro de cardio (sem carga).
  select e.id into v_cardio from public.exercises e where e.kind = 'cardio' limit 1;
  if v_cardio is not null then
    begin
      insert into public.exercise_load_logs (exercise_id, duration_minutes, equipment, logged_at)
        values (v_cardio, 30, 'halter', date '2000-01-06');
      v_ok := false;
    exception when check_violation then v_ok := true; end;
    v_out := v_out || format('recusa equipamento no cardio: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  else
    v_out := v_out || 'recusa equipamento no cardio: pulado (sem exercicio de cardio) | ';
  end if;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
