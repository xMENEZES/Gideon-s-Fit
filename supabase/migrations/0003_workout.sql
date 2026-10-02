-- Dias de treino (ex: "Treino A - Peito/Tríceps")
create table public.workout_days (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_workout_days_student_id on public.workout_days(student_id);

alter table public.workout_days enable row level security;

create policy "workout_days_trainer_all"
  on public.workout_days for all
  using (
    exists (
      select 1 from public.students s
      where s.id = workout_days.student_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = workout_days.student_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "workout_days_student_select_own"
  on public.workout_days for select
  using (
    exists (
      select 1 from public.students s
      where s.id = workout_days.student_id
        and s.profile_id = auth.uid()
    )
  );

-- Exercícios de cada dia de treino
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
      join public.students s on s.id = wd.student_id
      where wd.id = exercises.workout_day_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_days wd
      join public.students s on s.id = wd.student_id
      where wd.id = exercises.workout_day_id
        and s.trainer_id = auth.uid()
    )
  );

create policy "exercises_student_select_own"
  on public.exercises for select
  using (
    exists (
      select 1 from public.workout_days wd
      join public.students s on s.id = wd.student_id
      where wd.id = exercises.workout_day_id
        and s.profile_id = auth.uid()
    )
  );

-- Histórico de carga (progressão) de cada exercício, usado no gráfico
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
      join public.students s on s.id = wd.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exercises e
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.students s on s.id = wd.student_id
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
      join public.students s on s.id = wd.student_id
      where e.id = exercise_load_logs.exercise_id
        and s.profile_id = auth.uid()
    )
  );
