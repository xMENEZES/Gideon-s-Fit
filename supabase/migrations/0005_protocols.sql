-- Módulos habilitados por aluno (treino/dieta independentes)
alter table public.students
  add column has_workout boolean not null default true,
  add column has_diet boolean not null default true;

-- Tipo de protocolo
create type public.protocol_type as enum ('workout', 'diet');

-- Protocolos: cada ciclo de treino ou dieta de um aluno, com período definido.
-- A troca de ciclo é sempre manual (nunca automática por data) — ver função
-- start_new_protocol no fim deste arquivo.
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  type public.protocol_type not null,
  start_date date not null default current_date,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id),

  constraint protocols_end_after_start check (end_date >= start_date)
);

create index idx_protocols_student_id on public.protocols(student_id);

-- Garante no máximo 1 protocolo ATIVO por aluno+tipo (permite N inativos/históricos)
create unique index uq_protocols_active_per_student_type
  on public.protocols(student_id, type)
  where is_active;

alter table public.protocols enable row level security;

create policy "protocols_trainer_all"
  on public.protocols for all
  using (
    exists (
      select 1 from public.students s
      where s.id = protocols.student_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = protocols.student_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "protocols_student_select_own"
  on public.protocols for select
  using (
    exists (
      select 1 from public.students s
      where s.id = protocols.student_id
        and s.profile_id = auth.uid()
    )
  );

-- Recria workout_days/exercises/exercise_load_logs apontando para protocol_id
-- em vez de student_id (não há dados reais em produção ainda, então recriar
-- do zero é mais simples que uma migração incremental).
drop table if exists public.exercise_load_logs cascade;
drop table if exists public.exercises cascade;
drop table if exists public.workout_days cascade;

create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_workout_days_protocol_id on public.workout_days(protocol_id);

alter table public.workout_days enable row level security;

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

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  name text not null,
  sets int not null,
  reps text not null,
  video_url text,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_exercises_workout_day_id on public.exercises(workout_day_id);

alter table public.exercises enable row level security;

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

-- Histórico de carga (progressão) de cada exercício — escopado por protocolo,
-- já que ao duplicar um protocolo os exercícios ganham IDs novos e não
-- herdam os logs antigos (cada ciclo tem seu próprio gráfico de progressão).
create table public.exercise_load_logs (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  logged_at date not null default current_date,
  weight_kg numeric(6,2) not null,
  reps_done int,
  notes text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_load_logs_exercise_id on public.exercise_load_logs(exercise_id, logged_at);

alter table public.exercise_load_logs enable row level security;

create policy "load_logs_trainer_all"
  on public.exercise_load_logs for all
  using (
    exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      join public.students s on s.id = p.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.trainer_id = auth.uid()
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

-- Recria meals/meal_items apontando para protocol_id em vez de student_id
drop table if exists public.meal_items cascade;
drop table if exists public.meals cascade;

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  name text not null,
  suggested_time time,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_meals_protocol_id on public.meals(protocol_id);

alter table public.meals enable row level security;

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

create policy "meals_student_select_own"
  on public.meals for select
  using (
    exists (
      select 1 from public.protocols p
      join public.students s on s.id = p.student_id
      where p.id = meals.protocol_id and s.profile_id = auth.uid()
    )
  );

create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  food_name text not null,
  quantity numeric(8,2) not null,
  unit text not null,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_meal_items_meal_id on public.meal_items(meal_id);

alter table public.meal_items enable row level security;

create policy "meal_items_trainer_all"
  on public.meal_items for all
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_items.meal_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_items.meal_id and s.trainer_id = auth.uid()
    )
  );

create policy "meal_items_student_select_own"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_items.meal_id and s.profile_id = auth.uid()
    )
  );

-- Troca de protocolo atômica: congela o ativo, cria o novo e (opcionalmente)
-- duplica o conteúdo. security invoker (padrão) é essencial — precisa
-- continuar respeitando RLS/auth.uid() do trainer chamador, nunca rodar com
-- privilégio elevado.
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
          (workout_day_id, name, sets, reps, video_url, notes, sort_order)
        select v_new_day_id, name, sets, reps, video_url, notes, sort_order
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
