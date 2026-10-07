-- Teste de isolamento entre contas (RLS). Rode no SQL Editor do Supabase.
--
-- Como usar:
--   1) Rode a CONSULTA 0 e anote os ids (coluna id) de cada conta.
--   2) Para CADA conta (profissional, aluno do time, Usuario Padrao), faça duas execucoes:
--        a) cole a PARTE A, troque UUID_DA_CONTA e execute  -> mostra quantas linhas a conta enxerga
--        b) cole a PARTE B, troque UUID_DA_CONTA e execute  -> mostra se ela consegue "escalar"
--   3) Compare com a tabela de resultado esperado no fim deste arquivo.
--
-- Seguranca do teste: as funcoes sao temporarias (pg_temp), somem sozinhas ao fim da sessao,
-- e nada e gravado. Na PARTE B, se alguma tentativa DER CERTO (o que seria uma falha grave),
-- ela e desfeita automaticamente pelo proprio teste e aparece como "FALHA GRAVE".

-- =====================================================================================
-- CONSULTA 0: lista as contas (rode sozinha)
-- =====================================================================================
select id, email, role, full_name from public.profiles order by role, email;


-- =====================================================================================
-- PARTE A: quantas linhas a conta enxerga em cada tabela
-- (troque UUID_DA_CONTA no ultimo comando; rode TUDO de uma vez)
-- =====================================================================================
create or replace function pg_temp.rls_contagens(p_uid uuid)
returns table (tabela text, linhas bigint)
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;

  return query select 'profiles'::text,              count(*) from public.profiles;
  return query select 'students'::text,              count(*) from public.students;
  return query select 'protocols (todos)'::text,     count(*) from public.protocols;
  return query select 'modelos (templates)'::text,   count(*) from public.protocols where owner_trainer_id is not null;
  return query select 'workout_days'::text,          count(*) from public.workout_days;
  return query select 'exercises'::text,             count(*) from public.exercises;
  return query select 'exercise_load_logs'::text,    count(*) from public.exercise_load_logs;
  return query select 'meals'::text,                 count(*) from public.meals;
  return query select 'meal_options'::text,          count(*) from public.meal_options;
  return query select 'meal_items'::text,            count(*) from public.meal_items;
  return query select 'meal_logs'::text,             count(*) from public.meal_logs;
  return query select 'team_codes'::text,            count(*) from public.team_codes;
  return query select 'team_join_requests'::text,    count(*) from public.team_join_requests;
  return query select 'team_join_attempts'::text,    count(*) from public.team_join_attempts;
end;
$$;

select * from pg_temp.rls_contagens('UUID_DA_CONTA');


-- =====================================================================================
-- PARTE B: tentativas de escalada (todas devem ser bloqueadas para QUALQUER conta)
-- (troque UUID_DA_CONTA no ultimo comando; rode TUDO de uma vez)
-- =====================================================================================
create or replace function pg_temp.rls_escalada(p_uid uuid)
returns table (tentativa text, resultado text)
language plpgsql
as $$
declare
  n bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) virar administrador editando o proprio perfil
  tentativa := 'alterar o proprio papel (profiles.role)';
  begin
    update public.profiles set role = 'admin' where id = p_uid;
    get diagnostics n = row_count;
    if n > 0 then raise exception 'CONSEGUIU'; end if;
    resultado := 'OK: nenhuma linha alterada'; return next;
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 2) trocar o profissional responsavel por um vinculo
  tentativa := 'alterar students.trainer_id';
  begin
    update public.students set trainer_id = p_uid;
    get diagnostics n = row_count;
    if n > 0 then raise exception 'CONSEGUIU'; end if;
    resultado := 'OK: nenhuma linha alterada'; return next;
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 3) criar um vinculo de aluno diretamente (so o servidor pode)
  tentativa := 'inserir em students';
  begin
    insert into public.students (trainer_id, profile_id, email)
    values (p_uid, p_uid, 'teste-rls@example.com');
    raise exception 'CONSEGUIU';
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 4) aprovar a propria solicitacao de entrada em um time
  tentativa := 'alterar team_join_requests';
  begin
    update public.team_join_requests set status = 'approved';
    get diagnostics n = row_count;
    if n > 0 then raise exception 'CONSEGUIU'; end if;
    resultado := 'OK: nenhuma linha alterada'; return next;
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 5) criar uma solicitacao de entrada direto no banco (pula o limite de tentativas)
  tentativa := 'inserir em team_join_requests';
  begin
    insert into public.team_join_requests (trainer_id, user_id) values (p_uid, p_uid);
    raise exception 'CONSEGUIU';
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 6) apagar codigos de time
  tentativa := 'apagar team_codes';
  begin
    delete from public.team_codes;
    get diagnostics n = row_count;
    if n > 0 then raise exception 'CONSEGUIU'; end if;
    resultado := 'OK: nenhuma linha apagada'; return next;
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;

  -- 7) falsificar um registro de carga ja existente
  tentativa := 'alterar exercise_load_logs';
  begin
    update public.exercise_load_logs set weight_kg = 999;
    get diagnostics n = row_count;
    if n > 0 then raise exception 'CONSEGUIU'; end if;
    resultado := 'OK: nenhuma linha alterada'; return next;
  exception when others then
    if sqlerrm = 'CONSEGUIU' then resultado := 'FALHA GRAVE: conseguiu (desfeito pelo teste)';
    else resultado := 'OK: bloqueado (' || sqlerrm || ')'; end if;
    return next;
  end;
end;
$$;

select * from pg_temp.rls_escalada('UUID_DA_CONTA');


-- =====================================================================================
-- RESULTADO ESPERADO (PARTE A)
--   Qualquer numero MAIOR que o esperado indica vazamento entre contas.
--
--   Tabela                | Aluno do time        | Usuario Padrao        | Profissional
--   ----------------------+----------------------+-----------------------+-----------------------------
--   profiles              | 1 (so ele)           | 1 (so ele)            | ele + as pessoas do time dele
--   students              | 1 (o vinculo dele)   | 1 (plano proprio)     | so os alunos dele
--   modelos (templates)   | 0                    | 0                     | so os dele
--   team_codes            | 0                    | 0                     | 1 (o dele)
--   team_join_requests    | so as dele           | so as dele            | so as recebidas por ele
--   team_join_attempts    | 0                    | 0                     | 0
--   demais tabelas        | so dados do protocolo| so dados do plano     | so dados dos alunos dele
--                         | dele                 | proprio               |
--
-- RESULTADO ESPERADO (PARTE B)
--   As 7 linhas devem comecar com "OK". Qualquer "FALHA GRAVE" deve ser tratada como
--   prioridade maxima: me envie o resultado antes de qualquer outra coisa.
-- =====================================================================================
