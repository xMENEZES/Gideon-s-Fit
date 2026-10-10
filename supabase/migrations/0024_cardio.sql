-- Cardio como TIPO de exercício dentro de um dia de treino (ex.: "Corrida, 30 min" ou
-- "Bicicleta, 5 km"), ao lado da musculação. Migração só de acréscimo: o código atual
-- continua funcionando depois dela (todo exercício existente vira 'strength').
-- A atividade (Corrida, Bicicleta...) fica no campo `name` que já existe.
-- Reversão: 0024_rollback.sql (apaga os exercícios de cardio já criados).

-- 1) Exercícios: tipo e metas do cardio ------------------------------------------------
alter table public.exercises
  add column kind text not null default 'strength',
  add column target_minutes int,
  add column target_distance_km numeric(6,2);

-- Séries e repetições só fazem sentido na musculação.
alter table public.exercises
  alter column sets drop not null,
  alter column reps drop not null;

alter table public.exercises
  add constraint exercises_kind_check check (kind in ('strength', 'cardio')),
  add constraint exercises_target_minutes_range
    check (target_minutes is null or target_minutes between 1 and 1440),
  add constraint exercises_target_distance_range
    check (target_distance_km is null or (target_distance_km > 0 and target_distance_km <= 1000)),
  add constraint exercises_kind_fields check (
    (kind = 'strength' and sets is not null and reps is not null
      and target_minutes is null and target_distance_km is null)
    or
    (kind = 'cardio' and (target_minutes is not null or target_distance_km is not null))
  );

-- O tipo não muda depois de criado (evita registros incoerentes com o exercício).
create or replace function public.exercises_kind_immutable() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.kind is distinct from old.kind then
    raise exception 'exercise_kind_immutable';
  end if;
  return new;
end $$;

create trigger exercises_kind_immutable before update of kind on public.exercises
  for each row execute function public.exercises_kind_immutable();

-- 2) Registros: carga OU minutos/km -------------------------------------------------------
alter table public.exercise_load_logs
  alter column weight_kg drop not null,
  add column duration_minutes int,
  add column distance_km numeric(6,2);

alter table public.exercise_load_logs
  add constraint load_logs_duration_range
    check (duration_minutes is null or duration_minutes between 1 and 1440),
  add constraint load_logs_distance_range
    check (distance_km is null or (distance_km > 0 and distance_km <= 1000)),
  add constraint load_logs_has_value
    check (weight_kg is not null or duration_minutes is not null or distance_km is not null);

-- Garante no banco que o registro combina com o tipo do exercício: musculação registra
-- carga (e nada de minutos/km); cardio registra minutos e/ou km (e nada de carga).
-- Definer para ler o tipo sem reavaliar as regras de acesso (consulta pela chave primária).
create or replace function public.exercise_load_logs_kind_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_kind text;
begin
  select kind into v_kind from public.exercises where id = new.exercise_id;
  if v_kind = 'strength' and (new.weight_kg is null
      or new.duration_minutes is not null or new.distance_km is not null) then
    raise exception 'log_kind_mismatch:strength';
  end if;
  if v_kind = 'cardio' and (new.weight_kg is not null
      or (new.duration_minutes is null and new.distance_km is null)) then
    raise exception 'log_kind_mismatch:cardio';
  end if;
  return new;
end $$;

revoke execute on function public.exercise_load_logs_kind_guard() from public, anon, authenticated;
revoke execute on function public.exercises_kind_immutable() from public, anon, authenticated;

create trigger exercise_load_logs_kind_guard before insert on public.exercise_load_logs
  for each row execute function public.exercise_load_logs_kind_guard();

-- 3) Funções que COPIAM exercícios: passam a levar o tipo e as metas -----------------------
-- (sem isto o cardio seria perdido ao duplicar protocolo, aplicar modelo ou salvar modelo).
-- Corpo igual ao de 0013 (start_new_protocol) e 0018 (copy_protocol_content); só muda a lista
-- de colunas do insert em public.exercises.

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
          (workout_day_id, name, kind, sets, reps, rest_seconds, recommended_load_kg,
           target_minutes, target_distance_km, video_url, notes, sort_order)
        select v_new_day_id, name, kind, sets, reps, rest_seconds, recommended_load_kg,
               target_minutes, target_distance_km, video_url, notes, sort_order
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
        (workout_day_id, name, kind, sets, reps, rest_seconds, recommended_load_kg,
         target_minutes, target_distance_km, video_url, notes, sort_order)
      select v_new_day_id, name, kind, sets, reps, rest_seconds, recommended_load_kg,
             target_minutes, target_distance_km, video_url, notes, sort_order
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

-- Privilégios iguais aos da 0020 (create or replace já os preserva; reaplicado por segurança).
revoke execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid)
  from public, anon;
grant execute on function
  public.start_new_protocol(uuid, public.protocol_type, date, boolean, date),
  public.copy_protocol_content(uuid, uuid)
  to authenticated;
