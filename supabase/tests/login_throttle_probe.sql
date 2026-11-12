-- Teste da migração 0035 (atraso progressivo no login). Rode DEPOIS da 0035, no SQL Editor (papel postgres).
-- Tudo é desfeito: o bloco termina com um erro de propósito, que reverte qualquer linha criada.
-- O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)". Cada item deve dizer "ok".
--
-- Usa chaves de teste ("probe:...") e a mesma política do app (src/lib/login-throttle.ts):
--   ip: a cada 20 erros, só conta erro | e-mail+ip: a cada 3 tentativas | e-mail: a cada 10 tentativas.
-- O tempo é simulado mexendo em locked_until e last_hit_at.

do $$
declare
  v_policy jsonb := '[
    {"step":20,"decay":3600,"schedule":[60,300,900,3600],"count_now":false},
    {"step":3,"decay":86400,"schedule":[60,300,900,3600],"count_now":true},
    {"step":10,"decay":3600,"schedule":[60,300,900],"count_now":true}
  ]'::jsonb;
  v_ip text := 'probe:ip';
  v_ei text := 'probe:ei';
  v_em text := 'probe:em';
  v_keys text[];
  v_out text := '';
  v_r record;
  v_n int;
  v_ok boolean;
  v_i int;
  v_wait int;
