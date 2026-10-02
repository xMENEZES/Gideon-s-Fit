-- Alunos: criados pelo trainer, sempre já vinculados a um profile de aluno
-- (o convite via Admin API acontece antes do INSERT nesta tabela, então
-- profile_id nunca fica órfão/pendente).
create table public.students (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  full_name text not null,
  email text not null,
  birth_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_students_trainer_id on public.students(trainer_id);
create index idx_students_profile_id on public.students(profile_id);

alter table public.students enable row level security;

-- Trainer: CRUD completo, apenas nos próprios alunos
create policy "students_trainer_all"
  on public.students for all
  using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Aluno: somente leitura do próprio registro
create policy "students_student_select_own"
  on public.students for select
  using (profile_id = auth.uid());
