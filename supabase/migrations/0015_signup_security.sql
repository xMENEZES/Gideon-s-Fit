-- Rode SOMENTE depois que 0014_standard_role.sql já tiver sido executado com
-- sucesso em uma execução separada.

-- 1) CORREÇÃO DE SEGURANÇA: a policy "profiles_update_own" permitia que o
-- usuário atualizasse QUALQUER coluna do próprio profile — inclusive `role`
-- (ex.: um aluno poderia se promover a admin pelo navegador). A partir daqui o
-- usuário só pode alterar o próprio nome; `role` e `onboarded` mudam apenas por
-- ações do servidor (service role), que ignora essas permissões.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- 2) Controle do primeiro acesso: quem entra com Google ainda precisa escolher
-- o perfil (Profissional ou Usuário Padrão). Contas já existentes ficam
-- como "já escolhido" (default true).
alter table public.profiles
  add column if not exists onboarded boolean not null default true;

-- 3) Criação do profile para todo novo auth.users. O cliente nunca consegue
-- escolher 'admin' (nem 'student'): só 'trainer' ou 'standard'. Alunos
-- convidados por e-mail são promovidos a 'student' pelo servidor logo após o
-- convite.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_onboarded boolean := true;
begin
  if coalesce(new.raw_app_meta_data->>'provider', 'email') = 'google' then
    v_role := 'standard';
    v_onboarded := false;
  elsif new.raw_user_meta_data->>'role' = 'trainer' then
    v_role := 'trainer';
  else
    v_role := 'standard';
  end if;

  insert into public.profiles (id, role, full_name, email, onboarded)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    v_onboarded
  );
  return new;
end;
$$;
