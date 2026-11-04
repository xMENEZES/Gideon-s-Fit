-- Teste da migração 0033 (catálogo de exercícios). Rode DEPOIS da 0033, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
-- Os itens "recusa" esperam um erro do banco.

do $$
declare
  v_trainer uuid;
  v_other uuid;
  v_student uuid;
  v_n int;
  v_ok boolean;
  v_out text := '';
begin
  select p.id into v_trainer from public.profiles p where p.role = 'trainer' order by p.created_at limit 1;
  select p.id into v_other from public.profiles p where p.id <> v_trainer order by p.created_at limit 1;
  select p.id into v_student from public.profiles p where p.role = 'student' limit 1;
  if v_trainer is null or v_other is null then raise exception 'faltam perfis para testar'; end if;

  -- Lista do sistema carregada, toda sem dono.
  select count(*) into v_n from public.exercise_catalog where owner_id is null;
  v_out := v_out || format('lista do sistema (%s nomes): %s | ', v_n, case when v_n >= 100 then 'ok' else 'FALHOU' end);

  -- Nome repetido do sistema (sem diferenciar maiúsculas) é recusado.
  begin
    insert into public.exercise_catalog (name, muscle_group) values ('SUPINO RETO COM BARRA', 'peito');
    v_ok := false;
  exception when unique_violation then v_ok := true; end;
  v_out := v_out || format('recusa nome repetido do sistema: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Grupo fora da lista é recusado.
  begin
    insert into public.exercise_catalog (name, muscle_group) values ('Teste de grupo', 'cabeca');
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa grupo invalido: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- A partir daqui age como o profissional (papel authenticated, auth.uid() = profissional).
  perform set_config('request.jwt.claim.sub', v_trainer::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer)::text, true);
  set local role authenticated;

  select count(*) into v_n from public.exercise_catalog where owner_id is null;
  v_out := v_out || format('profissional le a lista do sistema: %s | ', case when v_n >= 100 then 'ok' else 'FALHOU' end);

  insert into public.exercise_catalog (owner_id, name, muscle_group) values (v_trainer, 'Zz Meu exercicio', 'peito');
  v_out := v_out || 'profissional guarda nome proprio: ok | ';

  begin
    insert into public.exercise_catalog (owner_id, name, muscle_group) values (v_trainer, 'zz meu EXERCICIO', 'peito');
    v_ok := false;
  exception when unique_violation then v_ok := true; end;
  v_out := v_out || format('recusa nome proprio repetido: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Não grava nome do sistema nem de outra pessoa.
  begin
    insert into public.exercise_catalog (owner_id, name, muscle_group) values (null, 'Zz Do sistema', 'peito');
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa gravar nome do sistema: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin
    insert into public.exercise_catalog (owner_id, name, muscle_group) values (v_other, 'Zz De outro', 'peito');
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa gravar em nome de outra pessoa: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Não apaga nome do sistema (a linha continua lá).
  delete from public.exercise_catalog where owner_id is null and lower(name) = 'supino reto com barra';
  get diagnostics v_n = row_count;
  v_out := v_out || format('recusa apagar nome do sistema: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- Apaga o próprio nome.
  delete from public.exercise_catalog where owner_id = v_trainer and lower(name) = 'zz meu exercicio';
  get diagnostics v_n = row_count;
  v_out := v_out || format('apaga o proprio nome: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Cota de 200 nomes próprios.
  insert into public.exercise_catalog (owner_id, name, muscle_group)
    select v_trainer, 'Zz Cota ' || g, 'coxas' from generate_series(1, 200) g;
  v_out := v_out || '200 nomes proprios: ok | ';
  begin
    insert into public.exercise_catalog (owner_id, name, muscle_group) values (v_trainer, 'Zz Cota 201', 'coxas');
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%quota_exceeded:exercise_catalog%'; end;
  v_out := v_out || format('recusa o 201o nome: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Outra pessoa não vê os nomes do profissional.
  perform set_config('request.jwt.claim.sub', v_other::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_other)::text, true);
  select count(*) into v_n from public.exercise_catalog where owner_id = v_trainer;
  v_out := v_out || format('outra pessoa nao ve nomes alheios: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- Aluno de time (não monta plano) não grava.
  if v_student is not null then
    perform set_config('request.jwt.claim.sub', v_student::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', v_student)::text, true);
    begin
      insert into public.exercise_catalog (owner_id, name, muscle_group) values (v_student, 'Zz Aluno', 'peito');
      v_ok := false;
    exception when insufficient_privilege then v_ok := true; end;
    v_out := v_out || format('recusa aluno gravar nome: %s | ', case when v_ok then 'ok' else 'FALHOU' end);
  else
    v_out := v_out || 'recusa aluno gravar nome: pulado (sem aluno) | ';
  end if;

  reset role;
  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
