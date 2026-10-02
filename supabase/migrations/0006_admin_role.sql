-- Adiciona o papel 'admin' ao enum de roles.
-- IMPORTANTE: rode este arquivo SOZINHO (em uma execução própria no SQL
-- Editor). O Postgres não permite usar um valor novo de enum na mesma
-- transação/execução em que ele foi criado — rode 0007 só depois que este
-- arquivo terminar.
alter type public.user_role add value 'admin';
