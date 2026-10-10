-- Reverte a 0024_cardio.sql.
-- ATENÇÃO: apaga todos os exercícios de cardio já criados (e, em cascata, os registros deles),
-- porque séries e repetições voltam a ser obrigatórias. Faça um backup do que importa antes.
-- Rode DEPOIS de voltar o deploy do app para uma versão sem cardio.

-- 1) Remove o cardio (os registros saem junto, por cascata).
delete from public.exercises where kind = 'cardio';

-- 2) Gatilhos e funções novas.
drop trigger if exists exercise_load_logs_kind_guard on public.exercise_load_logs;
drop trigger if exists exercises_kind_immutable on public.exercises;
drop function if exists public.exercise_load_logs_kind_guard();
drop function if exists public.exercises_kind_immutable();

-- 3) Registros: volta a carga obrigatória.
alter table public.exercise_load_logs
  drop constraint if exists load_logs_has_value,
  drop constraint if exists load_logs_distance_range,
  drop constraint if exists load_logs_duration_range;
alter table public.exercise_load_logs
  drop column if exists distance_km,
  drop column if exists duration_minutes;
alter table public.exercise_load_logs
  alter column weight_kg set not null;

-- 4) Exercícios: volta séries e repetições obrigatórias.
alter table public.exercises
  drop constraint if exists exercises_kind_fields,
  drop constraint if exists exercises_target_distance_range,
  drop constraint if exists exercises_target_minutes_range,
  drop constraint if exists exercises_kind_check;
alter table public.exercises
  drop column if exists target_distance_km,
  drop column if exists target_minutes,
  drop column if exists kind;
alter table public.exercises
  alter column sets set not null,
  alter column reps set not null;

-- 5) Funções de cópia: versões anteriores (0013 e 0018), sem as colunas de cardio.
create or replace function public.start_new_protocol(
  p_student_id uuid,
  p_type public.protocol_type,
  p_end_date date,
  p_duplicate boolean,
  p_start_date date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_old_protocol_id uuid;
  v_old_notes text;
  v_new_protocol_id uuid;
  v_old_day record;
  v_new_day_id uuid;
  v_old_meal record;
  v_new_meal_id uuid;
  v_old_option record;
  v_new_option_id uuid;
begin
  update public.protocols
    set is_active = false
    where student_id = p_student_id
      and type = p_type
      and is_active
    returning id, notes into v_old_protocol_id, v_old_notes;

  insert into public.protocols (student_id, type, start_date, end_date, created_by, notes)
  values (
    p_student_id, p_type, p_start_date, p_end_date, auth.uid(),
    case when p_duplicate then v_old_notes else null end
  )
  returning id into v_new_protocol_id;

  if p_duplicate and v_old_protocol_id is not null then
    if p_type = 'workout' then
      for v_old_day in
        select * from public.workout_days where protocol_id = v_old_protocol_id order by sort_order
      loop
        insert into public.workout_days (protocol_id, name, sort_order)
        values (v_new_protocol_id, v_old_day.name, v_old_day.sort_order)
        returning id into v_new_day_id;

        insert into public.exercises
          (workout_day_id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, sort_order)
        select v_new_day_id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, sort_order
        from public.exercises
        where workout_day_id = v_old_day.id
        order by sort_order;
      end loop;
    elsif p_type = 'diet' then
      for v_old_meal in
        select * from public.meals where protocol_id = v_old_protocol_id order by sort_order
      loop
        insert into public.meals (protocol_id, name, suggested_time, sort_order)
        values (v_new_protocol_id, v_old_meal.name, v_old_meal.suggested_time, v_old_meal.sort_order)
        returning id into v_new_meal_id;

        for v_old_option in
          select * from public.meal_options where meal_id = v_old_meal.id order by sort_order
        loop
          insert into public.meal_options (meal_id, label, sort_order)
          values (v_new_meal_id, v_old_option.label, v_old_option.sort_order)
          returning id into v_new_option_id;

          insert into public.meal_items
            (meal_option_id, food_name, quantity, unit, notes, sort_order)
          select v_new_option_id, food_name, quantity, unit, notes, sort_order
          from public.meal_items
          where meal_option_id = v_old_option.id
          order by sort_order;
        end loop;
      end loop;
    end if;
  end if;

  return v_new_protocol_id;
end;
$$;

create or replace function public.copy_protocol_content(p_source uuid, p_target uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_source_type public.protocol_type;
  v_target_type public.protocol_type;
  v_day record;
  v_new_day_id uuid;
  v_meal record;
  v_new_meal_id uuid;
  v_option record;
  v_new_option_id uuid;
begin
  select type into v_source_type from public.protocols where id = p_source;
  select type into v_target_type from public.protocols where id = p_target;
  if v_source_type is null or v_target_type is null then
    raise exception 'Protocolo não encontrado';
  end if;
  if v_source_type <> v_target_type then
    raise exception 'Os protocolos precisam ser do mesmo tipo';
  end if;

  if v_source_type = 'workout' then
    for v_day in
      select * from public.workout_days where protocol_id = p_source order by sort_order
    loop
      insert into public.workout_days (protocol_id, name, sort_order)
      values (p_target, v_day.name, v_day.sort_order)
      returning id into v_new_day_id;

      insert into public.exercises
        (workout_day_id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, sort_order)
      select v_new_day_id, name, sets, reps, rest_seconds, recommended_load_kg, video_url, notes, sort_order
      from public.exercises
      where workout_day_id = v_day.id
      order by sort_order;
    end loop;
  else
    for v_meal in
      select * from public.meals where protocol_id = p_source order by sort_order
    loop
      insert into public.meals (protocol_id, name, suggested_time, sort_order)
      values (p_target, v_meal.name, v_meal.suggested_time, v_meal.sort_order)
      returning id into v_new_meal_id;

      for v_option in
        select * from public.meal_options where meal_id = v_meal.id order by sort_order
      loop
        insert into public.meal_options (meal_id, label, sort_order)
        values (v_new_meal_id, v_option.label, v_option.sort_order)
        returning id into v_new_option_id;

        insert into public.meal_items
          (meal_option_id, food_name, quantity, unit, notes, sort_order)
        select v_new_option_id, food_name, quantity, unit, notes, sort_order
        from public.meal_items
        where meal_option_id = v_option.id
        order by sort_order;
      end loop;
    end loop;
  end if;
end;
$$;

revoke execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid)
  from public, anon;
grant execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid)
  to authenticated;
