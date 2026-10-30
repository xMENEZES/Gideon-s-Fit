-- Gamificação, etapa 3: ranking mensal do time.
--
-- Regras (combinadas com o dono do app):
-- - O profissional liga o ranking do time (desligado por padrão).
-- - O aluno do time só entra se aceitar participar, e quem não participa NÃO vê o ranking.
-- - Quem participa vê só posição, nome de exibição (apelido ou primeiro nome) e pontos do mês.
-- - Pontos do mês de Brasília: 1 por dia de treino completo e 1 por dia de dieta completa
--   (daily_scores, que já existe, então o histórico do mês já conta). Máximo 2 por dia.
-- - Usuário Padrão não tem time, então nada muda para ele.
--
-- Como fica protegido:
-- - Nenhum aluno lê a linha de outro aluno: o ranking só sai por team_leaderboard(), função
--   security definer que devolve nome de exibição e pontos, e só responde a quem é aluno do
--   time, está participando e cujo profissional ligou o ranking. Fora disso devolve vazio.
-- - O aluno altera só a própria participação, por set_ranking_participation().
-- - A configuração do profissional (trainer_settings) só é lida e gravada por ele mesmo; o
--   aluno descobre se o ranking está ligado por my_ranking_state().
-- - Sair do time apaga a linha do aluno (cascata) e entrar num time cria uma linha nova, então
--   a participação nunca passa de um time para outro: o novo time recomeça sem aceite.
-- Reversão: 0031_rollback.sql

-- Aceite do aluno em participar do ranking do time.
alter table public.students
  add column ranking_opt_in boolean not null default false;

-- Configuração do profissional.
create table public.trainer_settings (
  trainer_id uuid primary key references public.profiles(id) on delete cascade,
  ranking_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.trainer_settings enable row level security;
revoke all on public.trainer_settings from anon, authenticated;
grant select, insert, update on public.trainer_settings to authenticated;

create or replace function public.is_trainer_profile(p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = p_uid and p.role = 'trainer')
$$;
revoke execute on function public.is_trainer_profile(uuid) from public, anon;
grant execute on function public.is_trainer_profile(uuid) to authenticated;

create policy "trainer_settings_select" on public.trainer_settings for select to authenticated
  using (trainer_id = (select auth.uid()));
create policy "trainer_settings_insert" on public.trainer_settings for insert to authenticated
  with check (trainer_id = (select auth.uid()) and public.is_trainer_profile((select auth.uid())));
create policy "trainer_settings_update" on public.trainer_settings for update to authenticated
  using (trainer_id = (select auth.uid()))
  with check (trainer_id = (select auth.uid()) and public.is_trainer_profile((select auth.uid())));

-- Situação do ranking para o aluno do time que chama: se o profissional ligou, se ele já aceitou
-- e quantos alunos participam. Sem linha = quem chama não é aluno de um time.
create or replace function public.my_ranking_state()
returns table (enabled boolean, opted_in boolean, participants int)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me public.students%rowtype;
  v_enabled boolean;
begin
  select * into v_me from public.students
  where profile_id = auth.uid() and trainer_id <> profile_id
  limit 1;
  if not found then return; end if;

  select coalesce(ts.ranking_enabled, false) into v_enabled
  from (select 1) x
  left join public.trainer_settings ts on ts.trainer_id = v_me.trainer_id;

  return query select
    v_enabled,
    v_me.ranking_opt_in,
    case when v_enabled then (
      select count(*)::int from public.students s
      where s.trainer_id = v_me.trainer_id and s.profile_id <> s.trainer_id and s.ranking_opt_in
    ) else 0 end;
end $$;
revoke execute on function public.my_ranking_state() from public, anon;
grant execute on function public.my_ranking_state() to authenticated;

-- O aluno do time aceita ou deixa de participar. Aceitar só vale com o ranking ligado.
create or replace function public.set_ranking_participation(p_join boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_me public.students%rowtype;
begin
  select * into v_me from public.students
  where profile_id = auth.uid() and trainer_id <> profile_id
  limit 1;
  if not found then return false; end if;

  if p_join and not coalesce(
    (select ts.ranking_enabled from public.trainer_settings ts where ts.trainer_id = v_me.trainer_id), false
  ) then
    return false;
  end if;

  update public.students set ranking_opt_in = p_join where id = v_me.id;
  return true;
end $$;
revoke execute on function public.set_ranking_participation(boolean) from public, anon;
grant execute on function public.set_ranking_participation(boolean) to authenticated;

-- Ranking do mês de p_month (qualquer dia do mês). Devolve só nome de exibição e pontos, já do
-- mais para o menos pontuado; as posições (e o empate) são calculadas no app.
create or replace function public.team_leaderboard(p_month date)
returns table (display_name text, total_points int, is_me boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_me public.students%rowtype;
  v_start date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month')::date;
begin
  select * into v_me from public.students
  where profile_id = auth.uid() and trainer_id <> profile_id
  limit 1;
  if not found or not v_me.ranking_opt_in then return; end if;
  if not coalesce(
    (select ts.ranking_enabled from public.trainer_settings ts where ts.trainer_id = v_me.trainer_id), false
  ) then
    return;
  end if;

  return query
    select
      coalesce(nullif(btrim(s.nickname), ''), nullif(split_part(btrim(pr.full_name), ' ', 1), ''), 'Aluno'),
      coalesce(sum(ds.workout_done::int + ds.diet_done::int), 0)::int,
      (s.profile_id = auth.uid())
    from public.students s
    join public.profiles pr on pr.id = s.profile_id
    left join public.daily_scores ds
      on ds.student_id = s.id and ds.score_date >= v_start and ds.score_date < v_end
    where s.trainer_id = v_me.trainer_id and s.profile_id <> s.trainer_id and s.ranking_opt_in
    group by s.id, s.nickname, pr.full_name, s.profile_id
    order by 2 desc, 1;
end $$;
revoke execute on function public.team_leaderboard(date) from public, anon;
grant execute on function public.team_leaderboard(date) to authenticated;
