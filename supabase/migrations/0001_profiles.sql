-- Extensões
create extension if not exists "pgcrypto";

-- Roles de usuário
create type public.user_role as enum ('trainer', 'student');

-- Profiles: 1:1 com auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuário só lê/atualiza o próprio profile
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Nenhuma policy de INSERT para authenticated: profiles só é criado pela trigger
-- abaixo (security definer), impedindo que um usuário se autodeclare role='trainer'.

-- Trigger: cria o profile automaticamente para todo novo auth.users.
-- O role/full_name vêm de raw_user_meta_data, definidos no signUp (trainer)
-- ou no inviteUserByEmail (aluno) — sempre a partir do servidor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'student'),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
