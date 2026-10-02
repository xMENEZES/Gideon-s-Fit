-- Fase 3: times por código (com aprovação do profissional) e plano próprio do
-- Usuário Padrão.

-- 1) students: antes cada pessoa só podia ter UMA linha (profile_id único).
-- Agora pode ter uma linha de "time" (trainer_id <> profile_id) e uma linha
-- "solo" (trainer_id = profile_id, o próprio usuário é o "profissional" do seu
-- plano). Como as regras de acesso já liberam tudo a quem é trainer_id da
-- linha, o plano solo funciona sem policies novas. Ao entrar num time, a linha
-- solo continua existindo, mas o profissional do time não a enxerga — é o
-- "arquivado e oculto".
do $$
declare
  c text;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.students'::regclass
      and contype = 'u'
      and (
        select array_agg(a.attname order by a.attname)
        from pg_attribute a
        where a.attrelid = conrelid and a.attnum = any (conkey)
      ) = array['profile_id'::name]
  loop
    execute format('alter table public.students drop constraint %I', c);
  end loop;
end $$;

create unique index if not exists uq_students_team_profile
  on public.students (profile_id) where trainer_id <> profile_id;
create unique index if not exists uq_students_solo_profile
  on public.students (profile_id) where trainer_id = profile_id;

-- 2) Segurança de students: com cadastro aberto, a policy "for all" deixava
-- qualquer usuário inserir linhas apontando para o profile de OUTRA pessoa (e,
-- com isso, ler nome/e-mail dela via profiles_select_by_trainer). Agora linhas
-- só são criadas pelo servidor (service role) e o cliente só edita campos
-- seguros das próprias linhas.
drop policy if exists "students_trainer_all" on public.students;

create policy "students_trainer_select"
  on public.students for select
  using (trainer_id = auth.uid());

create policy "students_trainer_update"
  on public.students for update
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

create policy "students_trainer_delete"
  on public.students for delete
  using (trainer_id = auth.uid());

revoke insert, update on public.students from authenticated, anon;
grant update (nickname, has_workout, has_diet, notes, birth_date)
  on public.students to authenticated;

-- 3) Código do time: um por profissional, gerado/regenerado pelo servidor.
create table public.team_codes (
  trainer_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

alter table public.team_codes enable row level security;

create policy "team_codes_trainer_select"
  on public.team_codes for select
  using (trainer_id = auth.uid());

-- 4) Solicitações para entrar num time (precisam de aprovação do profissional).
create type public.join_request_status as enum ('pending', 'approved', 'rejected');

create table public.team_join_requests (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.join_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create unique index uq_join_requests_pending
  on public.team_join_requests (trainer_id, user_id) where status = 'pending';
create index idx_join_requests_trainer on public.team_join_requests (trainer_id, status);
create index idx_join_requests_user on public.team_join_requests (user_id);

alter table public.team_join_requests enable row level security;

create policy "join_requests_trainer_select"
  on public.team_join_requests for select
  using (trainer_id = auth.uid());

create policy "join_requests_user_select"
  on public.team_join_requests for select
  using (user_id = auth.uid());

-- O profissional precisa ver nome/e-mail de quem pediu para entrar no time.
create policy "profiles_select_join_requesters"
  on public.profiles for select
  using (
    exists (
      select 1 from public.team_join_requests r
      where r.user_id = profiles.id
        and r.trainer_id = auth.uid()
        and r.status = 'pending'
    )
  );

-- 5) Tentativas de código (limite contra adivinhação por força bruta).
create table public.team_join_attempts (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index idx_join_attempts_user on public.team_join_attempts (user_id, created_at);

alter table public.team_join_attempts enable row level security;
-- Sem policies: só o servidor (service role) lê e escreve.
