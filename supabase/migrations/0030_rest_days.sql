-- Dias de descanso: a própria pessoa marca os dias em que não treina (o app não tem como saber,
-- porque o treino segue a sequência A, B, C e não os dias da semana). Na tela de Status o dia
-- marcado aparece com cor própria no calendário, em vez de contar como "treino não feito".
--
-- A linha é por plano (students.id, o mesmo de daily_scores e dos protocolos) e por data.
-- - Ler: o dono do plano e o profissional do time (can_read_student_scores, da 0027).
-- - Gravar e apagar: só o dono do plano (na linha "solo" o profissional é o próprio dono).
-- - Só datas de hoje para trás (folga de 1 dia pelo UTC) e até 400 dias atrás, o que também
--   limita a quantidade de linhas por pessoa.
-- - Um dia que já tem registro de exercício não pode ser marcado como descanso.
-- As sequências e os selos NÃO mudam: o descanso marcado não segura a sequência.
-- Reversão: 0030_rollback.sql

-- Dono do plano: quem treina com ele (a pessoa do time ou o Usuário Padrão), não o profissional.
create or replace function public.owns_student_plan(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student and s.profile_id = auth.uid()
  )
$$;
revoke execute on function public.owns_student_plan(uuid) from public, anon;
grant execute on function public.owns_student_plan(uuid) to authenticated;

create table public.rest_days (
  student_id uuid not null references public.students(id) on delete cascade,
  rest_date date not null,
  created_at timestamptz not null default now(),
  primary key (student_id, rest_date)
);

alter table public.rest_days enable row level security;
revoke all on public.rest_days from anon, authenticated;
grant select, insert, delete on public.rest_days to authenticated;

create policy "rest_days_select" on public.rest_days for select to authenticated
  using (public.can_read_student_scores(student_id));
-- A janela de datas fica na política (e não num CHECK com current_date): ela só vale na hora de
-- gravar, então restaurar um backup com linhas antigas não falha.
create policy "rest_days_insert" on public.rest_days for insert to authenticated
  with check (
    public.owns_student_plan(student_id)
    and rest_date <= current_date + 1
    and rest_date >= current_date - 400
  );
create policy "rest_days_delete" on public.rest_days for delete to authenticated
  using (public.owns_student_plan(student_id));

-- Não deixa marcar descanso num dia em que a pessoa já registrou exercício.
-- Definer para ler os registros sem reavaliar as regras de acesso de cada tabela.
create or replace function public.rest_days_no_workout_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1
    from public.exercise_load_logs l
    join public.exercises e on e.id = l.exercise_id
    join public.workout_days d on d.id = e.workout_day_id
    join public.protocols p on p.id = d.protocol_id
    where p.student_id = new.student_id and l.logged_at = new.rest_date
  ) then
    raise exception 'rest_day_has_workout';
  end if;
  return new;
end $$;

revoke execute on function public.rest_days_no_workout_guard() from public, anon, authenticated;

create trigger rest_days_no_workout_guard before insert on public.rest_days
  for each row execute function public.rest_days_no_workout_guard();
