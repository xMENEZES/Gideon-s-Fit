-- Atraso progressivo nas tentativas de login (proteção contra força bruta).
--
-- O app passa o login por e-mail e senha por uma rota do servidor (/api/auth/login), que usa estas
-- funções para contar as tentativas e impor uma espera que cresce. Três contadores independentes:
--   * ip: erros de login vindos do mesmo IP, em qualquer e-mail (conta só depois do erro);
--   * ei: tentativas do mesmo e-mail a partir do mesmo IP (conta na própria tentativa);
--   * em: tentativas ao mesmo e-mail, de qualquer IP (conta na própria tentativa).
-- Os números (a cada quantas tentativas trava, quanto espera, em quanto tempo o contador zera) vêm
-- do app, em src/lib/login-throttle.ts; aqui só fica o mecanismo, que é o mesmo para os três.
-- As chaves guardadas são hashes (HMAC) do e-mail e do IP, nunca os valores. Linhas com mais de 1 dia
-- e sem espera ativa são apagadas aos poucos.
--
-- Só acrescenta (tabela e funções novas), compatível com o código atual. Reversão: 0035_rollback.sql
-- Acesso: só a chave de serviço (servidor). Nada para anon nem para usuário logado.

create table public.login_throttle (
  key text primary key check (char_length(key) between 4 and 100),
  fail_count int not null default 0 check (fail_count >= 0),
  locked_until timestamptz,
  last_hit_at timestamptz not null default now()
);

create index idx_login_throttle_last_hit on public.login_throttle (last_hit_at);

alter table public.login_throttle enable row level security;
revoke all on public.login_throttle from anon;
revoke all on public.login_throttle from authenticated;
grant all on public.login_throttle to service_role;

-- Espera (em segundos) que a contagem atual impõe: a cada p_step tentativas sobe um degrau da lista
-- p_schedule (por exemplo [60, 300, 900, 3600]); passado o último degrau, repete o último.
create or replace function public.login_throttle_lock_seconds(p_count int, p_step int, p_schedule jsonb)
returns int
language sql immutable set search_path = public as $$
  select case
    when p_step > 0 and p_count > 0 and p_count % p_step = 0
      then (p_schedule ->> (least(p_count / p_step, jsonb_array_length(p_schedule)) - 1))::int
    else 0
  end
$$;

-- Chamada ANTES de conferir a senha. p_keys = [ip, e-mail+ip, e-mail]; p_policy = três objetos
-- {step, decay (s), schedule, count_now} na mesma ordem.
--  * Se algum contador está em espera, devolve blocked = true e quanto falta; não conta nada.
--  * Senão, conta a tentativa nos contadores com count_now (travando a linha, então tentativas em
--    paralelo não furam o limite) e devolve blocked = false e, em wait_seconds, a espera que essa
--    tentativa acabou de iniciar (0 se nenhuma): vale a partir da próxima.
create or replace function public.login_throttle_begin(p_keys text[], p_policy jsonb)
returns table (blocked boolean, wait_seconds int)
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := clock_timestamp();
  v_i int;
  v_pol jsonb;
  v_row public.login_throttle%rowtype;
  v_wait int := 0;
  v_after int := 0;
  v_count int;
  v_lock int;
begin
  if array_length(p_keys, 1) is distinct from 3 or jsonb_typeof(p_policy) is distinct from 'array'
     or jsonb_array_length(p_policy) <> 3 then
    raise exception 'invalid_arguments';
  end if;

  if random() < 0.02 then
    delete from public.login_throttle
     where last_hit_at < v_now - interval '1 day' and (locked_until is null or locked_until < v_now);
  end if;

  -- Cria e trava as linhas que contam já na tentativa, sempre na mesma ordem (evita deadlock).
  for v_i in 1..3 loop
    if (p_policy -> (v_i - 1) ->> 'count_now')::boolean then
      insert into public.login_throttle (key, last_hit_at) values (p_keys[v_i], v_now)
        on conflict (key) do nothing;
      perform 1 from public.login_throttle where key = p_keys[v_i] for update;
    end if;
  end loop;

  for v_i in 1..3 loop
    select * into v_row from public.login_throttle where key = p_keys[v_i];
    if found and v_row.locked_until is not null and v_row.locked_until > v_now then
      v_wait := greatest(v_wait, ceil(extract(epoch from v_row.locked_until - v_now))::int);
    end if;
  end loop;

  if v_wait > 0 then
    return query select true, v_wait;
    return;
  end if;

  for v_i in 1..3 loop
    v_pol := p_policy -> (v_i - 1);
    continue when not (v_pol ->> 'count_now')::boolean;
    select * into v_row from public.login_throttle where key = p_keys[v_i];
    v_count := case
      when v_row.last_hit_at < v_now - make_interval(secs => (v_pol ->> 'decay')::int) then 0
      else v_row.fail_count
    end + 1;
    v_lock := public.login_throttle_lock_seconds(v_count, (v_pol ->> 'step')::int, v_pol -> 'schedule');
    update public.login_throttle
       set fail_count = v_count,
           last_hit_at = v_now,
           locked_until = case when v_lock > 0 then v_now + make_interval(secs => v_lock) else null end
     where key = p_keys[v_i];
    v_after := greatest(v_after, v_lock);
  end loop;

  return query select false, v_after;
end;
$$;

-- Chamada DEPOIS de um erro de senha, para o contador que só conta erros (o do IP). Devolve a espera
-- que esse erro iniciou (0 se nenhuma).
create or replace function public.login_throttle_fail(p_key text, p_step int, p_decay int, p_schedule jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.login_throttle%rowtype;
  v_count int;
  v_lock int;
begin
  insert into public.login_throttle (key, last_hit_at) values (p_key, v_now) on conflict (key) do nothing;
  select * into v_row from public.login_throttle where key = p_key for update;
  v_count := case
    when v_row.last_hit_at < v_now - make_interval(secs => p_decay) then 0
    else v_row.fail_count
  end + 1;
  v_lock := public.login_throttle_lock_seconds(v_count, p_step, p_schedule);
  update public.login_throttle
     set fail_count = v_count,
         last_hit_at = v_now,
         locked_until = case when v_lock > 0 then v_now + make_interval(secs => v_lock) else null end
   where key = p_key;
  return v_lock;
end;
$$;

-- Chamada depois de um login certo: zera os contadores do e-mail (a pessoa provou que é a dona).
-- O contador do IP não é zerado, para que quem tem uma conta própria não o reinicie à vontade.
create or replace function public.login_throttle_clear(p_keys text[])
returns void
language sql security definer set search_path = public as $$
  delete from public.login_throttle where key = any(p_keys)
$$;

revoke all on function public.login_throttle_lock_seconds(int, int, jsonb) from public, anon, authenticated;
revoke all on function public.login_throttle_begin(text[], jsonb) from public, anon, authenticated;
revoke all on function public.login_throttle_fail(text, int, int, jsonb) from public, anon, authenticated;
revoke all on function public.login_throttle_clear(text[]) from public, anon, authenticated;
grant execute on function public.login_throttle_lock_seconds(int, int, jsonb) to service_role;
grant execute on function public.login_throttle_begin(text[], jsonb) to service_role;
grant execute on function public.login_throttle_fail(text, int, int, jsonb) to service_role;
grant execute on function public.login_throttle_clear(text[]) to service_role;
