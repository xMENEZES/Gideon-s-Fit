-- Teste da migração 0034 (notificação push). Rode DEPOIS da 0034, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".

do $$
declare
  v_a uuid;
  v_b uuid;
  v_n int;
  v_i int;
  v_ok boolean;
  v_alarm uuid;
  v_other uuid;
  v_out text := '';
  c_p256dh text := repeat('P', 40);
  c_auth text := repeat('A', 20);
begin
  select p.id into v_a from public.profiles p order by p.created_at limit 1;
  select p.id into v_b from public.profiles p where p.id <> v_a order by p.created_at limit 1;
  if v_a is null or v_b is null then raise exception 'faltam perfis para testar'; end if;

  -- ---- Aparelhos: age como a pessoa A
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  set local role authenticated;

  perform public.register_push_subscription('https://push.example.test/aparelho-1-aaaaaaaa', c_p256dh, c_auth, 'teste');
  select count(*) into v_n from public.push_subscriptions;
  v_out := v_out || format('inscrever aparelho: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Inscrever de novo o mesmo endereço atualiza, não duplica.
  perform public.register_push_subscription('https://push.example.test/aparelho-1-aaaaaaaa', c_p256dh, c_auth, 'teste 2');
  select count(*) into v_n from public.push_subscriptions;
  v_out := v_out || format('mesmo aparelho nao duplica: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Gravar direto na tabela não é permitido (só pela função).
  begin
    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
      values (v_a, 'https://push.example.test/direto-aaaaaaaaaaaa', c_p256dh, c_auth);
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa gravar direto na tabela: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Endereço curto demais é recusado.
  begin
    perform public.register_push_subscription('curto', c_p256dh, c_auth);
    v_ok := false;
  exception when check_violation then v_ok := true; end;
  v_out := v_out || format('recusa endereco curto: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Sem login, a função recusa.
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
  begin
    perform public.register_push_subscription('https://push.example.test/sem-login-aaaaaaaa', c_p256dh, c_auth);
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%not_authenticated%'; end;
  v_out := v_out || format('recusa sem login: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- A pessoa B entra no mesmo aparelho: a inscrição passa a ser dela, e a A deixa de ver.
  perform set_config('request.jwt.claim.sub', v_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
  perform public.register_push_subscription('https://push.example.test/aparelho-1-aaaaaaaa', c_p256dh, c_auth, 'aparelho do B');
  select count(*) into v_n from public.push_subscriptions;
  v_out := v_out || format('aparelho passa para a pessoa que entrou: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  select count(*) into v_n from public.push_subscriptions;
  v_out := v_out || format('A nao ve o aparelho que passou para B: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- Cota de 10 aparelhos.
  for v_i in 1..10 loop
    perform public.register_push_subscription('https://push.example.test/cota-' || lpad(v_i::text, 4, '0') || '-aaaaaaaa', c_p256dh, c_auth);
  end loop;
  v_out := v_out || '10 aparelhos: ok | ';
  begin
    perform public.register_push_subscription('https://push.example.test/cota-0011-aaaaaaaa', c_p256dh, c_auth);
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%quota_exceeded:push_subscriptions%'; end;
  v_out := v_out || format('recusa o 11o aparelho: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Apaga o próprio aparelho; o de outra pessoa não.
  delete from public.push_subscriptions where endpoint like '%cota-0001-%';
  get diagnostics v_n = row_count;
  v_out := v_out || format('apaga o proprio aparelho: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  perform set_config('request.jwt.claim.sub', v_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
  delete from public.push_subscriptions where endpoint like '%cota-0002-%';
  get diagnostics v_n = row_count;
  v_out := v_out || format('nao apaga aparelho de outra pessoa: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- ---- Avisos agendados: age como a pessoa A
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);

  insert into public.rest_alarms (user_id, due_at, body)
    values (v_a, now() + interval '60 seconds', 'Supino reto') returning id into v_alarm;
  v_out := v_out || 'criar aviso: ok | ';

  begin
    insert into public.rest_alarms (user_id, due_at, status) values (v_a, now() + interval '60 seconds', 'sent');
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa criar aviso ja enviado: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin
    insert into public.rest_alarms (user_id, due_at) values (v_a, now() + interval '11 minutes');
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa aviso para daqui a 11 minutos: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  begin
    insert into public.rest_alarms (user_id, due_at) values (v_b, now() + interval '60 seconds');
    v_ok := false;
  exception when insufficient_privilege then v_ok := true; end;
  v_out := v_out || format('recusa criar aviso em nome de outra pessoa: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  -- Outra pessoa não vê nem muda o aviso.
  perform set_config('request.jwt.claim.sub', v_b::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_b)::text, true);
  select count(*) into v_n from public.rest_alarms where id = v_alarm;
  v_out := v_out || format('outra pessoa nao ve o aviso: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);
  update public.rest_alarms set status = 'cancelled' where id = v_alarm;
  get diagnostics v_n = row_count;
  v_out := v_out || format('outra pessoa nao cancela o aviso: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- A marca como enviado uma vez só (a trava do "update ... where status = pending").
  perform set_config('request.jwt.claim.sub', v_a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_a)::text, true);
  update public.rest_alarms set status = 'sent' where id = v_alarm and status = 'pending';
  get diagnostics v_n = row_count;
  v_out := v_out || format('marcar enviado: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);
  update public.rest_alarms set status = 'sent' where id = v_alarm and status = 'pending';
  get diagnostics v_n = row_count;
  v_out := v_out || format('segunda marcacao nao leva nada: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- Aviso encerrado não volta a pendente.
  update public.rest_alarms set status = 'pending' where id = v_alarm;
  get diagnostics v_n = row_count;
  v_out := v_out || format('aviso enviado nao volta a pendente: %s | ', case when v_n = 0 then 'ok' else 'FALHOU' end);

  -- Cancelar um aviso pendente.
  insert into public.rest_alarms (user_id, due_at) values (v_a, now() + interval '60 seconds') returning id into v_other;
  update public.rest_alarms set status = 'cancelled' where id = v_other and status = 'pending';
  get diagnostics v_n = row_count;
  v_out := v_out || format('cancelar aviso pendente: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Cota: até 5 avisos pendentes no futuro.
  for v_i in 1..5 loop
    insert into public.rest_alarms (user_id, due_at) values (v_a, now() + interval '120 seconds');
  end loop;
  v_out := v_out || '5 avisos pendentes: ok | ';
  begin
    insert into public.rest_alarms (user_id, due_at) values (v_a, now() + interval '120 seconds');
    v_ok := false;
  exception when others then v_ok := sqlerrm like '%quota_exceeded:rest_alarms%'; end;
  v_out := v_out || format('recusa o 6o aviso pendente: %s | ', case when v_ok then 'ok' else 'FALHOU' end);

  reset role;
  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
