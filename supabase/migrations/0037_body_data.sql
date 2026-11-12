-- Dados corporais da pessoa ("Meus Dados" no Perfil): data de nascimento, altura e peso.
--
-- São dados de saúde (LGPD, art. 11): só entram com consentimento específico (consented_at) e só
-- para maiores de 18 anos. Quem lê: a própria pessoa e, somente leitura, o profissional dono do
-- time em que ela é aluna (some sozinho quando ela sai do time). Apagar a conta apaga a linha.
--
-- Só acrescenta (tabela e funções novas). O código atual da main não usa nada disto.
-- Reversão: 0037_rollback.sql

create table public.body_data (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  birth_date date not null,
  height_cm smallint,
  weight_kg numeric(4, 1),
  -- Quando a pessoa aceitou o uso destes dados (preenchido pelo banco, o cliente não grava).
  consented_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint body_data_height_range check (height_cm is null or height_cm between 100 and 250),
  constraint body_data_weight_range check (weight_kg is null or weight_kg between 30 and 300)
);

-- Idade entre 18 e 100 anos (data de Brasília). Não dá para fazer por CHECK: "hoje" muda.
create or replace function public.body_data_guard() returns trigger
language plpgsql set search_path = public as $$
declare
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if new.birth_date > v_today - interval '18 years' then
    raise exception 'body_data_underage';
  end if;
  if new.birth_date < v_today - interval '100 years' then
    raise exception 'body_data_birth_invalid';
  end if;
  new.updated_at := now();
  return new;
end $$;

revoke execute on function public.body_data_guard() from public, anon, authenticated;

create trigger body_data_guard before insert or update on public.body_data
  for each row execute function public.body_data_guard();

alter table public.body_data enable row level security;

revoke all on public.body_data from anon;
revoke all on public.body_data from authenticated;
-- consented_at e updated_at ficam de fora: quem preenche é o banco.
grant select on public.body_data to authenticated;
grant insert (profile_id, birth_date, height_cm, weight_kg) on public.body_data to authenticated;
grant update (birth_date, height_cm, weight_kg) on public.body_data to authenticated;
grant delete on public.body_data to authenticated;

create policy "body_data_select_own"
  on public.body_data for select to authenticated
  using (profile_id = (select auth.uid()));

-- O profissional lê os dados dos alunos do próprio time (nunca o plano próprio dele, que é a
-- linha "solo", nem de quem já saiu do time).
create policy "body_data_select_trainer"
  on public.body_data for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.profile_id = body_data.profile_id
        and s.trainer_id = (select auth.uid())
        and s.profile_id <> s.trainer_id
    )
  );

create policy "body_data_insert_own"
  on public.body_data for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "body_data_update_own"
  on public.body_data for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "body_data_delete_own"
  on public.body_data for delete to authenticated
  using (profile_id = (select auth.uid()));
