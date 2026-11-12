-- Reversão da 0037 (dados corporais). ATENÇÃO: apaga os dados que as pessoas já informaram.
-- Rode só se o código que usa a tabela (Perfil > Meus Dados) já foi retirado do ar.

drop table if exists public.body_data;
drop function if exists public.body_data_guard();
