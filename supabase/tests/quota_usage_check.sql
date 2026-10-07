-- Uso atual versus os tetos da migração 0023. Somente leitura.
-- Rode ANTES da 0023: se "maior_uso" passar do teto, os dados existentes continuam
-- funcionando (os gatilhos só barram novos itens), mas essa pessoa não conseguirá
-- adicionar mais nada naquele nível até ficar abaixo do teto.
select item, coalesce(max(c), 0) as maior_uso, max(teto) as teto
from (
  select 'alunos por profissional' as item, count(*) as c, 200 as teto
    from public.students where trainer_id <> profile_id group by trainer_id
  union all
  select 'modelos por profissional', count(*), 100
    from public.protocols where owner_trainer_id is not null group by owner_trainer_id
  union all
  select 'dias de treino por protocolo', count(*), 14
    from public.workout_days group by protocol_id
  union all
  select 'exercicios por dia', count(*), 40
    from public.exercises group by workout_day_id
  union all
  select 'refeicoes por protocolo', count(*), 15
    from public.meals group by protocol_id
  union all
  select 'itens por opcao de refeicao', count(*), 40
    from public.meal_items group by meal_option_id
) t
group by item
order by item;
