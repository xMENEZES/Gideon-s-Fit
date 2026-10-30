-- Teste da migração 0030 (dias de descanso). Rode DEPOIS da 0030, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
--
-- Este teste cobre o que o banco garante sem login: a estrutura, o gatilho "já tem exercício
-- registrado" e a chave única. As regras de acesso (RLS) por pessoa são testadas pelo app, com a
-- pessoa logada (marcar o próprio dia funciona; o profissional só lê).

do $$
declare
  v_student uuid;
  v_log_date date;
  v_free date := date '2000-01-01';
  v_out text := '';
  v_ok boolean;
begin
  select s.id into v_student from public.students s limit 1;
  if v_student is null then raise exception 'sem plano (students) para testar'; end if;

  -- Marcar um dia livre funciona (o postgres ignora a RLS; aqui só testamos a tabela e o gatilho).
  insert into public.rest_days (student_id, rest_date) values (v_student, v_free);
  v_out := v_out || 'marcar dia livre: ok | ';

  -- Chave única: o mesmo dia duas vezes é recusado.
  begin
    insert into public.rest_days (student_id, rest_date) values (v_student, v_free);
    v_ok := false;
  exception when unique_violation then v_ok := true; end;
  v_out := v_out || format('recusa dia repetido: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Apagar funciona.
  delete from public.rest_days where student_id = v_student and rest_date = v_free;
  v_out := v_out || 'desmarcar: ok | ';

  -- Dia com exercício registrado não pode virar descanso (usa um plano que tenha registro de carga).
  select p.student_id, l.logged_at into v_student, v_log_date
  from public.exercise_load_logs l
  join public.exercises e on e.id = l.exercise_id
  join public.workout_days d on d.id = e.workout_day_id
  join public.protocols p on p.id = d.protocol_id
  limit 1;
  if v_student is null then
    v_out := v_out || 'recusa dia com treino: pulado (sem registro de carga) | ';
  else
    begin
      insert into public.rest_days (student_id, rest_date) values (v_student, v_log_date);
      v_ok := false;
    exception when others then v_ok := (sqlerrm like '%rest_day_has_workout%'); end;
    v_out := v_out || format('recusa dia com treino: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  end if;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
