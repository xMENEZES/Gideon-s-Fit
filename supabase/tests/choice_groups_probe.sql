-- Teste da migração 0026 (grupos de alternativas). Rode DEPOIS da 0026, no SQL Editor
-- (papel postgres). Tudo é desfeito: o bloco termina com um erro de propósito, que reverte
-- qualquer linha criada. O resultado aparece na mensagem "TESTE CONCLUIDO (tudo revertido)".
-- Cada item deve dizer "ok".

do $$
declare
  v_prot uuid;
  v_student uuid;
  v_trainer uuid;
  v_meal uuid;
  v_opt uuid;
  v_tpl uuid;
  v_new uuid;
  v_n int;
  v_src int;
  v_out text := '';
begin
  select p.id, p.student_id, s.trainer_id into v_prot, v_student, v_trainer
  from public.protocols p
  join public.students s on s.id = p.student_id
  where p.type = 'diet' and p.is_active
  limit 1;
  if v_prot is null then raise exception 'sem protocolo alimentar ativo para testar'; end if;

  -- Faz auth.uid() valer o profissional dono do aluno (as funções de cópia gravam created_by).
  perform set_config('request.jwt.claim.sub', v_trainer::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_trainer)::text, true);

  insert into public.meals (protocol_id, name) values (v_prot, 'zz-grupos-teste') returning id into v_meal;
  insert into public.meal_options (meal_id, label) values (v_meal, '') returning id into v_opt;

  -- Itens antigos (sem grupo) continuam válidos.
  insert into public.meal_items (meal_option_id, food_name, quantity, unit) values (v_opt, 'zz-sem-grupo', 1, 'g');
  select count(*) into v_n from public.meal_items where meal_option_id = v_opt and choice_group is null;
  v_out := v_out || format('item sem grupo: %s | ', case when v_n = 1 then 'ok' else 'FALHOU' end);

  -- Itens com grupo.
  insert into public.meal_items (meal_option_id, food_name, quantity, unit, choice_group)
    values (v_opt, 'zz-frango', 200, 'g', 'Proteína'), (v_opt, 'zz-peixe', 220, 'g', 'Proteína');
  select count(*) into v_n from public.meal_items where meal_option_id = v_opt and choice_group = 'Proteína';
  v_out := v_out || format('itens com grupo: %s | ', case when v_n = 2 then 'ok' else 'FALHOU' end);

  -- Grupo vazio ou longo demais é recusado.
  begin
    insert into public.meal_items (meal_option_id, food_name, quantity, unit, choice_group)
      values (v_opt, 'zz-vazio', 1, 'g', '   ');
    v_out := v_out || 'grupo em branco: FALHOU (aceitou) | ';
  exception when check_violation then
    v_out := v_out || 'grupo em branco recusado: ok | ';
  end;
  begin
    insert into public.meal_items (meal_option_id, food_name, quantity, unit, choice_group)
      values (v_opt, 'zz-longo', 1, 'g', repeat('a', 41));
    v_out := v_out || 'grupo longo: FALHOU (aceitou) | ';
  exception when check_violation then
    v_out := v_out || 'grupo longo recusado: ok | ';
  end;

  -- Cópia 1: copy_protocol_content (modelos e "aplicar a alunos")
  insert into public.protocols (owner_trainer_id, template_name, type, start_date, end_date, is_active, created_by)
    values (v_trainer, 'zz-modelo-grupos', 'diet', current_date, current_date, false, v_trainer)
    returning id into v_tpl;
  perform public.copy_protocol_content(v_prot, v_tpl);

  select count(*) into v_src from public.meal_items i
    join public.meal_options o on o.id = i.meal_option_id
    join public.meals m on m.id = o.meal_id where m.protocol_id = v_prot;
  select count(*) into v_n from public.meal_items i
    join public.meal_options o on o.id = i.meal_option_id
    join public.meals m on m.id = o.meal_id where m.protocol_id = v_tpl;
  v_out := v_out || format('copy_protocol_content copia todos os itens (%s de %s): %s | ',
    v_n, v_src, case when v_n = v_src then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.meal_items i
    join public.meal_options o on o.id = i.meal_option_id
    join public.meals m on m.id = o.meal_id
    where m.protocol_id = v_tpl and m.name = 'zz-grupos-teste' and i.choice_group = 'Proteína';
  v_out := v_out || format('copy_protocol_content leva o grupo: %s | ', case when v_n = 2 then 'ok' else 'FALHOU (' || v_n || ')' end);

  -- Cópia 2: start_new_protocol duplicando (novo ciclo)
  v_new := public.start_new_protocol(v_student, 'diet', current_date + 30, true);
  select count(*) into v_n from public.meal_items i
    join public.meal_options o on o.id = i.meal_option_id
    join public.meals m on m.id = o.meal_id where m.protocol_id = v_new;
  v_out := v_out || format('start_new_protocol copia todos os itens (%s de %s): %s | ',
    v_n, v_src, case when v_n = v_src then 'ok' else 'FALHOU' end);

  select count(*) into v_n from public.meal_items i
    join public.meal_options o on o.id = i.meal_option_id
    join public.meals m on m.id = o.meal_id
    where m.protocol_id = v_new and m.name = 'zz-grupos-teste' and i.choice_group = 'Proteína';
  v_out := v_out || format('start_new_protocol leva o grupo: %s | ', case when v_n = 2 then 'ok' else 'FALHOU (' || v_n || ')' end);

  -- Erro final de proposito: reverte tudo que foi criado acima.
  raise exception 'TESTE CONCLUIDO (tudo revertido) -> %', v_out;
end $$;
