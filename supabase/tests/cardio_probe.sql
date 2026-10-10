-- Teste da migração 0024 (cardio). Rode DEPOIS da 0024, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha
-- criada. O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)".
-- Cada item deve dizer "ok". Os itens "recusa" esperam um erro do banco (mostrado entre parênteses).

do $$
declare
  v_prot uuid;
  v_student uuid;
  v_trainer uuid;
  v_day uuid;
  v_strength uuid;
  v_cardio uuid;
  v_tpl uuid;
  v_new uuid;
  v_n int;
  v_src int;
  v_out text := '';
begin
  select p.id, p.student_id, s.trainer_id into v_prot, v_student, v_trainer
  from public.protocols p
  join public.students s on s.id = p.student_id
  where p.type = 'workout' and p.is_active
  limit 1;
  if v_prot is null then raise exception 'sem protocolo de treino ativo para testar'; end if;

  -- Faz auth.uid() valer o profissional dono do aluno (as funções de cópia gravam created_by).
  perform set_config('request.jwt.claim.sub', v_trainer::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer)::text, true);

  -- Dados existentes continuam válidos: todos musculação, com séries e repetições.
  select count(*) into v_n from public.exercises
  where kind <> 'strength' or sets is null or reps is null;
  v_out := v_out || format('exercicios antigos todos musculacao: %s | ',
    case when v_n = 0 then 'ok' else 'FALHOU (' || v_n || ')' end);

  insert into public.workout_days (protocol_id, name) values (v_prot, 'zz-cardio-teste') returning id into v_day;
  insert into public.exercises (workout_day_id, name, kind, sets, reps)
    values (v_day, 'zz-forca', 'strength', 3, '10') returning id into v_strength;
  insert into public.exercises (workout_day_id, name, kind, target_minutes, target_distance_km)
    values (v_day, 'zz-corrida', 'cardio', 30, 5) returning id into v_cardio;
  v_out := v_out || 'criar musculacao e cardio: ok | ';

  -- Recusas em exercicios
  begin
    insert into public.exercises (workout_day_id, name, kind, sets, reps) values (v_day, 'zz-x', 'strength', null, '10');
    v_out := v_out || 'recusa musculacao sem series: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa musculacao sem series: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercises (workout_day_id, name, kind) values (v_day, 'zz-x', 'cardio');
    v_out := v_out || 'recusa cardio sem meta: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa cardio sem meta: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercises (workout_day_id, name, kind, target_minutes) values (v_day, 'zz-x', 'cardio', 0);
    v_out := v_out || 'recusa cardio 0 minuto: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa cardio 0 minuto: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercises (workout_day_id, name, kind, target_distance_km) values (v_day, 'zz-x', 'cardio', 0);
    v_out := v_out || 'recusa cardio 0 km: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa cardio 0 km: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercises (workout_day_id, name, kind, sets, reps, target_minutes)
      values (v_day, 'zz-x', 'strength', 3, '10', 20);
    v_out := v_out || 'recusa musculacao com meta de cardio: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa musculacao com meta de cardio: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    update public.exercises set kind = 'cardio' where id = v_strength;
    v_out := v_out || 'recusa mudar o tipo: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa mudar o tipo: ok (%s) | ', left(sqlerrm, 45));
  end;

  -- Registros: recusas
  begin
    insert into public.exercise_load_logs (exercise_id, created_by) values (v_cardio, v_trainer);
    v_out := v_out || 'recusa registro sem nenhum valor: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa registro sem nenhum valor: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, duration_minutes, created_by)
      values (v_strength, 10, 20, v_trainer);
    v_out := v_out || 'recusa musculacao com minutos: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa musculacao com minutos: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercise_load_logs (exercise_id, duration_minutes, created_by)
      values (v_strength, 20, v_trainer);
    v_out := v_out || 'recusa musculacao sem carga: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa musculacao sem carga: ok (%s) | ', left(sqlerrm, 45));
  end;
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, duration_minutes, created_by)
      values (v_cardio, 10, 20, v_trainer);
    v_out := v_out || 'recusa cardio com carga: FALHOU (aceitou) | ';
  exception when others then
    v_out := v_out || format('recusa cardio com carga: ok (%s) | ', left(sqlerrm, 45));
  end;

  -- Registros: aceitos
  insert into public.exercise_load_logs (exercise_id, weight_kg, reps_done, created_by)
    values (v_strength, 10, 8, v_trainer);
  insert into public.exercise_load_logs (exercise_id, duration_minutes, distance_km, created_by)
    values (v_cardio, 30, 5, v_trainer);
  insert into public.exercise_load_logs (exercise_id, distance_km, created_by)
    values (v_cardio, 3, v_trainer);
  v_out := v_out || 'registros validos (carga; minutos e km; so km): ok | ';

  -- Cópia 1: copy_protocol_content (modelos e "aplicar a alunos")
  insert into public.protocols (owner_trainer_id, template_name, type, start_date, end_date, is_active, created_by)
    values (v_trainer, 'zz-modelo-cardio', 'workout', current_date, current_date, false, v_trainer)
    returning id into v_tpl;
  perform public.copy_protocol_content(v_prot, v_tpl);

  select count(*) into v_src from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id where d.protocol_id = v_prot;
  select count(*) into v_n from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id where d.protocol_id = v_tpl;
  v_out := v_out || format('copy_protocol_content copia todos os exercicios (%s de %s): %s | ',
    v_n, v_src, case when v_n = v_src then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_tpl and e.name = 'zz-corrida' and e.kind = 'cardio'
      and e.target_minutes = 30 and e.target_distance_km = 5 and e.sets is null and e.reps is null;
  v_out := v_out || format('copy_protocol_content leva o cardio: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_tpl and e.name = 'zz-forca' and e.kind = 'strength' and e.sets = 3 and e.reps = '10';
  v_out := v_out || format('copy_protocol_content leva a musculacao: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Cópia 2: start_new_protocol duplicando (novo ciclo)
  v_new := public.start_new_protocol(v_student, 'workout', current_date + 30, true);
  select count(*) into v_n from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id where d.protocol_id = v_new;
  v_out := v_out || format('start_new_protocol copia todos os exercicios (%s de %s): %s | ',
    v_n, v_src, case when v_n = v_src then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.exercises e
    join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_new and e.name = 'zz-corrida' and e.kind = 'cardio'
      and e.target_minutes = 30 and e.target_distance_km = 5;
  v_out := v_out || format('start_new_protocol leva o cardio: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Erro final de proposito: reverte tudo que foi criado acima.
  raise exception 'TESTE CONCLUIDO (tudo revertido) -> %', v_out;
end $$;
