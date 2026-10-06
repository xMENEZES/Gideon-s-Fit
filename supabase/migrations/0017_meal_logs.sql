-- Registro diário de refeições: a pessoa marca se fez ou não cada refeição do
-- protocolo alimentar, com uma anotação opcional quando não fez. O registro fica
-- preso à refeição (que pertence a um protocolo), então cada ciclo tem o seu.

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  log_date date not null,
  done boolean not null,
  note text check (note is null or char_length(note) <= 500),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meal_id, log_date)
);

create index idx_meal_logs_meal_date on public.meal_logs (meal_id, log_date);

alter table public.meal_logs enable row level security;
revoke all on public.meal_logs from anon;

-- Quem é dono do protocolo (o aluno do time ou o Usuário Padrão no plano próprio).
create policy "meal_logs_owner_select"
  on public.meal_logs for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );

-- O profissional só lê; quem registra é a própria pessoa.
create policy "meal_logs_trainer_select"
  on public.meal_logs for select
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.trainer_id = auth.uid()
    )
  );

-- A janela de datas é só uma rede de segurança: a regra exata (hoje e até 3 dias
-- antes, no horário de Brasília) fica na server action. current_date aqui é UTC,
-- por isso a folga de 1 dia para frente e 5 para trás.
create policy "meal_logs_owner_insert"
  on public.meal_logs for insert
  with check (
    created_by = auth.uid()
    and log_date between current_date - 5 and current_date + 1
    and exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );

create policy "meal_logs_owner_update"
  on public.meal_logs for update
  using (
    exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  )
  with check (
    created_by = auth.uid()
    and log_date between current_date - 5 and current_date + 1
  );

create policy "meal_logs_owner_delete"
  on public.meal_logs for delete
  using (
    log_date between current_date - 5 and current_date + 1
    and exists (
      select 1 from public.meals m
      join public.protocols p on p.id = m.protocol_id
      join public.students s on s.id = p.student_id
      where m.id = meal_logs.meal_id and s.profile_id = auth.uid()
    )
  );
