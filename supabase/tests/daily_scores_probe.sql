-- Teste da migração 0027 (resultado diário, selos e brecha de datas). Rode DEPOIS da 0027, no
-- SQL Editor (papel postgres). Tudo é desfeito: o bloco termina com um erro de propósito, que
-- reverte qualquer linha criada. O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)".
-- Cada item deve dizer "ok". Usa a data 2001-01-01 (sem registros reais) e protocolos temporários.

do $$
declare
  v_student uuid;
  v_profile uuid;
  v_trainer uuid;
  v_wp uuid;   -- protocolo de treino temporário
  v_dp uuid;   -- protocolo alimentar temporário
  v_day uuid;
  v_ex1 uuid;
  v_ex2 uuid;
  v_m1 uuid;
  v_m2 uuid;
  v_w boolean;
  v_d boolean;
  v_n int;
  v_date date := date '2001-01-01';
  v_out text := '';
begin
  select s.id, s.profile_id, s.trainer_id into v_student, v_profile, v_trainer
  from public.students s limit 1;
  if v_student is null then raise exception 'sem aluno para testar'; end if;

  -- Protocolos temporários (inativos, para não colidir com o ativo do aluno).
  insert into public.protocols (student_id, type, start_date, end_date, is_active, created_by)
    values (v_student, 'workout', v_date, v_date, false, v_trainer) returning id into v_wp;
  insert into public.protocols (student_id, type, start_date, end_date, is_active, created_by)
    values (v_student, 'diet', v_date, v_date, false, v_trainer) returning id into v_dp;

  insert into public.workout_days (protocol_id, name) values (v_wp, 'zz-dia') returning id into v_day;
  insert into public.exercises (workout_day_id, name, kind, sets, reps) values (v_day, 'zz-ex1', 'strength', 3, '10') returning id into v_ex1;
  insert into public.exercises (workout_day_id, name, kind, sets, reps) values (v_day, 'zz-ex2', 'strength', 3, '10') returning id into v_ex2;
  insert into public.meals (protocol_id, name) values (v_dp, 'zz-m1') returning id into v_m1;
  insert into public.meals (protocol_id, name) values (v_dp, 'zz-m2') returning id into v_m2;

  -- Treino: com 1 de 2 exercícios registrados o dia NÃO está concluído; com os 2, está.
  insert into public.exercise_load_logs (exercise_id, weight_kg, logged_at, created_by) values (v_ex1, 10, v_date, v_profile);
  select workout_done, diet_done into v_w, v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('treino 1 de 2: %s | ', case when v_w = false and v_d = false then 'ok' else 'FALHOU' end);
  insert into public.exercise_load_logs (exercise_id, weight_kg, logged_at, created_by) values (v_ex2, 12, v_date, v_profile);
  select workout_done into v_w from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('treino 2 de 2: %s | ', case when v_w then 'ok' else 'FALHOU' end);

  -- Dieta: 1 de 2 refeições feitas = incompleta; as 2 feitas = completa; "não fiz" e desfazer reabrem.
  insert into public.meal_logs (meal_id, log_date, done, created_by) values (v_m1, v_date, true, v_profile);
  select diet_done into v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('dieta 1 de 2: %s | ', case when v_d = false then 'ok' else 'FALHOU' end);
  insert into public.meal_logs (meal_id, log_date, done, created_by) values (v_m2, v_date, true, v_profile);
  select diet_done into v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('dieta 2 de 2: %s | ', case when v_d then 'ok' else 'FALHOU' end);
  update public.meal_logs set done = false where meal_id = v_m2 and log_date = v_date;
  select diet_done into v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('dieta com "nao fiz": %s | ', case when v_d = false then 'ok' else 'FALHOU' end);
  update public.meal_logs set done = true where meal_id = v_m2 and log_date = v_date;
  select diet_done into v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('dieta refeita: %s | ', case when v_d then 'ok' else 'FALHOU' end);
  delete from public.meal_logs where meal_id = v_m2 and log_date = v_date;
  select diet_done into v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('dieta desfeita: %s | ', case when v_d = false then 'ok' else 'FALHOU' end);
  insert into public.meal_logs (meal_id, log_date, done, created_by) values (v_m2, v_date, true, v_profile);

  -- Histórico: apagar os protocolos (em cascata) NÃO apaga nem altera o resultado do dia.
  delete from public.protocols where id in (v_wp, v_dp);
  select workout_done, diet_done into v_w, v_d from public.daily_scores where student_id = v_student and score_date = v_date;
  v_out := v_out || format('historico apos apagar protocolos: %s | ', case when v_w and v_d then 'ok' else 'FALHOU' end);

  -- Segurança: o cliente não escreve em daily_scores nem em achievements, e a brecha de datas fechou.
  insert into public.protocols (student_id, type, start_date, end_date, is_active, created_by)
    values (v_student, 'workout', current_date, current_date, false, v_trainer) returning id into v_wp;
  insert into public.workout_days (protocol_id, name) values (v_wp, 'zz-dia2') returning id into v_day;
  insert into public.exercises (workout_day_id, name, kind, sets, reps) values (v_day, 'zz-ex3', 'strength', 3, '10') returning id into v_ex1;

  perform set_config('request.jwt.claim.sub', v_profile::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_profile)::text, true);
  set local role authenticated;

  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, logged_at, created_by) values (v_ex1, 10, date '2001-01-02', v_profile);
    v_out := v_out || 'carga com data antiga: FALHOU (aceitou) | ';
  exception when insufficient_privilege then
    v_out := v_out || 'carga com data antiga recusada: ok | ';
  end;
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, logged_at, created_by) values (v_ex1, 10, current_date + 5, v_profile);
    v_out := v_out || 'carga com data futura: FALHOU (aceitou) | ';
  exception when insufficient_privilege then
    v_out := v_out || 'carga com data futura recusada: ok | ';
  end;
  begin
    insert into public.exercise_load_logs (exercise_id, weight_kg, logged_at, created_by) values (v_ex1, 10, current_date, v_profile);
    v_out := v_out || 'carga de hoje aceita: ok | ';
  exception when others then
    v_out := v_out || 'carga de hoje: FALHOU (' || sqlerrm || ') | ';
  end;
  begin
    insert into public.daily_scores (student_id, score_date, workout_done, diet_done) values (v_student, date '2001-02-02', true, true);
    v_out := v_out || 'cliente grava daily_scores: FALHOU | ';
  exception when insufficient_privilege then
    v_out := v_out || 'cliente nao grava daily_scores: ok | ';
  end;
  begin
    insert into public.achievements (student_id, line, milestone, earned_on) values (v_student, 'workout', 3, current_date);
    v_out := v_out || 'cliente grava selo: FALHOU | ';
  exception when insufficient_privilege then
    v_out := v_out || 'cliente nao grava selo: ok | ';
  end;

  reset role;

  -- Leitura: o dono do plano enxerga o próprio resultado (política de select).
  perform set_config('request.jwt.claim.sub', v_profile::text, true);
  set local role authenticated;
  select count(*) into v_n from public.daily_scores where student_id = v_student;
  reset role;
  v_out := v_out || format('dono le o proprio resultado: %s | ', case when v_n >= 1 then 'ok' else 'FALHOU' end);

  -- Preenchimento do histórico: todo dia com registro real tem linha em daily_scores.
  select count(*) into v_n from (
    select p.student_id, l.logged_at as d
    from public.exercise_load_logs l
    join public.exercises e on e.id = l.exercise_id
    join public.workout_days wd on wd.id = e.workout_day_id
    join public.protocols p on p.id = wd.protocol_id
    where p.student_id is not null and l.logged_at <> current_date
    except
    select student_id, score_date from public.daily_scores
  ) faltando;
  v_out := v_out || format('historico preenchido (faltando %s): %s | ', v_n, case when v_n = 0 then 'ok' else 'FALHOU' end);

  raise exception 'TESTE CONCLUIDO (tudo revertido) -> %', v_out;
end $$;