begin
  v_keys := array[v_ip, v_ei, v_em];
  delete from public.login_throttle where key like 'probe:%';

  -- 1) Tentativas 1 e 2 passam; a 3ª passa e inicia 60 s; a 4ª é barrada.
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_ok := not v_r.blocked and v_r.wait_seconds = 0;
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_ok := v_ok and not v_r.blocked and v_r.wait_seconds = 0;
  v_out := v_out || format(E'\n1ª e 2ª tentativas passam sem espera: %s', case when v_ok then 'ok' else 'FALHOU' end);

  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_out := v_out || format(E'\n3ª tentativa passa e inicia 60 s: %s',
    case when not v_r.blocked and v_r.wait_seconds = 60 then 'ok' else 'FALHOU (' || v_r.blocked || ',' || v_r.wait_seconds || ')' end);

  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_out := v_out || format(E'\n4ª tentativa é barrada com cerca de 60 s: %s',
    case when v_r.blocked and v_r.wait_seconds between 55 and 60 then 'ok' else 'FALHOU (' || v_r.blocked || ',' || v_r.wait_seconds || ')' end);

  select fail_count into v_n from public.login_throttle where key = v_ei;
  v_out := v_out || format(E'\ntentativa barrada não conta (contador continua em 3): %s',
    case when v_n = 3 then 'ok' else 'FALHOU (' || v_n || ')' end);

  -- 2) Passada a espera: 4ª e 5ª passam; a 6ª inicia 5 min; a 7ª é barrada.
  update public.login_throttle set locked_until = now() - interval '1 second' where key like 'probe:%';
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_ok := not v_r.blocked and v_r.wait_seconds = 0;
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_ok := v_ok and not v_r.blocked and v_r.wait_seconds = 0;
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_out := v_out || format(E'\napós a espera, 4ª e 5ª passam e a 6ª inicia 300 s: %s',
    case when v_ok and not v_r.blocked and v_r.wait_seconds = 300 then 'ok' else 'FALHOU' end);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_out := v_out || format(E'\n7ª tentativa é barrada com cerca de 5 min: %s',
    case when v_r.blocked and v_r.wait_seconds between 295 and 300 then 'ok' else 'FALHOU (' || v_r.wait_seconds || ')' end);

  -- 3) Degraus seguintes: 9ª -> 900 s, 12ª -> 3600 s, 15ª -> 3600 s (repete o último). A 10ª também
  --    faz o contador do e-mail (a cada 10) iniciar 60 s; como o do e-mail+ip não trava nela, vale 60.
  v_ok := true;
  for v_i in 7..15 loop
    update public.login_throttle set locked_until = now() - interval '1 second' where key like 'probe:%';
    select * into v_r from public.login_throttle_begin(v_keys, v_policy);
    v_wait := v_r.wait_seconds;
    if v_i = 9 and v_wait <> 900 then v_ok := false; end if;
    if v_i = 10 and v_wait <> 60 then v_ok := false; end if;
    if v_i = 12 and v_wait <> 3600 then v_ok := false; end if;
    if v_i = 15 and v_wait <> 3600 then v_ok := false; end if;
  end loop;
  v_out := v_out || format(E'\ndegraus 900 s (9ª), 60 s do e-mail (10ª), 3600 s (12ª) e 3600 s (15ª): %s',
    case when v_ok then 'ok' else 'FALHOU' end);

  -- 4) Login certo zera e-mail+ip e e-mail, e a contagem recomeça.
  perform public.login_throttle_clear(array[v_ei, v_em]);
  select count(*) into v_n from public.login_throttle where key in (v_ei, v_em);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  v_out := v_out || format(E'\nlogin certo zera os contadores do e-mail: %s',
    case when v_n = 0 and not v_r.blocked and v_r.wait_seconds = 0 then 'ok' else 'FALHOU' end);

  -- 5) Contador esquecido: sem tentativas há mais tempo que o prazo, recomeça do zero.
  update public.login_throttle set last_hit_at = now() - interval '2 days', locked_until = null
   where key in (v_ei, v_em);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  select fail_count into v_n from public.login_throttle where key = v_ei;
  v_out := v_out || format(E'\ncontador antigo zera e conta de novo (3 tentativas, 60 s): %s',
    case when v_n = 3 and v_r.wait_seconds = 60 then 'ok' else 'FALHOU (' || v_n || ',' || v_r.wait_seconds || ')' end);

  -- 6) Espera do IP barra qualquer e-mail e a tentativa barrada não é contada.
  delete from public.login_throttle where key like 'probe:%';
  insert into public.login_throttle (key, fail_count, locked_until) values (v_ip, 20, now() + interval '60 seconds');
  select * into v_r from public.login_throttle_begin(v_keys, v_policy);
  select coalesce(sum(fail_count), 0) into v_n from public.login_throttle where key in (v_ei, v_em);
  v_out := v_out || format(E'\nIP em espera barra o e-mail e nada é contado: %s',
    case when v_r.blocked and v_r.wait_seconds between 55 and 60 and v_n = 0 then 'ok' else 'FALHOU' end);

  -- 7) Contador só de erros do IP: 19 erros sem espera, o 20º inicia 60 s.
  delete from public.login_throttle where key like 'probe:%';
  v_ok := true;
  for v_i in 1..19 loop
    if public.login_throttle_fail(v_ip, 20, 3600, '[60,300,900,3600]'::jsonb) <> 0 then v_ok := false; end if;
  end loop;
  v_wait := public.login_throttle_fail(v_ip, 20, 3600, '[60,300,900,3600]'::jsonb);
  v_out := v_out || format(E'\nIP: 19 erros sem espera e o 20º inicia 60 s: %s',
    case when v_ok and v_wait = 60 then 'ok' else 'FALHOU (' || v_wait || ')' end);

  -- 8) Contador do e-mail (qualquer IP): a 10ª tentativa inicia 60 s.
  delete from public.login_throttle where key like 'probe:%';
  v_ok := true;
  for v_i in 1..9 loop
    select * into v_r from public.login_throttle_begin(array[v_ip, 'probe:ei' || v_i, v_em], v_policy);
    if v_r.blocked or v_r.wait_seconds <> 0 then v_ok := false; end if;
  end loop;
  select * into v_r from public.login_throttle_begin(array[v_ip, 'probe:ei10', v_em], v_policy);
  v_out := v_out || format(E'\ne-mail: 9 tentativas de IPs diferentes passam e a 10ª inicia 60 s: %s',
    case when v_ok and not v_r.blocked and v_r.wait_seconds = 60 then 'ok' else 'FALHOU (' || v_r.wait_seconds || ')' end);

  -- 9) Sem acesso para anon e para usuário logado (tabela e funções).
  for v_i in 1..2 loop
    begin
      execute case v_i when 1 then 'set local role anon' else 'set local role authenticated' end;
      perform 1 from public.login_throttle limit 1;
      v_out := v_out || format(E'\n%s lê a tabela: FALHOU', case v_i when 1 then 'anon' else 'authenticated' end);
    exception when insufficient_privilege then
      v_out := v_out || format(E'\n%s não lê a tabela: ok', case v_i when 1 then 'anon' else 'authenticated' end);
    end;
    reset role;
    begin
      execute case v_i when 1 then 'set local role anon' else 'set local role authenticated' end;
      perform public.login_throttle_clear(array['probe:x']);
      v_out := v_out || format(E'\n%s executa a função: FALHOU', case v_i when 1 then 'anon' else 'authenticated' end);
    exception when insufficient_privilege then
      v_out := v_out || format(E'\n%s não executa a função: ok', case v_i when 1 then 'anon' else 'authenticated' end);
    end;
    reset role;
  end loop;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
