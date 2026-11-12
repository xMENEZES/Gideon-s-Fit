-- Gerador de treino (tela): descanso opcional e função que grava o treino gerado.
--
-- 1) O descanso entre as séries (`exercises.rest_seconds`) passa a ser OPCIONAL e sem valor padrão:
--    o gerador não sugere tempo nenhum, quem decide é a pessoa. Os exercícios que já existem
--    mantêm o valor que têm. Sem tempo definido, a tela não mostra o selo "Xs descanso" nem o
--    cronômetro do exercício.
-- 2) `create_generated_workout`: grava o protocolo de treino, os dias e os exercícios numa única
--    transação (nunca sobra um treino pela metade), só para o Usuário Padrão e só no plano próprio.
--
-- Só acrescenta (uma coluna deixa de ser obrigatória e uma função nova): o código atual da main
-- continua funcionando. Reversão: 0038_rollback.sql

alter table public.exercises alter column rest_seconds drop not null;
alter table public.exercises alter column rest_seconds drop default;
-- A restrição exercises_rest_seconds_range (5 a 3600) continua valendo quando há valor.

-- p_days: lista de dias [{ "name": "A - Corpo inteiro", "exercises": [ ... ] }], em que cada exercício é
--   { "kind": "strength", "name": "...", "sets": 3, "reps": "10-12" }  ou
--   { "kind": "cardio", "name": "Caminhada", "targetMinutes": 20, "notes": "..." }.
create or replace function public.create_generated_workout(
  p_student_id uuid,
  p_start_date date,
  p_end_date date,
  p_notes text,
  p_days jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_protocol_id uuid;
  v_day jsonb;
  v_exercise jsonb;
  v_day_id uuid;
  v_day_position int := 0;
  v_exercise_position int;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'standard') then
    raise exception 'generated_workout_forbidden';
  end if;
  -- Só o plano próprio: a linha em que a pessoa é, ao mesmo tempo, o "profissional" e o "aluno".
  if not exists (
    select 1 from public.students
    where id = p_student_id and trainer_id = auth.uid() and profile_id = auth.uid()
  ) then
    raise exception 'generated_workout_student';
  end if;
  if p_notes is not null and char_length(p_notes) > 2000 then
    raise exception 'generated_workout_invalid';
  end if;
  if p_days is null or jsonb_typeof(p_days) <> 'array'
     or jsonb_array_length(p_days) < 1 or jsonb_array_length(p_days) > 14 then
    raise exception 'generated_workout_invalid';
  end if;

  -- O treino ativo (se houver) vai para o histórico, como em "Novo protocolo".
  update public.protocols
    set is_active = false
    where student_id = p_student_id and type = 'workout' and is_active;

  insert into public.protocols (student_id, type, start_date, end_date, created_by, notes)
  values (p_student_id, 'workout', p_start_date, p_end_date, auth.uid(), p_notes)
  returning id into v_protocol_id;

  for v_day in select value from jsonb_array_elements(p_days) loop
    if coalesce(jsonb_typeof(v_day), '') <> 'object'
       or coalesce(jsonb_typeof(v_day->'name'), '') <> 'string'
       or char_length(v_day->>'name') not between 2 and 80
       or coalesce(jsonb_typeof(v_day->'exercises'), '') <> 'array'
       or jsonb_array_length(v_day->'exercises') < 1
       or jsonb_array_length(v_day->'exercises') > 40 then
      raise exception 'generated_workout_invalid';
    end if;

    insert into public.workout_days (protocol_id, name, sort_order)
    values (v_protocol_id, v_day->>'name', v_day_position)
    returning id into v_day_id;
    v_day_position := v_day_position + 1;
    v_exercise_position := 0;

    for v_exercise in select value from jsonb_array_elements(v_day->'exercises') loop
      if coalesce(jsonb_typeof(v_exercise), '') <> 'object'
         or coalesce(jsonb_typeof(v_exercise->'name'), '') <> 'string'
         or char_length(v_exercise->>'name') not between 2 and 120
         or coalesce(v_exercise->>'kind', '') not in ('strength', 'cardio')
         or (v_exercise ? 'notes' and (coalesce(jsonb_typeof(v_exercise->'notes'), '') <> 'string'
                                       or char_length(v_exercise->>'notes') > 1000)) then
        raise exception 'generated_workout_invalid';
      end if;

      if v_exercise->>'kind' = 'strength' then
        if coalesce(jsonb_typeof(v_exercise->'sets'), '') <> 'number' or (v_exercise->>'sets') !~ '^[0-9]{1,2}$'
           or (v_exercise->>'sets')::int not between 1 and 50
           or coalesce(jsonb_typeof(v_exercise->'reps'), '') <> 'string'
           or char_length(v_exercise->>'reps') not between 1 and 40 then
          raise exception 'generated_workout_invalid';
        end if;
        -- Sem descanso: rest_seconds fica nulo, de propósito.
        insert into public.exercises
          (workout_day_id, name, kind, sets, reps, rest_seconds, notes, sort_order)
        values
          (v_day_id, v_exercise->>'name', 'strength', (v_exercise->>'sets')::int,
           v_exercise->>'reps', null, v_exercise->>'notes', v_exercise_position);
      else
        if coalesce(jsonb_typeof(v_exercise->'targetMinutes'), '') <> 'number'
           or (v_exercise->>'targetMinutes') !~ '^[0-9]{1,4}$'
           or (v_exercise->>'targetMinutes')::int not between 1 and 1440 then
          raise exception 'generated_workout_invalid';
        end if;
        insert into public.exercises
          (workout_day_id, name, kind, target_minutes, rest_seconds, notes, sort_order)
        values
          (v_day_id, v_exercise->>'name', 'cardio', (v_exercise->>'targetMinutes')::int,
           null, v_exercise->>'notes', v_exercise_position);
      end if;
      v_exercise_position := v_exercise_position + 1;
    end loop;
  end loop;

  return v_protocol_id;
end;
$$;

revoke execute on function public.create_generated_workout(uuid, date, date, text, jsonb) from public, anon;
grant execute on function public.create_generated_workout(uuid, date, date, text, jsonb) to authenticated;
