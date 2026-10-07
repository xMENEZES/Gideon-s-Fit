-- Cotas por conta: tetos de quantidade para conter abuso e custo (o cadastro é aberto).
-- Os gatilhos só barram NOVOS itens; o que já existe acima do teto continua intacto.
-- Rodam como definer (sem reavaliar RLS), então a contagem é uma consulta indexada simples.
-- Sem trava de concorrência de propósito: em pedidos paralelos o teto pode estourar por
-- poucas unidades, o que não importa para este objetivo e evita deadlock/espera.
-- A mensagem 'quota_exceeded:<chave>' é traduzida em src/lib/quota.ts (manter os números
-- sincronizados com as mensagens de lá).
-- Reversão: 0023_rollback.sql

create or replace function public.quota_students() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Linha "solo" do Usuário Padrão (trainer_id = profile_id) não conta.
  if new.trainer_id = new.profile_id then return new; end if;
  if tg_op = 'UPDATE' and new.trainer_id is not distinct from old.trainer_id then return new; end if;
  if (select count(*) from public.students
        where trainer_id = new.trainer_id and profile_id <> trainer_id) >= 200 then
    raise exception 'quota_exceeded:students';
  end if;
  return new;
end $$;

create or replace function public.quota_templates() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_trainer_id is null then return new; end if;
  if (select count(*) from public.protocols where owner_trainer_id = new.owner_trainer_id) >= 100 then
    raise exception 'quota_exceeded:templates';
  end if;
  return new;
end $$;

create or replace function public.quota_workout_days() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.workout_days where protocol_id = new.protocol_id) >= 14 then
    raise exception 'quota_exceeded:workout_days';
  end if;
  return new;
end $$;

create or replace function public.quota_exercises() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.exercises where workout_day_id = new.workout_day_id) >= 40 then
    raise exception 'quota_exceeded:exercises';
  end if;
  return new;
end $$;

create or replace function public.quota_meals() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.meals where protocol_id = new.protocol_id) >= 15 then
    raise exception 'quota_exceeded:meals';
  end if;
  return new;
end $$;

create or replace function public.quota_meal_items() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.meal_items where meal_option_id = new.meal_option_id) >= 40 then
    raise exception 'quota_exceeded:meal_items';
  end if;
  return new;
end $$;

revoke execute on function
  public.quota_students(), public.quota_templates(), public.quota_workout_days(),
  public.quota_exercises(), public.quota_meals(), public.quota_meal_items()
  from public, anon, authenticated;

create trigger quota_students before insert or update of trainer_id on public.students
  for each row execute function public.quota_students();
create trigger quota_templates before insert on public.protocols
  for each row execute function public.quota_templates();
create trigger quota_workout_days before insert on public.workout_days
  for each row execute function public.quota_workout_days();
create trigger quota_exercises before insert on public.exercises
  for each row execute function public.quota_exercises();
create trigger quota_meals before insert on public.meals
  for each row execute function public.quota_meals();
create trigger quota_meal_items before insert on public.meal_items
  for each row execute function public.quota_meal_items();
