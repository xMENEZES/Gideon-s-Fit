-- Rode SOMENTE depois que 0006_admin_role.sql já tiver sido executado com
-- sucesso em uma execução separada.

-- Promove a conta indicada a admin. Ela já existe como 'trainer' (cadastro
-- público antigo); a partir de agora, apenas o admin cria contas de
-- profissional (via convite, no painel /admin).
update public.profiles
  set role = 'admin'
  where email = 'gabriel97menezes@gmail.com';
