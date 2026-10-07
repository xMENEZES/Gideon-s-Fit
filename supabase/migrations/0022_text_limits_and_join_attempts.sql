-- Prioridade 2 da auditoria de segurança (07/10/2026).

-- 1) Limites de tamanho nos textos (F-08) e link de vídeo só http/https (F-07).
-- "not valid": a regra vale para tudo que for criado ou alterado daqui em diante, sem
-- reprovar linhas antigas (que podem ter textos maiores). Depois, se quiser conferir o
-- que já existe, rode: alter table <tabela> validate constraint <nome>;
alter table public.exercises
  add constraint exercises_name_len check (char_length(name) <= 120) not valid,
  add constraint exercises_reps_len check (char_length(reps) <= 40) not valid,
  add constraint exercises_notes_len check (notes is null or char_length(notes) <= 1000) not valid,
  add constraint exercises_video_url_safe check (
    video_url is null or (char_length(video_url) <= 2048 and video_url ~* '^https?://')
  ) not valid;

alter table public.workout_days
  add constraint workout_days_name_len check (char_length(name) <= 80) not valid;

alter table public.meals
  add constraint meals_name_len check (char_length(name) <= 120) not valid;

alter table public.meal_options
  add constraint meal_options_label_len check (char_length(label) <= 80) not valid;

alter table public.meal_items
  add constraint meal_items_food_name_len check (char_length(food_name) <= 120) not valid,
  add constraint meal_items_unit_len check (char_length(unit) <= 30) not valid,
  add constraint meal_items_notes_len check (notes is null or char_length(notes) <= 500) not valid;

alter table public.protocols
  add constraint protocols_notes_len check (notes is null or char_length(notes) <= 2000) not valid,
  add constraint protocols_template_name_len check (
    template_name is null or char_length(template_name) <= 80
  ) not valid;

alter table public.students
  add constraint students_nickname_len check (nickname is null or char_length(nickname) <= 60) not valid,
  add constraint students_notes_len check (notes is null or char_length(notes) <= 1000) not valid;

alter table public.exercise_load_logs
  add constraint exercise_load_logs_notes_len check (notes is null or char_length(notes) <= 500) not valid;

alter table public.profiles
  add constraint profiles_full_name_len check (char_length(full_name) <= 120) not valid;

-- 2) Limite de tentativas do código de time, atômico (F-11).
-- Antes o app contava as tentativas e depois registrava a nova, em duas etapas: pedidos
-- simultâneos podiam passar do limite. Agora é uma operação só, com trava por usuário.
-- Só o servidor (service role) chama esta função.
create or replace function public.register_join_attempt(
  p_user_id uuid,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended('join_attempt:' || p_user_id::text, 0));

  select count(*) into v_count
  from public.team_join_attempts
  where user_id = p_user_id
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.team_join_attempts (user_id) values (p_user_id);
  return true;
end;
$$;

revoke execute on function public.register_join_attempt(uuid, int, int) from public, anon, authenticated;
grant execute on function public.register_join_attempt(uuid, int, int) to service_role;
