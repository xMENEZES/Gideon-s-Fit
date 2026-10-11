-- Gamificação, etapa 2: resultado diário, selos e fechamento da brecha de datas.
--
-- 1) daily_scores: uma linha por plano (time ou próprio, students.id) e por dia, com duas marcas:
--    workout_done = TODOS os exercícios de um mesmo dia do protocolo de treino têm registro na data
--                   (musculação ou cardio);
--    diet_done    = TODAS as refeições de um protocolo alimentar foram marcadas "fiz" na data.
--    Quem grava são gatilhos (security definer) que recalculam a partir dos registros: o cliente
--    nunca envia pontos. A linha do dia fica como foi gravada: apagar ou editar o protocolo depois
--    não mexe nos dias passados (exclusões em cascata não disparam recálculo).
-- 2) achievements: selos conquistados (linha, marco, data). Só o servidor (service role) grava.
-- 3) Os registros de carga passam a aceitar só a data de hoje (folga de 1 dia por causa do UTC),
--    como já acontece nas refeições; antes o banco aceitava qualquer data.
-- Reversão: 0027_rollback.sql

-- Leitura: o dono do plano e o profissional do time (na linha "solo" os dois são a mesma pessoa).
create or replace function public.can_read_student_scores(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    where s.id = p_student and (s.profile_id = auth.uid() or s.trainer_id = auth.uid())
  )
$$;
revoke execute on function public.can_read_student_scores(uuid) from public, anon;
grant execute on function public.can_read_student_scores(uuid) to authenticated;

create table public.daily_scores (
  student_id uuid not null references public.students(id) on delete cascade,
  score_date date not null,
  workout_done boolean not null default false,
  diet_done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (student_id, score_date)
);

alter table public.daily_scores enable row level security;
revoke all on public.daily_scores from anon, authenticated;
grant select on public.daily_scores to authenticated;
create policy "daily_scores_select" on public.daily_scores for select to authenticated
  using (public.can_read_student_scores(student_id));

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  line text not null check (line in ('workout', 'diet', 'both')),
  milestone int not null check (milestone in (3, 7, 14, 30, 60, 100, 200)),
  earned_on date not null,
  created_at timestamptz not null default now(),
  unique (student_id, line, milestone)
);

alter table public.achievements enable row level security;
revoke all on public.achievements from anon, authenticated;
grant select on public.achievements to authenticated;
create policy "achievements_select" on public.achievements for select to authenticated
  using (public.can_read_student_scores(student_id));

-- Recalcula o resultado de um plano em uma data a partir dos registros.
create or replace function public.recompute_daily_score(p_student uuid, p_date date)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_workout boolean;
  v_diet boolean;
begin
  -- Treino: algum dia (com ao menos 1 exercício) em que todos os exercícios têm registro na data.
  select exists (
    select 1
    from public.workout_days d
    join public.protocols p on p.id = d.protocol_id
    where p.student_id = p_student and p.type = 'workout'
      and exists (select 1 from public.exercises e where e.workout_day_id = d.id)
      and not exists (
        select 1 from public.exercises e
        where e.workout_day_id = d.id
          and not exists (
            select 1 from public.exercise_load_logs l
            where l.exercise_id = e.id and l.logged_at = p_date
          )
      )
  ) into v_workout;

  -- Dieta: algum protocolo (com ao menos 1 refeição) em que todas as refeições foram feitas na data.
  select exists (
    select 1
    from public.protocols p
    where p.student_id = p_student and p.type = 'diet'
      and exists (select 1 from public.meals m where m.protocol_id = p.id)
      and not exists (
        select 1 from public.meals m
        where m.protocol_id = p.id
          and not exists (
            select 1 from public.meal_logs l
            where l.meal_id = m.id and l.log_date = p_date and l.done
          )
      )
  ) into v_diet;

  insert into public.daily_scores (student_id, score_date, workout_done, diet_done)
  values (p_student, p_date, v_workout, v_diet)
  on conflict (student_id, score_date)
  do update set workout_done = excluded.workout_done,
                diet_done = excluded.diet_done,
                updated_at = now();
end $$;

-- Registro de carga ou de cardio (o histórico é só de acréscimo: só insert).
create or replace function public.score_from_load_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid;
begin
  select p.student_id into v_student
  from public.exercises e
  join public.workout_days d on d.id = e.workout_day_id
  join public.protocols p on p.id = d.protocol_id
  where e.id = new.exercise_id;
  if v_student is not null then
    perform public.recompute_daily_score(v_student, new.logged_at);
  end if;
  return null;
end $$;

-- Registro de refeição: marcar, trocar (fiz/não fiz) ou desfazer.
create or replace function public.score_from_meal_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid;
  v_meal uuid;
  v_date date;
begin
  if tg_op = 'DELETE' then
    v_meal := old.meal_id;
    v_date := old.log_date;
  else
    v_meal := new.meal_id;
    v_date := new.log_date;
  end if;
  -- Em exclusão em cascata (refeição ou protocolo apagados) a refeição já não existe: não
  -- recalcula, e o resultado do dia fica como estava.
  select p.student_id into v_student
  from public.meals m
  join public.protocols p on p.id = m.protocol_id
  where m.id = v_meal;
  if v_student is not null then
    perform public.recompute_daily_score(v_student, v_date);
  end if;
  return null;
end $$;

revoke execute on function
  public.recompute_daily_score(uuid, date),
  public.score_from_load_log(),
  public.score_from_meal_log()
  from public, anon, authenticated;

create trigger score_from_load_log after insert on public.exercise_load_logs
  for each row execute function public.score_from_load_log();
create trigger score_from_meal_log after insert or update or delete on public.meal_logs
  for each row execute function public.score_from_meal_log();

-- Brecha de datas: registro de carga só de hoje (current_date é UTC: folga de 1 dia).
drop policy if exists "load_logs_insert" on public.exercise_load_logs;
create policy "load_logs_insert" on public.exercise_load_logs for insert
  with check (
    created_by = (select auth.uid())
    and public.owns_exercise_as_student(exercise_id)
    and logged_at between current_date - 1 and current_date + 1
  );

-- Preenche o resultado diário a partir dos registros que já existem.
do $$
declare
  r record;
begin
  for r in
    select distinct student_id, d
    from (
      select p.student_id, l.logged_at as d
      from public.exercise_load_logs l
      join public.exercises e on e.id = l.exercise_id
      join public.workout_days wd on wd.id = e.workout_day_id
      join public.protocols p on p.id = wd.protocol_id
      union
      select p.student_id, l.log_date as d
      from public.meal_logs l
      join public.meals m on m.id = l.meal_id
      join public.protocols p on p.id = m.protocol_id
    ) x
    where student_id is not null
  loop
    perform public.recompute_daily_score(r.student_id, r.d);
  end loop;
end $$;
