-- Teste da migração 0036 (equipamento Cross). Rode DEPOIS da 0036, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Os itens "recusa" esperam um erro do banco.

do $$
declare
  v_ex uuid;
  v_by uuid;
  v_out text := '';
  v_ok boolean;
begin
  select e.id into v_ex from public.exercises e where e.kind = 'strength' limit 1;
  if v_ex is null then raise exception 'sem exercicio de musculacao para testar'; end if;
  -- created_by é obrigatório: usa qualquer perfil existente (tudo é revertido no fim).
  select p.id into v_by from public.profiles p limit 1;
  if v_by is null then raise exception 'sem perfil para usar em created_by'; end if;

  -- Cross e os equipamentos antigos continuam valendo.
  insert into public.exercise_load_logs (exercise_id, weight_kg, equipment, logged_at, created_by)
    values (v_ex, 20, 'cross', date '2000-01-01', v_by),
           (v_ex, 20, 'halter', date '2000-01-02', v_by),
           (v_ex, 20, 'maquina', date '2000-01-03', v_by),
           (v_ex, 20, 'barra', date '2000-01-04', v_by);
  v_out := v_out || 'cross, halter, maquina e barra: ok | ';

  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, logged_at, created_by)
    values (v_ex, 20, 10, date '2000-01-05', v_by);
  v_out := v_out || 'sem equipamento: ok | ';

  -- Recusa: valor fora da lista.
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, equipment, logged_at, created_by)
      values (v_ex, 20, 'polia', date '2000-01-06', v_by);
    v_ok := false;
  exception when check_violation then
    v_ok := true;
  end;
  v_out := v_out || 'recusa valor fora da lista: ' || case when v_ok then 'ok' else 'FALHOU' end || ' | ';

  -- Recusa: Cross sem peso (a regra "só musculação com carga" continua valendo).
  begin
    insert into public.exercise_load_logs (exercise_id, equipment, reps_done, logged_at, created_by)
      values (v_ex, 'cross', 10, date '2000-01-07', v_by);
    v_ok := false;
  exception when check_violation then
    v_ok := true;
  end;
  v_out := v_out || 'recusa cross sem peso: ' || case when v_ok then 'ok' else 'FALHOU' end;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
