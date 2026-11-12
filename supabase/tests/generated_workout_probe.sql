-- Teste da migração 0038 (gerador de treino: descanso opcional e create_generated_workout).
-- Rode DEPOIS da 0038, no SQL Editor (papel postgres). Precisa de um Usuário Padrão com plano próprio,
-- de um aluno de time (role student) e de um profissional.
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Cada pessoa é "vestida" pelo mesmo método do rls_isolation_probe.sql.

do $$
declare
  v_std uuid;        -- Usuário Padrão
  v_solo uuid;       -- linha do plano próprio dele em students
  v_stu uuid;        -- aluno de time
  v_stu_row uuid;
  v_trainer uuid;
  v_ok boolean;
  v_n int;
  v_id uuid;
  v_old uuid;
  v_out text := '';
  v_labels text[];
  v_payloads text[];
  v_i int;
  v_bad int := 0;
  v_valid text := '[
    {"name":"A - Corpo inteiro","exercises":[
      {"kind":"strength","name":"Agachamento livre (peso do corpo)","sets":3,"reps":"10-12"},
      {"kind":"strength","name":"Prancha","sets":2,"reps":"20-30 s"},
      {"kind":"cardio","name":"Caminhada","targetMinutes":20,"notes":"Ritmo moderado"}]},
    {"name":"B - Corpo inteiro","exercises":[
      {"kind":"strength","name":"Ponte de glúteos","sets":3,"reps":"12-15"}]}
  ]';
