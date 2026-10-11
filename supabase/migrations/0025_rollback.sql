-- Reversão da 0025 (mensagens de incentivo). Apaga as mensagens (as do sistema e as dos
-- profissionais). O app volta a funcionar sem elas, mas o código novo espera a tabela:
-- reverta o deploy antes de rodar este arquivo.
drop table if exists public.incentive_messages;
drop function if exists public.quota_incentive_messages();
drop function if exists public.is_my_trainer(uuid);
drop function if exists public.is_trainer_role();
