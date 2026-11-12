-- Reversão da 0038 (gerador de treino: descanso opcional e função de gravação).
-- ATENÇÃO: os exercícios sem descanso (os do treino gerado e os de cardio criados depois da 0038)
-- passam a ter 60 segundos, que era o padrão anterior. Rode só se o código que usa a função
-- (tela "Gerar treino") e o descanso opcional já saiu do ar.

drop function if exists public.create_generated_workout(uuid, date, date, text, jsonb);

update public.exercises set rest_seconds = 60 where rest_seconds is null;
alter table public.exercises alter column rest_seconds set default 60;
alter table public.exercises alter column rest_seconds set not null;
