-- Mensagens de incentivo (gamificação, etapa 1).
-- Ao concluir o treino, a alimentação ou o dia completo, a pessoa vê uma mensagem:
--   * aluno de um time: as mensagens do profissional (se ele tiver alguma ativa para o
--     evento; senão cai nas do sistema);
--   * Usuário Padrão (plano próprio): as do sistema.
-- owner_id nulo = mensagem do sistema (só a migração mexe; nenhum papel do cliente grava).
-- O profissional copia/edita/cria as dele. Reversão: 0025_rollback.sql

create table public.incentive_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  event text not null check (event in ('workout', 'diet', 'day', 'streak')),
  body text not null check (char_length(btrim(body)) between 3 and 140),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_incentive_messages_owner_event on public.incentive_messages (owner_id, event);

alter table public.incentive_messages enable row level security;
revoke all on public.incentive_messages from anon;
revoke all on public.incentive_messages from authenticated;
grant select, insert, delete on public.incentive_messages to authenticated;
-- Só texto e ativação mudam; o evento e o dono nunca.
grant update (body, active) on public.incentive_messages to authenticated;

-- Funções auxiliares (definer, como em 0021): evitam reavaliar RLS de outras tabelas por linha.
create or replace function public.is_trainer_role()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'trainer'
  )
$$;

-- O profissional dono da mensagem é o profissional do time de quem consulta.
create or replace function public.is_my_trainer(p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students
    where profile_id = auth.uid() and trainer_id = p_owner and trainer_id <> profile_id
  )
$$;

revoke execute on function public.is_trainer_role(), public.is_my_trainer(uuid) from public, anon;
grant execute on function public.is_trainer_role(), public.is_my_trainer(uuid) to authenticated;

create policy "incentive_select"
  on public.incentive_messages for select to authenticated
  using (owner_id is null or owner_id = auth.uid() or public.is_my_trainer(owner_id));

create policy "incentive_trainer_insert"
  on public.incentive_messages for insert to authenticated
  with check (owner_id = auth.uid() and public.is_trainer_role());

create policy "incentive_trainer_update"
  on public.incentive_messages for update to authenticated
  using (owner_id = auth.uid() and public.is_trainer_role())
  with check (owner_id = auth.uid() and public.is_trainer_role());

create policy "incentive_trainer_delete"
  on public.incentive_messages for delete to authenticated
  using (owner_id = auth.uid() and public.is_trainer_role());

-- Cota: até 10 mensagens por tipo de evento e por profissional (mensagem traduzida em
-- src/lib/quota.ts; manter o número igual).
create or replace function public.quota_incentive_messages() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is null then return new; end if;
  if (select count(*) from public.incentive_messages
        where owner_id = new.owner_id and event = new.event) >= 10 then
    raise exception 'quota_exceeded:incentive_messages';
  end if;
  return new;
end $$;

revoke execute on function public.quota_incentive_messages() from public, anon, authenticated;

create trigger quota_incentive_messages before insert on public.incentive_messages
  for each row execute function public.quota_incentive_messages();

-- Mensagens padrão do sistema.
insert into public.incentive_messages (owner_id, event, body) values
  (null, 'workout', 'O sofá perdeu essa disputa, treino feito!'),
  (null, 'diet',    'Zero improviso, 100% estratégia.'),
  (null, 'day',     'Boa, dia fechado. Amanhã a gente repete.'),
  (null, 'streak',  '{sequencia} dias, muito bom. Disciplina sempre.');
