-- REVERSAO da migração 0021 (otimização das regras de acesso).
--
-- Quando usar: se, depois da 0021, o script de isolamento (supabase/tests/rls_isolation_probe.sql)
-- mostrar números diferentes da referência (supabase/tests/rls_baseline_2026-10-07.md), ou se
-- alguma tela deixar de mostrar dados que deveria mostrar.
--
-- O que faz: remove as políticas novas e recria, exatamente como eram, as 23 políticas antigas
-- das 7 tabelas. As funções criadas pela 0021 ficam no banco (inofensivas, ninguém as usa mais);
-- o bloco final, comentado, mostra como removê-las depois, se quiser.
--
-- Roda como uma operação única (se algo falhar, nada é aplicado).

-- 1) Remove as políticas novas
drop policy if exists "workout_days_select" on public.workout_days;
drop policy if exists "workout_days_insert" on public.workout_days;
drop policy if exists "workout_days_update" on public.workout_days;
drop policy if exists "workout_days_delete" on public.workout_days;
drop policy if exists "exercises_select" on public.exercises;
drop policy if exists "exercises_insert" on public.exercises;
drop policy if exists "exercises_update" on public.exercises;
drop policy if exists "exercises_delete" on public.exercises;
drop policy if exists "load_logs_select" on public.exercise_load_logs;
drop policy if exists "load_logs_insert" on public.exercise_load_logs;
drop policy if exists "meals_select" on public.meals;
drop policy if exists "meals_insert" on public.meals;
drop policy if exists "meals_update" on public.meals;
drop policy if exists "meals_delete" on public.meals;
drop policy if exists "meal_options_select" on public.meal_options;
drop policy if exists "meal_options_insert" on public.meal_options;
drop policy if exists "meal_options_update" on public.meal_options;
drop policy if exists "meal_options_delete" on public.meal_options;
drop policy if exists "meal_items_select" on public.meal_items;
drop policy if exists "meal_items_insert" on public.meal_items;
drop policy if exists "meal_items_update" on public.meal_items;
drop policy if exists "meal_items_delete" on public.meal_items;
drop policy if exists "meal_logs_select" on public.meal_logs;
drop policy if exists "meal_logs_insert" on public.meal_logs;
drop policy if exists "meal_logs_update" on public.meal_logs;
drop policy if exists "meal_logs_delete" on public.meal_logs;

-- 2) Recria as políticas antigas (estado final de cada uma, extraído das migrações 0003 a 0020)

create policy "load_logs_student_insert_own"
  on public.exercise_load_logs for insert
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.profile_id = auth.uid()
    )
  );

create policy "load_logs_student_select_own"
  on public.exercise_load_logs for select
  using (
    exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.profile_id = auth.uid()
    )
  );

create policy "load_logs_trainer_select"
  on public.exercise_load_logs for select
  using (
    exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "exercises_student_select_own"
  on public.exercises for select
  using (
    exists (
      select 1 from public.workout_days wd
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where wd.id = exercises.workout_day_id
        and s.profile_id = auth.uid()
    )
  );

create policy "exercises_template_owner_all"
  on public.exercises for all
  using (public.owns_template_workout_day(workout_day_id))
  with check (public.owns_template_workout_day(workout_day_id));

create policy "exercises_trainer_all"
  on public.exercises for all
  using (
    exists (
      select 1 from public.workout_days wd
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where wd.id = exercises.workout_day_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_days wd
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where wd.id = exercises.workout_day_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "meal_items_student_select_own"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.meal_options mo
      join public.meals m on m.id = mo.meal_id
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where mo.id = meal_items.meal_option_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_items_template_owner_all"
  on public.meal_items for all
  using (public.owns_template_meal_option(meal_option_id))
  with check (public.owns_template_meal_option(meal_option_id));

create policy "meal_items_trainer_all"
  on public.meal_items for all
  using (
    exists (
      select 1 from public.meal_options mo
      join public.meals m on m.id = mo.meal_id
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where mo.id = meal_items.meal_option_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_options mo
      join public.meals m on m.id = mo.meal_id
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where mo.id = meal_items.meal_option_id and s.trainer_id = auth.uid()
    )
  );

create policy "meal_logs_owner_delete"
  on public.meal_logs for delete
  using (
    log_date between current_date - 5 and current_date + 1
    and exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_logs_owner_insert"
  on public.meal_logs for insert
  with check (
    created_by = auth.uid()
    and log_date between current_date - 5 and current_date + 1
    and exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_logs_owner_select"
  on public.meal_logs for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_logs_owner_update"
  on public.meal_logs for update
  using (public.owns_meal(meal_id))
  with check (
    created_by = auth.uid()
    and log_date between current_date - 5 and current_date + 1
    and public.owns_meal(meal_id)
  );

create policy "meal_logs_trainer_select"
  on public.meal_logs for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.trainer_id = auth.uid()
    )
  );

create policy "meal_options_student_select_own"
  on public.meal_options for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_options.meal_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_options_template_owner_all"
  on public.meal_options for all
  using (public.owns_template_meal(meal_id))
  with check (public.owns_template_meal(meal_id));

create policy "meal_options_trainer_all"
  on public.meal_options for all
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_options.meal_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_options.meal_id and s.trainer_id = auth.uid()
    )
  );

create policy "meals_student_select_own"
  on public.meals for select
  using (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = meals.protocol_id and s.profile_id = auth.uid()
    )
  );

create policy "meals_template_owner_all"
  on public.meals for all
  using (public.owns_template(protocol_id))
  with check (public.owns_template(protocol_id));

create policy "meals_trainer_all"
  on public.meals for all
  using (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = meals.protocol_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = meals.protocol_id and s.trainer_id = auth.uid()
    )
  );

create policy "workout_days_student_select_own"
  on public.workout_days for select
  using (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = workout_days.protocol_id
        and s.profile_id = auth.uid()
    )
  );

create policy "workout_days_template_owner_all"
  on public.workout_days for all
  using (public.owns_template(protocol_id))
  with check (public.owns_template(protocol_id));

create policy "workout_days_trainer_all"
  on public.workout_days for all
  using (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = workout_days.protocol_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = workout_days.protocol_id
        and s.trainer_id = auth.uid()
    )
  );

-- 3) (Opcional, depois de confirmar que tudo voltou ao normal) remover as funções da 0021:
--   drop function if exists public.can_read_protocol(uuid), public.can_write_protocol(uuid),
--     public.can_read_workout_day(uuid), public.can_write_workout_day(uuid),
--     public.can_read_exercise_logs(uuid), public.owns_exercise_as_student(uuid),
--     public.can_read_meal(uuid), public.can_write_meal(uuid),
--     public.can_read_meal_option(uuid), public.can_write_meal_option(uuid),
--     public.can_read_meal_logs(uuid);
