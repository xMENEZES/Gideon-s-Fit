-- Teste da migração 0025 (mensagens de incentivo). Tudo é desfeito: o bloco termina com um
-- erro de propósito, o que reverte qualquer linha de teste criada. Rode no SQL Editor
-- (papel postgres). O resultado aparece na mensagem de erro "TESTE CONCLUIDO (tudo revertido)".
-- As políticas de leitura por papel são conferidas na tela (profissional, aluno, padrão).

do $$
declare
  v_trainer uuid;
  v_n int;
  v_out text := '';
begin
  select id into v_trainer from public.profiles where role = 'trainer' limit 1;
  if v_trainer is null then raise exception 'sem profissional para testar'; end if;

  -- 1) as 4 mensagens do sistema existem
  select count(*) into v_n from public.incentive_messages where owner_id is null;
  v_out := v_out || format('mensagens do sistema: %s (esperado 4) %s; ', v_n, case when v_n = 4 then 'ok' else 'FALHOU' end);

  -- 2) texto curto demais é recusado
  begin
    insert into public.incentive_messages (owner_id, event, body) values (v_trainer, 'workout', 'ok');
    v_out := v_out || 'texto curto: FALHOU (aceitou); ';
  exception when check_violation then
    v_out := v_out || 'texto curto: ok; ';
  end;

  -- 3) texto longo demais é recusado
  begin
    insert into public.incentive_messages (owner_id, event, body) values (v_trainer, 'workout', repeat('a', 141));
    v_out := v_out || 'texto longo: FALHOU (aceitou); ';
  exception when check_violation then
    v_out := v_out || 'texto longo: ok; ';
  end;

  -- 4) evento inválido é recusado
  begin
    insert into public.incentive_messages (owner_id, event, body) values (v_trainer, 'xyz', 'mensagem valida');
    v_out := v_out || 'evento invalido: FALHOU (aceitou); ';
  exception when check_violation then
    v_out := v_out || 'evento invalido: ok; ';
  end;

  -- 5) cota: 10 por evento, a 11ª é barrada
  -- (o contador fica numa variável porque o bloco com erro desfaz as linhas inseridas nele)
  v_n := 0;
  begin
    for i in 1..11 loop
      insert into public.incentive_messages (owner_id, event, body) values (v_trainer, 'diet', 'mensagem de teste ' || i);
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'cota: FALHOU (passou de 10); ';
  exception when others then
    if sqlerrm like 'quota_exceeded:incentive_messages%' then
      v_out := v_out || format('cota: %s', case when v_n = 10 then format('ok (parou em %s)', v_n) else format('FALHOU (parou em %s)', v_n) end) || '; ';
    else
      v_out := v_out || 'cota: erro inesperado ' || sqlerrm || '; ';
    end if;
  end;

  raise exception 'TESTE CONCLUIDO (tudo revertido): %', v_out;
end $$;
