-- Reverte a 0031_team_ranking.sql.
-- ATENÇÃO: apaga a configuração do ranking dos profissionais e o aceite dos alunos. Rode DEPOIS de
-- voltar o deploy do app para uma versão que não use o ranking (a aba Ranking e as funções).

drop function if exists public.team_leaderboard(date);
drop function if exists public.set_ranking_participation(boolean);
drop function if exists public.my_ranking_state();

drop policy if exists "trainer_settings_select" on public.trainer_settings;
drop policy if exists "trainer_settings_insert" on public.trainer_settings;
drop policy if exists "trainer_settings_update" on public.trainer_settings;
drop table if exists public.trainer_settings;
drop function if exists public.is_trainer_profile(uuid);

alter table public.students drop column if exists ranking_opt_in;
