-- Refeições (ex: "Café da manhã")
create table public.meals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  name text not null,
  suggested_time time,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_meals_student_id on public.meals(student_id);

alter table public.meals enable row level security;

create policy "meals_trainer_all"
  on public.meals for all
  using (
    exists (
      select 1 from public.students s
      where s.id = meals.student_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = meals.student_id and s.trainer_id = auth.uid()
    )
  );

create policy "meals_student_select_own"
  on public.meals for select
  using (
    exists (
      select 1 from public.students s
      where s.id = meals.student_id and s.profile_id = auth.uid()
    )
  );

-- Itens (alimentos/líquidos) de cada refeição
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
      join public.students s on s.id = m.student_id
      where m.id = meal_items.meal_id and s.trainer_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      join public.students s on s.id = m.student_id
      where m.id = meal_items.meal_id and s.trainer_id = auth.uid()
    )
  );

create policy "meal_items_student_select_own"
  on public.meal_items for select
  using (
    exists (
      select 1 from public.meals m
      join public.students s on s.id = m.student_id
      where m.id = meal_items.meal_id and s.profile_id = auth.uid()
    )
  );
