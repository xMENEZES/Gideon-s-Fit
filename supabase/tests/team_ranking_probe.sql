-- Teste da migração 0031 (ranking mensal do time). Rode DEPOIS da 0031, no SQL Editor (papel postgres).
-- Precisa de um profissional com pelo menos 2 alunos no time (alunos de verdade, não o Usuário Padrão).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
--
-- O teste liga o ranking, faz os dois alunos aceitarem e confere, na pele de cada pessoa
-- (mesmo método do rls_isolation_probe.sql), o que o ranking devolve e o que fica bloqueado.

do $$
declare
  v_trainer uuid;
  v_a uuid;      -- profile_id do aluno A
  v_b uuid;      -- profile_id do aluno B
  v_a_student uuid;
  v_b_student uuid;
  v_n int;
  v_ok boolean;
  v_out text := '';
  v_month date := date '2000-01-15';
  v_pts_a int;
  v_pts_b int;
begin
  -- Profissional com 2 ou mais alunos de time.
  select s.trainer_id into v_trainer
  from public.students s
  where s.trainer_id <> s.profile_id
  group by s.trainer_id
  having count(*) >= 2
  limit 1;
  if v_trainer is null then raise exception 'sem profissional com 2 alunos no time para testar'; end if;

  select s.profile_id, s.id into v_a, v_a_student from public.students s
    where s.trainer_id = v_trainer and s.profile_id <> s.trainer_id order by s.id limit 1;
  select s.profile_id, s.id into v_b, v_b_student from public.students s
    where s.trainer_id = v_trainer and s.profile_id <> s.trainer_id and s.profile_id <> v_a order by s.id limit 1;

  -- Estado inicial controlado: ranking desligado e ninguém participando.
  delete from public.trainer_settings where trainer_id = v_trainer;
  update public.students set ranking_opt_in = false where trainer_id = v_trainer;

  -- Pontos de janeiro de 2000 (mês que não tem dado real): A = 3 (2 + 1), B = 1.
  insert into public.daily_scores (student_id, score_date, workout_done, diet_done) values
    (v_a_student, date '2000-01-03', true, true),
    (v_a_student, date '2000-01-04', true, false),
    (v_b_student, date '2000-01-03', false, true),
    (v_a_student, date '1999-12-31', true, true);   -- fora do mês: não conta

  -- 1) Ranking desligado: aluno A não vê nada, mesmo chamando.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.team_leaderboard(v_month);
  v_ok := (v_n = 0);
  v_out := v_out || format('desligado devolve vazio: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 2) Aceitar com o ranking desligado é recusado.
  select public.set_ranking_participation(true) into v_ok;
  v_out := v_out || format('aceitar desligado e recusado: %s | ', case when not v_ok then 'ok' else 'FALHOU' end);
  reset role;

  -- 3) O profissional liga (na pele dele, pela política da tabela).
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.trainer_settings (trainer_id, ranking_enabled) values (v_trainer, true);
  v_out := v_out || 'profissional liga o proprio ranking: ok | ';
  reset role;

  -- 4) Ligado, mas o aluno A ainda não aceitou: vazio.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.team_leaderboard(v_month);
  v_ok := (v_n = 0);
  v_out := v_out || format('ligado sem aceite devolve vazio: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 5) A aceita; sozinho, vê só a si mesmo (3 pontos).
  select public.set_ranking_participation(true) into v_ok;
  select count(*), max(total_points) into v_n, v_pts_a from public.team_leaderboard(v_month);
  v_out := v_out || format('A aceita e ve so a si (3 pts): %s | ', case when v_ok and v_n = 1 and v_pts_a = 3 then 'ok' else 'FALHOU' end);
  reset role;

  -- 6) B aceita; os dois aparecem, A (3) na frente de B (1), e cada um se reconhece em is_me.
  perform set_config('request.jwt.claims', json_build_object('sub', v_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.set_ranking_participation(true);
  select count(*), max(total_points) filter (where is_me), max(total_points) filter (where not is_me)
    into v_n, v_pts_b, v_pts_a
    from public.team_leaderboard(v_month);
  v_ok := (v_n = 2 and v_pts_b = 1 and v_pts_a = 3);
  v_out := v_out || format('dois participantes, B ve A=3 e a si=1: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 7) O aluno não consegue ler a linha do outro direto pela tabela.
  select count(*) into v_n from public.students where profile_id <> v_b;
  v_out := v_out || format('B nao le a linha de outro aluno: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- 8) O aluno não consegue ligar o ranking nem mexer em trainer_settings.
  begin
    insert into public.trainer_settings (trainer_id, ranking_enabled) values (v_b, true);
    v_ok := false;
  exception when others then v_ok := true; end;
  v_out := v_out || format('aluno nao grava trainer_settings: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 9) B sai do ranking: A deixa de ver B, B deixa de ver tudo.
  perform public.set_ranking_participation(false);
  select count(*) into v_n from public.team_leaderboard(v_month);
  v_out := v_out || format('B sai e nao ve mais nada: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.team_leaderboard(v_month);
  v_out := v_out || format('A passa a ver so a si: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);
  reset role;

  -- 10) O profissional (não é aluno) chamando o ranking recebe vazio.
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.team_leaderboard(v_month);
  v_out := v_out || format('profissional nao recebe o ranking: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  reset role;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
