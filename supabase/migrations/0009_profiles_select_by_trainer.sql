-- Sem essa policy, o join trainer -> students -> profiles (usado pra exibir o
-- nome real do aluno nas telas do profissional) vem vazio: profiles só tinha
-- a policy "profiles_select_own", que barra o trainer de ler o profile de
-- outra pessoa mesmo sendo o profile do próprio aluno dele.
create policy "profiles_select_by_trainer"
  on public.profiles for select
  using (
    exists (
      select 1 from public.students
      where students.profile_id = profiles.id
        and students.trainer_id = auth.uid()
    )
  );
