-- Otimização das regras de acesso (RLS) das tabelas de treino e dieta.
--
-- PROBLEMA: cada política consultava tabelas que também têm políticas (alunos, protocolos,
-- refeições...), e o banco reavaliava toda essa cascata a cada linha lida. Nas consultas
-- aninhadas (protocolo, refeições, opções, alimentos) isso custava cerca de 300 a 400 ms.
--
-- SOLUÇÃO: a conferência "quem pode ler / escrever" passa a ser uma função security definer
-- (uma consulta direta, indexada, sem reavaliar políticas em cascata), e as políticas só a
-- chamam. QUEM PODE O QUÊ NÃO MUDA: o resultado do script de isolamento
-- (supabase/tests/rls_isolation_probe.sql) precisa ficar idêntico ao de
-- supabase/tests/rls_baseline_2026-10-07.md.
--
-- Este arquivo roda como uma operação única (se algo falhar, nada é aplicado). Para voltar atrás,
-- use supabase/migrations/0021_rollback.sql.
-- A tabela `protocols` não é alterada (suas políticas já são diretas e baratas).

-- ===========================================================================================
-- 1) Funções de verificação (security definer, sem reavaliar RLS)
-- ===========================================================================================

-- Protocolo: aluno dono, profissional do aluno ou dono do modelo.
create or replace function public.can_read_protocol(p_protocol_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.protocols p
    left join public.students s on s.id = p.student_id
    where p.id = p_protocol_id
      and (s.trainer_id = auth.uid() or s.profile_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

-- Protocolo: profissional do aluno ou dono do modelo (quem pode editar).
create or replace function public.can_write_protocol(p_protocol_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.protocols p
    left join public.students s on s.id = p.student_id
    where p.id = p_protocol_id
      and (s.trainer_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

-- Dia de treino
create or replace function public.can_read_workout_day(p_day_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workout_days wd
    join public.protocols p on p.id = wd.protocol_id
    left join public.students s on s.id = p.student_id
    where wd.id = p_day_id
      and (s.trainer_id = auth.uid() or s.profile_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

create or replace function public.can_write_workout_day(p_day_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.workout_days wd
    join public.protocols p on p.id = wd.protocol_id
    left join public.students s on s.id = p.student_id
    where wd.id = p_day_id
      and (s.trainer_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

-- Cargas de um exercício: leitura pelo aluno dono ou pelo profissional dele (modelos não têm cargas).
create or replace function public.can_read_exercise_logs(p_exercise_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.exercises e
    join public.workout_days wd on wd.id = e.workout_day_id
    join public.protocols p on p.id = wd.protocol_id
    join public.students s on s.id = p.student_id
    where e.id = p_exercise_id
      and (s.profile_id = auth.uid() or s.trainer_id = auth.uid())
  );
$$;

-- Só o próprio aluno registra carga no exercício dele.
create or replace function public.owns_exercise_as_student(p_exercise_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.exercises e
    join public.workout_days wd on wd.id = e.workout_day_id
    join public.protocols p on p.id = wd.protocol_id
    join public.students s on s.id = p.student_id
    where e.id = p_exercise_id and s.profile_id = auth.uid()
  );
$$;

-- Refeição
create or replace function public.can_read_meal(p_meal_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.meals m
    join public.protocols p on p.id = m.protocol_id
    left join public.students s on s.id = p.student_id
    where m.id = p_meal_id
      and (s.trainer_id = auth.uid() or s.profile_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

create or replace function public.can_write_meal(p_meal_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.meals m
    join public.protocols p on p.id = m.protocol_id
    left join public.students s on s.id = p.student_id
    where m.id = p_meal_id
      and (s.trainer_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

-- Opção de refeição
create or replace function public.can_read_meal_option(p_option_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.meal_options o
    join public.meals m on m.id = o.meal_id
    join public.protocols p on p.id = m.protocol_id
    left join public.students s on s.id = p.student_id
    where o.id = p_option_id
      and (s.trainer_id = auth.uid() or s.profile_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

create or replace function public.can_write_meal_option(p_option_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.meal_options o
    join public.meals m on m.id = o.meal_id
    join public.protocols p on p.id = m.protocol_id
    left join public.students s on s.id = p.student_id
    where o.id = p_option_id
      and (s.trainer_id = auth.uid() or p.owner_trainer_id = auth.uid())
  );
$$;

-- Registros "fiz / não fiz" de uma refeição: leitura pelo aluno dono ou pelo profissional dele.
create or replace function public.can_read_meal_logs(p_meal_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.meals m
    join public.protocols p on p.id = m.protocol_id
    join public.students s on s.id = p.student_id
    where m.id = p_meal_id
      and (s.profile_id = auth.uid() or s.trainer_id = auth.uid())
  );
$$;

-- (public.owns_meal já existe desde a migração 0020: só o aluno dono da refeição.)

revoke execute on function
  public.can_read_protocol(uuid), public.can_write_protocol(uuid),
  public.can_read_workout_day(uuid), public.can_write_workout_day(uuid),
  public.can_read_exercise_logs(uuid), public.owns_exercise_as_student(uuid),
  public.can_read_meal(uuid), public.can_write_meal(uuid),
  public.can_read_meal_option(uuid), public.can_write_meal_option(uuid),
  public.can_read_meal_logs(uuid)
from public, anon;
grant execute on function
  public.can_read_protocol(uuid), public.can_write_protocol(uuid),
  public.can_read_workout_day(uuid), public.can_write_workout_day(uuid),
  public.can_read_exercise_logs(uuid), public.owns_exercise_as_student(uuid),
  public.can_read_meal(uuid), public.can_write_meal(uuid),
  public.can_read_meal_option(uuid), public.can_write_meal_option(uuid),
  public.can_read_meal_logs(uuid)
to authenticated;

-- ===========================================================================================
-- 2) Políticas antigas saem; leitura vira UMA política e a escrita é separada por operação
-- ===========================================================================================

drop policy if exists "workout_days_trainer_all" on public.workout_days;
drop policy if exists "workout_days_student_select_own" on public.workout_days;
drop policy if exists "workout_days_template_owner_all" on public.workout_days;

drop policy if exists "exercises_trainer_all" on public.exercises;
drop policy if exists "exercises_student_select_own" on public.exercises;
drop policy if exists "exercises_template_owner_all" on public.exercises;

drop policy if exists "load_logs_student_select_own" on public.exercise_load_logs;
drop policy if exists "load_logs_trainer_select" on public.exercise_load_logs;
drop policy if exists "load_logs_student_insert_own" on public.exercise_load_logs;

drop policy if exists "meals_trainer_all" on public.meals;
drop policy if exists "meals_student_select_own" on public.meals;
drop policy if exists "meals_template_owner_all" on public.meals;

drop policy if exists "meal_options_trainer_all" on public.meal_options;
drop policy if exists "meal_options_student_select_own" on public.meal_options;
drop policy if exists "meal_options_template_owner_all" on public.meal_options;

drop policy if exists "meal_items_trainer_all" on public.meal_items;
drop policy if exists "meal_items_student_select_own" on public.meal_items;
drop policy if exists "meal_items_template_owner_all" on public.meal_items;

drop policy if exists "meal_logs_owner_select" on public.meal_logs;
drop policy if exists "meal_logs_trainer_select" on public.meal_logs;
drop policy if exists "meal_logs_owner_insert" on public.meal_logs;
drop policy if exists "meal_logs_owner_update" on public.meal_logs;
drop policy if exists "meal_logs_owner_delete" on public.meal_logs;

-- workout_days
create policy "workout_days_select" on public.workout_days for select
  using (public.can_read_protocol(protocol_id));
create policy "workout_days_insert" on public.workout_days for insert
  with check (public.can_write_protocol(protocol_id));
create policy "workout_days_update" on public.workout_days for update
  using (public.can_write_protocol(protocol_id))
  with check (public.can_write_protocol(protocol_id));
create policy "workout_days_delete" on public.workout_days for delete
  using (public.can_write_protocol(protocol_id));

-- exercises
create policy "exercises_select" on public.exercises for select
  using (public.can_read_workout_day(workout_day_id));
create policy "exercises_insert" on public.exercises for insert
  with check (public.can_write_workout_day(workout_day_id));
create policy "exercises_update" on public.exercises for update
  using (public.can_write_workout_day(workout_day_id))
  with check (public.can_write_workout_day(workout_day_id));
create policy "exercises_delete" on public.exercises for delete
  using (public.can_write_workout_day(workout_day_id));

-- exercise_load_logs (histórico só de acréscimo: sem update nem delete)
create policy "load_logs_select" on public.exercise_load_logs for select
  using (public.can_read_exercise_logs(exercise_id));
create policy "load_logs_insert" on public.exercise_load_logs for insert
  with check (created_by = (select auth.uid()) and public.owns_exercise_as_student(exercise_id));

-- meals
create policy "meals_select" on public.meals for select
  using (public.can_read_protocol(protocol_id));
create policy "meals_insert" on public.meals for insert
  with check (public.can_write_protocol(protocol_id));
create policy "meals_update" on public.meals for update
  using (public.can_write_protocol(protocol_id))
  with check (public.can_write_protocol(protocol_id));
create policy "meals_delete" on public.meals for delete
  using (public.can_write_protocol(protocol_id));

-- meal_options
create policy "meal_options_select" on public.meal_options for select
  using (public.can_read_meal(meal_id));
create policy "meal_options_insert" on public.meal_options for insert
  with check (public.can_write_meal(meal_id));
create policy "meal_options_update" on public.meal_options for update
  using (public.can_write_meal(meal_id))
  with check (public.can_write_meal(meal_id));
create policy "meal_options_delete" on public.meal_options for delete
  using (public.can_write_meal(meal_id));

-- meal_items
create policy "meal_items_select" on public.meal_items for select
  using (public.can_read_meal_option(meal_option_id));
create policy "meal_items_insert" on public.meal_items for insert
  with check (public.can_write_meal_option(meal_option_id));
create policy "meal_items_update" on public.meal_items for update
  using (public.can_write_meal_option(meal_option_id))
  with check (public.can_write_meal_option(meal_option_id));
create policy "meal_items_delete" on public.meal_items for delete
  using (public.can_write_meal_option(meal_option_id));

-- meal_logs (quem registra é só o próprio aluno; o profissional só lê)
create policy "meal_logs_select" on public.meal_logs for select
  using (public.can_read_meal_logs(meal_id));
create policy "meal_logs_insert" on public.meal_logs for insert
  with check (
    created_by = (select auth.uid())
    and log_date between current_date - 5 and current_date + 1
    and public.owns_meal(meal_id)
  );
create policy "meal_logs_update" on public.meal_logs for update
  using (public.owns_meal(meal_id))
  with check (
    created_by = (select auth.uid())
    and log_date between current_date - 5 and current_date + 1
    and public.owns_meal(meal_id)
  );
create policy "meal_logs_delete" on public.meal_logs for delete
  using (
    log_date between current_date - 5 and current_date + 1
    and public.owns_meal(meal_id)
  );

-- Conferência (rode depois): deve listar 4 políticas por tabela (2 em exercise_load_logs)
-- e nenhuma com o nome antigo (*_trainer_all, *_student_select_own, *_template_owner_all).
--   select tablename, count(*) as politicas, string_agg(policyname, ', ' order by policyname)
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('workout_days','exercises','exercise_load_logs','meals','meal_options','meal_items','meal_logs')
--   group by tablename order by tablename;
