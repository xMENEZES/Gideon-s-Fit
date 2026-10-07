-- Teste das cotas (0023). Tudo é desfeito: o bloco termina com um erro de propósito,
-- o que reverte qualquer linha de teste criada. Rode no SQL Editor (papel postgres).
-- O resultado aparece na mensagem de erro "TESTE CONCLUIDO (tudo revertido)".
-- Alunos (teto 200) não são exercitados aqui: exigiriam 200 contas de teste.

do $$
declare
  v_prot uuid;
  v_trainer uuid;
  v_type public.protocol_type;
  v_day uuid;
  v_meal uuid;
  v_opt uuid;
  v_n int;
  v_out text := '';
begin
  select id, created_by, type into v_prot, v_trainer, v_type
  from public.protocols where student_id is not null limit 1;
  if v_prot is null then raise exception 'sem protocolo para testar'; end if;

  insert into public.workout_days (protocol_id, name) values (v_prot, 'zz-teste') returning id into v_day;
  insert into public.meals (protocol_id, name) values (v_prot, 'zz-teste') returning id into v_meal;
  insert into public.meal_options (meal_id, label) values (v_meal, '') returning id into v_opt;

  -- dias de treino (teto 14)
  select count(*) into v_n from public.workout_days where protocol_id = v_prot;
  begin
    for i in 1..30 loop
      insert into public.workout_days (protocol_id, name) values (v_prot, 'zz');
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'dias: SEM BLOQUEIO | ';
  exception when others then
    v_out := v_out || format('dias: bloqueou ao tentar o %s (%s) | ', v_n + 1, sqlerrm);
  end;

  -- exercicios por dia (teto 40)
  select count(*) into v_n from public.exercises where workout_day_id = v_day;
  begin
    for i in 1..60 loop
      insert into public.exercises (workout_day_id, name, sets, reps) values (v_day, 'zz', 3, '10');
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'exercicios: SEM BLOQUEIO | ';
  exception when others then
    v_out := v_out || format('exercicios: bloqueou ao tentar o %s (%s) | ', v_n + 1, sqlerrm);
  end;

  -- refeicoes por protocolo (teto 15)
  select count(*) into v_n from public.meals where protocol_id = v_prot;
  begin
    for i in 1..30 loop
      insert into public.meals (protocol_id, name) values (v_prot, 'zz');
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'refeicoes: SEM BLOQUEIO | ';
  exception when others then
    v_out := v_out || format('refeicoes: bloqueou ao tentar a %s (%s) | ', v_n + 1, sqlerrm);
  end;

  -- itens por opcao (teto 40)
  select count(*) into v_n from public.meal_items where meal_option_id = v_opt;
  begin
    for i in 1..60 loop
      insert into public.meal_items (meal_option_id, food_name, quantity, unit) values (v_opt, 'zz', 1, 'g');
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'itens: SEM BLOQUEIO | ';
  exception when others then
    v_out := v_out || format('itens: bloqueou ao tentar o %s (%s) | ', v_n + 1, sqlerrm);
  end;

  -- modelos por profissional (teto 100)
  select count(*) into v_n from public.protocols where owner_trainer_id = v_trainer;
  begin
    for i in 1..120 loop
      insert into public.protocols
        (owner_trainer_id, template_name, type, start_date, end_date, is_active, created_by)
      values (v_trainer, 'zz-modelo', v_type, current_date, current_date, false, v_trainer);
      v_n := v_n + 1;
    end loop;
    v_out := v_out || 'modelos: SEM BLOQUEIO | ';
  exception when others then
    v_out := v_out || format('modelos: bloqueou ao tentar o %s (%s) | ', v_n + 1, sqlerrm);
  end;

  -- erro final de propósito: reverte tudo que foi criado acima
  raise exception 'TESTE CONCLUIDO (tudo revertido) -> %', v_out;
end $$;