begin
  select s.profile_id, s.id into v_std, v_solo
    from public.students s join public.profiles p on p.id = s.profile_id
    where s.trainer_id = s.profile_id and p.role = 'standard' order by s.id limit 1;
  if v_std is null then raise exception 'sem Usuario Padrao com plano proprio para testar'; end if;

  select s.profile_id, s.id into v_stu, v_stu_row
    from public.students s join public.profiles p on p.id = s.profile_id
    where s.trainer_id <> s.profile_id and p.role = 'student' order by s.id limit 1;
  if v_stu is null then raise exception 'sem aluno de time para testar'; end if;

  select id into v_trainer from public.profiles where role = 'trainer' limit 1;
  if v_trainer is null then raise exception 'sem profissional para testar'; end if;

  -- Estado inicial controlado (como postgres): nenhum protocolo ativo no plano próprio, e uma dieta ativa.
  update public.protocols set is_active = false where student_id = v_solo and is_active;
  insert into public.protocols (student_id, type, start_date, end_date, created_by)
    values (v_solo, 'diet', current_date, current_date + 30, v_std);
  insert into public.protocols (student_id, type, start_date, end_date, created_by)
    values (v_solo, 'workout', current_date - 10, current_date + 30, v_std)
    returning id into v_old;

  -- Usuário Padrão, na pele dele.
  perform set_config('request.jwt.claims', json_build_object('sub', v_std, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) Grava o plano completo.
  select public.create_generated_workout(v_solo, current_date, current_date + 56, 'Observação do gerador', v_valid::jsonb) into v_id;
  v_ok := v_id is not null
    and exists (select 1 from public.protocols where id = v_id and type = 'workout' and is_active
                and notes = 'Observação do gerador' and end_date = current_date + 56);
  v_out := v_out || format('grava o protocolo ativo com as observacoes: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.workout_days where protocol_id = v_id;
  v_out := v_out || format('2 dias: %s | ', case when v_n = 2 then 'ok' else 'FALHOU (' || v_n || ')' end);

  select count(*) into v_n from public.exercises e join public.workout_days d on d.id = e.workout_day_id where d.protocol_id = v_id;
  v_out := v_out || format('4 exercicios: %s | ', case when v_n = 4 then 'ok' else 'FALHOU (' || v_n || ')' end);

  select count(*) into v_n from public.exercises e join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_id and e.rest_seconds is null;
  v_out := v_out || format('nenhum exercicio com descanso: %s | ', case when v_n = 4 then 'ok' else 'FALHOU (' || v_n || ')' end);

  select count(*) into v_n from public.exercises e join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_id and e.kind = 'cardio' and e.target_minutes = 20 and e.sets is null and e.reps is null
      and e.notes = 'Ritmo moderado';
  v_out := v_out || format('cardio com minutos e sem series: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.exercises e join public.workout_days d on d.id = e.workout_day_id
    where d.protocol_id = v_id and e.kind = 'strength' and e.name = 'Prancha' and e.sets = 2 and e.reps = '20-30 s' and e.sort_order = 1;
  v_out := v_out || format('forca com series, repeticoes por tempo e ordem: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.workout_days where protocol_id = v_id and sort_order in (0, 1);
  v_out := v_out || format('ordem dos dias 0 e 1: %s | ', case when v_n = 2 then 'ok' else 'FALHOU' end);

  -- 2) O treino ativo anterior vai para o histórico e a dieta não é tocada.
  v_ok := exists (select 1 from public.protocols where id = v_old and not is_active);
  select count(*) into v_n from public.protocols where student_id = v_solo and type = 'workout' and is_active;
  v_out := v_out || format('treino anterior vai para o historico, so 1 ativo: %s | ', case when v_ok and v_n = 1 then 'ok' else 'FALHOU' end);
  v_ok := exists (select 1 from public.protocols where student_id = v_solo and type = 'diet' and is_active);
  v_out := v_out || format('dieta ativa nao e tocada: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 3) Recusa de formatos inválidos (cada caso deve dar generated_workout_invalid).
  v_labels := array[
    'dias nao e lista', 'lista vazia', '15 dias', 'nome do dia curto', 'dia sem nome', 'dia sem exercicios',
    'tipo desconhecido', 'sem tipo', 'series 0', 'series 51', 'series em texto', 'sem repeticoes',
    'cardio sem minutos', 'cardio 0 min', 'cardio 1441 min', 'nome do exercicio curto',
    'nota de exercicio com mais de 1000', 'exercicio nao e objeto', '41 exercicios no dia'
  ];
  v_payloads := array[
    '{"a":1}',
    '[]',
    (select jsonb_agg(jsonb_build_object('name', 'Dia ' || g, 'exercises',
       jsonb_build_array(jsonb_build_object('kind','strength','name','Prancha','sets',2,'reps','20 s'))))::text
     from generate_series(1, 15) g),
    '[{"name":"A","exercises":[{"kind":"strength","name":"Prancha","sets":2,"reps":"20 s"}]}]',
    '[{"exercises":[{"kind":"strength","name":"Prancha","sets":2,"reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[]}]',
    '[{"name":"A - X","exercises":[{"kind":"yoga","name":"Prancha","sets":2,"reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[{"name":"Prancha","sets":2,"reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[{"kind":"strength","name":"Prancha","sets":0,"reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[{"kind":"strength","name":"Prancha","sets":51,"reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[{"kind":"strength","name":"Prancha","sets":"3","reps":"20 s"}]}]',
    '[{"name":"A - X","exercises":[{"kind":"strength","name":"Prancha","sets":2,"reps":""}]}]',
    '[{"name":"A - X","exercises":[{"kind":"cardio","name":"Caminhada"}]}]',
    '[{"name":"A - X","exercises":[{"kind":"cardio","name":"Caminhada","targetMinutes":0}]}]',
    '[{"name":"A - X","exercises":[{"kind":"cardio","name":"Caminhada","targetMinutes":1441}]}]',
    '[{"name":"A - X","exercises":[{"kind":"strength","name":"P","sets":2,"reps":"20 s"}]}]',
    (select jsonb_build_array(jsonb_build_object('name','A - X','exercises',jsonb_build_array(
       jsonb_build_object('kind','strength','name','Prancha','sets',2,'reps','20 s','notes',repeat('x',1001)))))::text),
    '[{"name":"A - X","exercises":["Prancha"]}]',
    (select jsonb_build_array(jsonb_build_object('name','A - X','exercises',
       (select jsonb_agg(jsonb_build_object('kind','strength','name','Exercicio ' || g,'sets',2,'reps','10')) from generate_series(1, 41) g)))::text)
  ];
  for v_i in 1 .. array_length(v_labels, 1) loop
    begin
      perform public.create_generated_workout(v_solo, current_date, current_date + 56, null, v_payloads[v_i]::jsonb);
      v_ok := false;
    exception when others then
      v_ok := (sqlerrm = 'generated_workout_invalid');
    end;
    if not v_ok then
      v_bad := v_bad + 1;
      v_out := v_out || format('recusa "%s": FALHOU | ', v_labels[v_i]);
    end if;
  end loop;
  v_out := v_out || format('%s formatos invalidos recusados: %s | ', array_length(v_labels, 1), case when v_bad = 0 then 'ok' else 'FALHOU' end);

  begin
    perform public.create_generated_workout(v_solo, current_date, current_date + 56, repeat('x', 2001), v_valid::jsonb);
    v_ok := false;
  exception when others then v_ok := (sqlerrm = 'generated_workout_invalid'); end;
  v_out := v_out || format('observacoes com mais de 2000 recusadas: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 4) Tudo ou nada: o 2º dia inválido não deixa nada para trás, e o treino ativo continua o mesmo.
  begin
    perform public.create_generated_workout(v_solo, current_date, current_date + 56, null,
      '[{"name":"A - X","exercises":[{"kind":"strength","name":"Prancha","sets":2,"reps":"20 s"}]},{"name":"B - X","exercises":[]}]'::jsonb);
    v_ok := false;
  exception when others then v_ok := true; end;
  select count(*) into v_n from public.protocols where student_id = v_solo and type = 'workout' and is_active and id = v_id;
  v_out := v_out || format('tudo ou nada: o treino ativo continua o mesmo: %s | ', case when v_ok and v_n = 1 then 'ok' else 'FALHOU' end);

  -- Data de término antes do início é recusada pela restrição da tabela.
  begin
    perform public.create_generated_workout(v_solo, current_date, current_date - 1, null, v_valid::jsonb);
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('termino antes do inicio recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 5) Descanso opcional na tabela: pode ser nulo, e os limites de 5 a 3600 continuam valendo.
  update public.exercises set rest_seconds = null where workout_day_id in (select id from public.workout_days where protocol_id = v_id);
  update public.exercises set rest_seconds = 5 where workout_day_id in (select id from public.workout_days where protocol_id = v_id) and name = 'Prancha';
  begin update public.exercises set rest_seconds = 4 where workout_day_id in (select id from public.workout_days where protocol_id = v_id); v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('descanso 4 s continua recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  begin update public.exercises set rest_seconds = 3601 where workout_day_id in (select id from public.workout_days where protocol_id = v_id); v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('descanso 3601 s continua recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  insert into public.exercises (workout_day_id, name, kind, sets, reps)
    select id, 'Teste sem descanso', 'strength', 3, '10' from public.workout_days where protocol_id = v_id order by sort_order limit 1;
  select count(*) into v_n from public.exercises where name = 'Teste sem descanso' and rest_seconds is null;
  v_out := v_out || format('exercicio novo sem descanso fica sem valor (sem padrao de 60 s): %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Outro plano próprio: o Usuário Padrão não grava no plano de um aluno de time.
  begin
    perform public.create_generated_workout(v_stu_row, current_date, current_date + 56, null, v_valid::jsonb); v_ok := false;
  exception when others then v_ok := (sqlerrm = 'generated_workout_student'); end;
  v_out := v_out || format('nao grava no plano de outra pessoa: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  reset role;

  -- 6) Aluno de time e profissional não usam a função.
  perform set_config('request.jwt.claims', json_build_object('sub', v_stu, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.create_generated_workout(v_stu_row, current_date, current_date + 56, null, v_valid::jsonb); v_ok := false;
  exception when others then v_ok := (sqlerrm = 'generated_workout_forbidden'); end;
  v_out := v_out || format('aluno de time recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.create_generated_workout(v_solo, current_date, current_date + 56, null, v_valid::jsonb); v_ok := false;
  exception when others then v_ok := (sqlerrm = 'generated_workout_forbidden'); end;
  v_out := v_out || format('profissional recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  reset role;

  -- 7) Sem login (anon) a função nem executa.
  set local role anon;
  begin
    perform public.create_generated_workout(v_solo, current_date, current_date + 56, null, v_valid::jsonb); v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('anon sem permissao: %s', case when v_ok then 'ok' else 'FALHOU' end);
  reset role;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
