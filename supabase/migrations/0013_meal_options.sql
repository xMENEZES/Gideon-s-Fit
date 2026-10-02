-- Opções por refeição (ex.: "Opção 1", "Opção 2 (líquida)") — cada refeição
-- passa a ter 1+ grupos alternativos e completos de itens, em vez de uma
-- única lista fixa. Quando há apenas 1 opção, a interface não exibe rótulo
-- (comportamento visual igual ao anterior).

create table public.meal_options (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  label text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_meal_options_meal_id on public.meal_options(meal_id);

alter table public.meal_options enable row level security;

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

-- Backfill não-destrutivo: cria 1 opção padrão para cada refeição já
-- existente e migra os itens atuais para ela, preservando os dados reais
-- já cadastrados em produção.
insert into public.meal_options (meal_id, label, sort_order)
select id, '', 0 from public.meals;

alter table public.meal_items
  add column meal_option_id uuid references public.meal_options(id) on delete cascade;

update public.meal_items mi
  set meal_option_id = mo.id
  from public.meal_options mo
  where mo.meal_id = mi.meal_id;

alter table public.meal_items alter column meal_option_id set not null;

-- Recria as policies de meal_items apontando para meal_option_id em vez de
-- meal_id (join extra via meal_options -> meals).
drop policy "meal_items_trainer_all" on public.meal_items;
drop policy "meal_items_student_select_own" on public.meal_items;

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

drop index if exists idx_meal_items_meal_id;
create index idx_meal_items_meal_option_id on public.meal_items(meal_option_id);

alter table public.meal_items drop column meal_id;

-- Recria start_new_protocol (0005/0010/0011/0012) para também duplicar
-- meal_options ao duplicar um protocolo de dieta.
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
