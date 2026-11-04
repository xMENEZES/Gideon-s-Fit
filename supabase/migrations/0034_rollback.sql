-- Reverte a 0034_push_notifications.sql.
-- ATENÇÃO: apaga as inscrições dos aparelhos (cada pessoa precisa ativar o aviso de novo) e os
-- avisos agendados. Rode DEPOIS de voltar o deploy do app para uma versão que não use push.

drop trigger if exists quota_rest_alarms on public.rest_alarms;
drop function if exists public.quota_rest_alarms();
drop table if exists public.rest_alarms;

drop function if exists public.register_push_subscription(text, text, text, text);
drop table if exists public.push_subscriptions;
