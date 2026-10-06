-- Corrige a lentidão causada pelas políticas de modelo da 0018: cada política consultava
-- tabelas que também têm políticas, e o banco reavaliava tudo em cascata a cada linha
-- (protocolos alimentares, com 4 níveis, estouravam o tempo limite). As verificações de
-- dono passam a ser funções security definer: uma consulta direta, sem reavaliar RLS.

create or replace function public.owns_template(p_protocol_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.protocols
    where id = p_protocol_id and owner_trainer_id = auth.uid()
  );
$$;

create or replace function public.owns_template_workout_day(p_day_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workout_days wd
    join public.protocols p on p.id = wd.protocol_id
    where wd.id = p_day_id and p.owner_trainer_id = auth.uid()
  );
$$;

create or replace function public.owns_template_meal(p_meal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meals m
    join public.protocols p on p.id = m.protocol_id
    where m.id = p_meal_id and p.owner_trainer_id = auth.uid()
  );
$$;

create or replace function public.owns_template_meal_option(p_option_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meal_options o
    join public.meals m on m.id = o.meal_id
    join public.protocols p on p.id = m.protocol_id
    where o.id = p_option_id and p.owner_trainer_id = auth.uid()
  );
$$;

revoke execute on function
  public.owns_template(uuid),
  public.owns_template_workout_day(uuid),
  public.owns_template_meal(uuid),
  public.owns_template_meal_option(uuid)
from public, anon;
grant execute on function
  public.owns_template(uuid),
  public.owns_template_workout_day(uuid),
  public.owns_template_meal(uuid),
  public.owns_template_meal_option(uuid)
to authenticated;

drop policy if exists "workout_days_template_owner_all" on public.workout_days;
drop policy if exists "exercises_template_owner_all" on public.exercises;
drop policy if exists "meals_template_owner_all" on public.meals;
drop policy if exists "meal_options_template_owner_all" on public.meal_options;
drop policy if exists "meal_items_template_owner_all" on public.meal_items;

create policy "workout_days_template_owner_all"
  on public.workout_days for all
  using (public.owns_template(protocol_id))
  with check (public.owns_template(protocol_id));

create policy "exercises_template_owner_all"
  on public.exercises for all
  using (public.owns_template_workout_day(workout_day_id))
  with check (public.owns_template_workout_day(workout_day_id));

create policy "meals_template_owner_all"
  on public.meals for all
  using (public.owns_template(protocol_id))
  with check (public.owns_template(protocol_id));

create policy "meal_options_template_owner_all"
  on public.meal_options for all
  using (public.owns_template_meal(meal_id))
  with check (public.owns_template_meal(meal_id));

create policy "meal_items_template_owner_all"
  on public.meal_items for all
  using (public.owns_template_meal_option(meal_option_id))
  with check (public.owns_template_meal_option(meal_option_id));
