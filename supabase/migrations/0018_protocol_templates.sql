-- Modelos de protocolo: o profissional monta uma estrutura padrão de treino ou de
-- alimentação uma vez e aplica a vários alunos. Um modelo é um protocolo sem aluno
-- (student_id nulo), com dono (owner_trainer_id) e nome, sempre inativo. Assim as
-- mesmas tabelas e as mesmas telas de edição servem para modelos e protocolos reais.

alter table public.protocols alter column student_id drop not null;
alter table public.protocols
  add column owner_trainer_id uuid references public.profiles(id) on delete cascade,
  add column template_name text;

alter table public.protocols add constraint protocols_student_xor_template check (
  (student_id is not null and owner_trainer_id is null and template_name is null)
  or
  (student_id is null and owner_trainer_id is not null and template_name is not null and not is_active)
);

create index idx_protocols_owner_trainer on public.protocols (owner_trainer_id)
  where owner_trainer_id is not null;

-- Só profissionais criam e enxergam os próprios modelos.
create policy "protocols_template_owner_all"
  on public.protocols for all
  using (owner_trainer_id = auth.uid())
  with check (
    owner_trainer_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'trainer')
  );

create policy "workout_days_template_owner_all"
  on public.workout_days for all
  using (
    exists (
      select 1 from public.protocols p
      where p.id = workout_days.protocol_id and p.owner_trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocols p
      where p.id = workout_days.protocol_id and p.owner_trainer_id = auth.uid()
    )
  );

create policy "exercises_template_owner_all"
  on public.exercises for all
  using (
    exists (
      select 1 from public.workout_days wd
      join public.protocols p on p.id = wd.protocol_id
      where wd.id = exercises.workout_day_id and p.owner_trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_days wd
      join public.protocols p on p.id = wd.protocol_id
      where wd.id = exercises.workout_day_id and p.owner_trainer_id = auth.uid()
    )
  );

create policy "meals_template_owner_all"
  on public.meals for all
  using (
    exists (
      select 1 from public.protocols p
      where p.id = meals.protocol_id and p.owner_trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.protocols p
      where p.id = meals.protocol_id and p.owner_trainer_id = auth.uid()
    )
  );

create policy "meal_options_template_owner_all"
  on public.meal_options for all
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      where m.id = meal_options.meal_id and p.owner_trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      where m.id = meal_options.meal_id and p.owner_trainer_id = auth.uid()
    )
  );

create policy "meal_items_template_owner_all"
  on public.meal_items for all
  using (
    exists (
      select 1 from public.meal_options o
      join public.meals m on m.id = o.meal_id
      join public.protocols p on p.id = m.protocol_id
      where o.id = meal_items.meal_option_id and p.owner_trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meal_options o
      join public.meals m on m.id = o.meal_id
      join public.protocols p on p.id = m.protocol_id
      where o.id = meal_items.meal_option_id and p.owner_trainer_id = auth.uid()
    )
  );

-- Copia o conteúdo (dias e exercícios, ou refeições, opções e alimentos) de um
-- protocolo para outro do mesmo tipo. Roda com as permissões de quem chama (RLS):
-- só copia de onde a pessoa pode ler e só grava onde ela pode escrever.
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

-- Cria um protocolo novo e ativo para o aluno a partir de qualquer protocolo que o
-- profissional enxerga (modelo, protocolo de outro aluno, ativo ou do histórico).
-- O protocolo ativo do mesmo tipo, se houver, é encerrado e vai para o histórico.
create or replace function public.apply_protocol(
  p_source_protocol_id uuid,
  p_student_id uuid,
  p_end_date date,
  p_start_date date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_type public.protocol_type;
  v_notes text;
  v_new_protocol_id uuid;
begin
  select type, notes into v_type, v_notes from public.protocols where id = p_source_protocol_id;
  if v_type is null then
    raise exception 'Protocolo de origem não encontrado';
  end if;
  if not exists (
    select 1 from public.students where id = p_student_id and trainer_id = auth.uid()
  ) then
    raise exception 'Aluno não encontrado';
  end if;

  update public.protocols
    set is_active = false
    where student_id = p_student_id and type = v_type and is_active;

  insert into public.protocols (student_id, type, start_date, end_date, created_by, notes)
  values (p_student_id, v_type, p_start_date, p_end_date, auth.uid(), v_notes)
  returning id into v_new_protocol_id;

  perform public.copy_protocol_content(p_source_protocol_id, v_new_protocol_id);

  return v_new_protocol_id;
end;
$$;

-- Salva uma cópia de um protocolo existente como modelo do profissional.
create or replace function public.create_template_from_protocol(
  p_source_protocol_id uuid,
  p_name text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_type public.protocol_type;
  v_notes text;
  v_new_protocol_id uuid;
begin
  select type, notes into v_type, v_notes from public.protocols where id = p_source_protocol_id;
  if v_type is null then
    raise exception 'Protocolo de origem não encontrado';
  end if;

  insert into public.protocols
    (student_id, owner_trainer_id, template_name, type, start_date, end_date, is_active, created_by, notes)
  values
    (null, auth.uid(), p_name, v_type, current_date, current_date, false, auth.uid(), v_notes)
  returning id into v_new_protocol_id;

  perform public.copy_protocol_content(p_source_protocol_id, v_new_protocol_id);

  return v_new_protocol_id;
end;
$$;
