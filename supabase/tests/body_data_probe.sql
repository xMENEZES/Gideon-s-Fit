-- Teste da migração 0037 (dados corporais). Rode DEPOIS da 0037, no SQL Editor (papel postgres).
-- Precisa de um profissional com pelo menos 1 aluno de time (aluno de verdade, não o plano próprio)
-- e de mais um perfil qualquer fora desse time.
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Cada pessoa é "vestida" pelo mesmo método do rls_isolation_probe.sql.

do $$
declare
  v_trainer uuid;
  v_a uuid;          -- aluno do time
  v_c uuid;          -- perfil fora do time
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_n int;
  v_ok boolean;
  v_msg text;
  v_consent timestamptz;
  v_consent2 timestamptz;
  v_out text := '';
begin
  select s.trainer_id, s.profile_id into v_trainer, v_a
  from public.students s
  where s.trainer_id <> s.profile_id
  order by s.id limit 1;
  if v_trainer is null then raise exception 'sem aluno de time para testar'; end if;

  select p.id into v_c from public.profiles p
  where p.id <> v_trainer and p.id <> v_a
    and not exists (select 1 from public.students s where s.profile_id = p.id and s.trainer_id = v_trainer)
  limit 1;
  if v_c is null then raise exception 'sem perfil fora do time para testar'; end if;

  -- Dados do perfil de fora (como postgres), para provar que o profissional não os enxerga.
  delete from public.body_data where profile_id in (v_a, v_c);
  insert into public.body_data (profile_id, birth_date, height_cm, weight_kg)
    values (v_c, date '1990-05-10', 170, 70);

  -- Aluno A, na pele dele.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) Menor de 18 anos é recusado; exatamente 18 anos hoje é aceito; mais de 100 anos é recusado.
  begin
    insert into public.body_data (profile_id, birth_date) values (v_a, v_today - interval '18 years' + interval '1 day');
    v_ok := false; v_msg := '';
  exception when others then v_ok := (sqlerrm = 'body_data_underage'); v_msg := sqlerrm; end;
  v_out := v_out || format('17 anos e 364 dias recusado: %s | ', case when v_ok then 'ok' else 'FALHOU (' || v_msg || ')' end);

  begin
    insert into public.body_data (profile_id, birth_date) values (v_a, v_today - interval '100 years' - interval '1 day');
    v_ok := false; v_msg := '';
  exception when others then v_ok := (sqlerrm = 'body_data_birth_invalid'); v_msg := sqlerrm; end;
  v_out := v_out || format('mais de 100 anos recusado: %s | ', case when v_ok then 'ok' else 'FALHOU (' || v_msg || ')' end);

  begin
    insert into public.body_data (profile_id, birth_date) values (v_a, v_today + 1);
    v_ok := false; v_msg := '';
  exception when others then v_ok := (sqlerrm = 'body_data_underage'); v_msg := sqlerrm; end;
  v_out := v_out || format('data futura recusada: %s | ', case when v_ok then 'ok' else 'FALHOU (' || v_msg || ')' end);

  begin
    insert into public.body_data (profile_id, birth_date, height_cm, weight_kg)
      values (v_a, (v_today - interval '18 years')::date, 100, 30.0);
    v_ok := true;
  exception when others then v_ok := false; v_msg := sqlerrm; end;
  v_out := v_out || format('18 anos exatos, 100 cm e 30 kg aceitos: %s | ', case when v_ok then 'ok' else 'FALHOU (' || coalesce(v_msg, '') || ')' end);

  -- 2) Limites de altura e peso (as bordas passam, um passo além é recusado).
  update public.body_data set height_cm = 250, weight_kg = 300.0 where profile_id = v_a;
  get diagnostics v_n = row_count;
  v_out := v_out || format('250 cm e 300 kg aceitos: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  begin update public.body_data set height_cm = 99 where profile_id = v_a; v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('99 cm recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin update public.body_data set height_cm = 251 where profile_id = v_a; v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('251 cm recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin update public.body_data set weight_kg = 29.9 where profile_id = v_a; v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('29,9 kg recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin update public.body_data set weight_kg = 300.1 where profile_id = v_a; v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('300,1 kg recusado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 3) Altura e peso são opcionais (podem ficar vazios).
  update public.body_data set height_cm = null, weight_kg = null where profile_id = v_a;
  get diagnostics v_n = row_count;
  v_out := v_out || format('altura e peso podem ficar vazios: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);
  update public.body_data set height_cm = 175, weight_kg = 80.5 where profile_id = v_a;

  -- 4) O cliente não grava o instante do aceite nem escreve na linha de outra pessoa.
  begin
    update public.body_data set consented_at = now() - interval '5 years' where profile_id = v_a; v_ok := false;
  exception when others then v_ok := true; end;
  v_out := v_out || format('cliente nao altera consented_at: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin
    insert into public.body_data (profile_id, birth_date) values (v_trainer, date '1980-01-01'); v_ok := false;
  exception when others then v_ok := true; end;
  v_out := v_out || format('aluno nao grava linha de outra pessoa: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- 5) Cada pessoa lê só a própria linha.
  select count(*) into v_n from public.body_data;
  v_out := v_out || format('aluno ve so a propria linha: %s | ', case when v_n = 1 then 'ok' else 'FALHOU (' || v_n || ')' end);
  reset role;

  -- O instante do aceite não muda quando os dados são atualizados.
  select consented_at into v_consent from public.body_data where profile_id = v_a;
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.body_data set weight_kg = 79.0 where profile_id = v_a;
  reset role;
  select consented_at into v_consent2 from public.body_data where profile_id = v_a;
  v_out := v_out || format('atualizar nao muda o aceite: %s | ', case when v_consent = v_consent2 then 'ok' else 'FALHOU' end);

  -- 6) Perfil de fora: não lê a linha de A.
  perform set_config('request.jwt.claims', json_build_object('sub', v_c, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.body_data where profile_id = v_a;
  v_out := v_out || format('perfil de fora nao le o aluno: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  reset role;

  -- 7) Profissional: lê o aluno do time, não lê o perfil de fora e não altera nada.
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.body_data where profile_id = v_a;
  v_out := v_out || format('profissional le o aluno do time: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);
  select count(*) into v_n from public.body_data where profile_id = v_c;
  v_out := v_out || format('profissional nao le perfil fora do time: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  update public.body_data set weight_kg = 50 where profile_id = v_a;
  get diagnostics v_n = row_count;
  v_out := v_out || format('profissional nao altera dados do aluno: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  delete from public.body_data where profile_id = v_a;
  get diagnostics v_n = row_count;
  v_out := v_out || format('profissional nao apaga dados do aluno: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  reset role;

  -- 8) O aluno sai do time: o profissional deixa de ver.
  delete from public.students where profile_id = v_a and trainer_id = v_trainer;
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into v_n from public.body_data where profile_id = v_a;
  v_out := v_out || format('ex-aluno deixa de ser visto: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  reset role;

  -- 9) A pessoa apaga os próprios dados.
  perform set_config('request.jwt.claims', json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  delete from public.body_data where profile_id = v_a;
  get diagnostics v_n = row_count;
  v_out := v_out || format('pessoa apaga os proprios dados: %s', case when v_n = 1 then 'ok' else 'FALHOU' end);
  reset role;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
