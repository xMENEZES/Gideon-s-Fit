-- Reverte a 0026_choice_groups.sql: devolve as funções de cópia ao corpo da 0024 e remove a
-- coluna `choice_group` (os grupos dos alimentos se perdem; os itens continuam, como itens
-- comuns). Rode DEPOIS de voltar o deploy do app para uma versão sem grupos.

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

alter table public.meal_items
  drop constraint if exists meal_items_choice_group_len,
  drop column if exists choice_group;
