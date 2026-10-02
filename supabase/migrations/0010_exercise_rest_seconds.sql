-- Descanso (em segundos) configurável pelo profissional por exercício.
alter table public.exercises
  add column rest_seconds int not null default 60;

alter table public.exercises
  add constraint exercises_rest_seconds_range check (rest_seconds between 5 and 3600);

-- Recria start_new_protocol (0005_protocols.sql) só para também copiar
-- rest_seconds ao duplicar exercícios; sem isso o valor customizado se
-- perderia e voltaria para o default de 60s a cada novo ciclo de treino.
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
  v_new_protocol_id uuid;
  v_old_day record;
  v_new_day_id uuid;
  v_old_meal record;
  v_new_meal_id uuid;
begin
  update public.protocols
    set is_active = false
    where student_id = p_student_id
      and type = p_type
      and is_active
    returning id into v_old_protocol_id;

  insert into public.protocols (student_id, type, start_date, end_date, created_by)
  values (p_student_id, p_type, p_start_date, p_end_date, auth.uid())
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
          (workout_day_id, name, sets, reps, rest_seconds, video_url, notes, sort_order)
        select v_new_day_id, name, sets, reps, rest_seconds, video_url, notes, sort_order
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

        insert into public.meal_items
          (meal_id, food_name, quantity, unit, notes, sort_order)
        select v_new_meal_id, food_name, quantity, unit, notes, sort_order
        from public.meal_items
        where meal_id = v_old_meal.id
        order by sort_order;
      end loop;
    end if;
  end if;

  return v_new_protocol_id;
end;
$$;
