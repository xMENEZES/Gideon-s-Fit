-- Reverte a 0035_login_throttle.sql.
-- ATENÇÃO: o app desta versão chama essas funções no login. Volte o deploy do app para uma versão
-- anterior ANTES de rodar este arquivo. Apaga os contadores de tentativas (ninguém fica bloqueado).

drop function if exists public.login_throttle_clear(text[]);
drop function if exists public.login_throttle_fail(text, int, int, jsonb);
drop function if exists public.login_throttle_begin(text[], jsonb);
drop function if exists public.login_throttle_lock_seconds(int, int, jsonb);
drop table if exists public.login_throttle;
