-- Endurecimento de segurança (auditoria de 07/10/2026).

-- 1) meal_logs: a política de UPDATE só conferia o dono do registro antigo; o usuário
-- podia trocar o meal_id da própria linha para o de outra pessoa. Agora a linha NOVA
-- também precisa pertencer a uma refeição do próprio usuário (função security definer,
-- uma consulta direta, sem reavaliar políticas em cascata).
create or replace function public.owns_meal(p_meal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meals m
    join public.protocols p on p.id = m.protocol_id
    join public.students s on s.id = p.student_id
    where m.id = p_meal_id and s.profile_id = auth.uid()
  );
$$;

revoke execute on function public.owns_meal(uuid) from public, anon;
grant execute on function public.owns_meal(uuid) to authenticated;

drop policy if exists "meal_logs_owner_update" on public.meal_logs;
create policy "meal_logs_owner_update"
  on public.meal_logs for update
  using (public.owns_meal(meal_id))
  with check (
    created_by = auth.uid()
    and log_date between current_date - 5 and current_date + 1
    and public.owns_meal(meal_id)
  );

-- 2) Papel anônimo: o app nunca lê nem grava dados sem login (o login passa pelos
-- endpoints de autenticação). Hoje só o RLS impede o uso; aqui removemos também os
-- privilégios, para que um erro futuro numa política não exponha dados.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;

-- 3) Funções de cópia: só usuários logados podem chamar (já rodam com as permissões de
-- quem chama, então o RLS continua valendo).
revoke execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid),
  public.apply_protocol(uuid, uuid, date, date),
  public.create_template_from_protocol(uuid, text)
from public, anon;
grant execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid),
  public.apply_protocol(uuid, uuid, date, date),
  public.create_template_from_protocol(uuid, text)
to authenticated;

-- Funções criadas daqui em diante não ficam executáveis por qualquer um por padrão.
alter default privileges in schema public revoke execute on functions from public;

-- Conferência (rode depois; todas devem retornar false):
--   select has_table_privilege('anon', 'public.protocols', 'update');
--   select has_table_privilege('anon', 'public.profiles', 'select');
--   select has_function_privilege('anon', 'public.apply_protocol(uuid, uuid, date, date)', 'execute');
