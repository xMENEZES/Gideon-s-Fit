-- Observações gerais do protocolo (resumo técnico, conduta do período,
-- recomendações essenciais etc.) — texto livre, um por protocolo (treino ou
-- dieta), editável apenas pelo trainer.
alter table public.protocols add column notes text;

-- Recria start_new_protocol para copiar as observações do ciclo anterior
-- (o trainer ajusta depois, se precisar) quando duplicar um protocolo.
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
