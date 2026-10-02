-- Papel do "Usuário Padrão": pessoa que treina por conta própria (com ou sem
-- profissional). IMPORTANTE: rode este arquivo SOZINHO, em uma execução própria
-- no SQL Editor. O Postgres não permite usar um valor novo de enum na mesma
-- execução em que ele foi criado — rode a 0015 só depois que este terminar.
alter type public.user_role add value if not exists 'standard';
