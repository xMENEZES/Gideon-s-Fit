-- Notificação push do fim do descanso.
--
-- Duas tabelas:
--   * push_subscriptions: um aparelho inscrito para receber notificações (endereço e chaves que o
--     navegador entrega). Uma pessoa pode ter vários aparelhos. O endereço é único: se outra
--     pessoa entrar no mesmo aparelho, a inscrição passa a ser dela (register_push_subscription).
--   * rest_alarms: um aviso agendado. O app grava "descanso termina em tal horário"; uma função do
--     servidor espera até lá, confere se o aviso continua pendente (a pessoa pode pausar ou
--     reiniciar o cronômetro, o que o cancela) e só então envia a notificação.
-- Só acrescenta (tabelas e funções novas). Reversão: 0034_rollback.sql

-- ---------------------------------------------------------------------------------------------
-- Aparelhos inscritos
-- ---------------------------------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 20 and 2048),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 10 and 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create unique index uq_push_subscriptions_endpoint on public.push_subscriptions (endpoint);
create index idx_push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
revoke all on public.push_subscriptions from authenticated;
-- Gravar só pela função abaixo (ela resolve o aparelho que muda de dono); ler e apagar é do dono.
grant select, delete on public.push_subscriptions to authenticated;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select to authenticated
  using (user_id = auth.uid());

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete to authenticated
  using (user_id = auth.uid());

-- Inscreve (ou atualiza) um aparelho para a pessoa logada. Cota: até 10 aparelhos por conta
-- (mensagem traduzida em src/lib/quota.ts; manter o número igual).
create or replace function public.register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated';
  end if;

  if (select count(*) from public.push_subscriptions
        where user_id = v_user and endpoint <> p_endpoint) >= 10 then
    raise exception 'quota_exceeded:push_subscriptions';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (v_user, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent;
end $$;

revoke execute on function public.register_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.register_push_subscription(text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Avisos agendados
-- ---------------------------------------------------------------------------------------------
create table public.rest_alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  due_at timestamptz not null,
  body text check (body is null or char_length(body) <= 100),
  status text not null default 'pending' check (status in ('pending', 'sent', 'cancelled')),
  created_at timestamptz not null default now()
);

create index idx_rest_alarms_user on public.rest_alarms (user_id, created_at desc);

alter table public.rest_alarms enable row level security;
revoke all on public.rest_alarms from anon;
revoke all on public.rest_alarms from authenticated;
grant select, insert on public.rest_alarms to authenticated;
-- Só o status muda (pendente -> enviado ou cancelado).
grant update (status) on public.rest_alarms to authenticated;

create policy "rest_alarms_select_own"
  on public.rest_alarms for select to authenticated
  using (user_id = auth.uid());

-- O aviso nasce pendente, é da própria pessoa e termina em até 10 minutos.
create policy "rest_alarms_insert_own"
  on public.rest_alarms for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and due_at <= now() + interval '10 minutes'
    and due_at >= now() - interval '1 minute'
  );

-- Só um aviso ainda pendente muda, e só para enviado ou cancelado: o "update ... where status =
-- 'pending'" serve de trava (quem chega depois não leva nada), e um aviso encerrado não volta.
create policy "rest_alarms_update_own"
  on public.rest_alarms for update to authenticated
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status in ('sent', 'cancelled'));

-- Cota: até 5 avisos pendentes (ainda no futuro) por conta, porque cada um mantém uma função do
-- servidor esperando. Também limpa os avisos com mais de 1 dia da própria pessoa.
create or replace function public.quota_rest_alarms() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.rest_alarms
    where user_id = new.user_id and created_at < now() - interval '1 day';
  if (select count(*) from public.rest_alarms
        where user_id = new.user_id and status = 'pending' and due_at > now()) >= 5 then
    raise exception 'quota_exceeded:rest_alarms';
  end if;
  return new;
end $$;

revoke execute on function public.quota_rest_alarms() from public, anon, authenticated;

create trigger quota_rest_alarms before insert on public.rest_alarms
  for each row execute function public.quota_rest_alarms();
