-- Backup das regras de acesso (RLS) ATUAIS, como comandos prontos para recriá-las.
--
-- Rode ANTES da migração 0021. O resultado é uma única célula de texto: copie o conteúdo
-- dela e salve num arquivo (por exemplo, "backup_policies_antes_da_0021.sql"). Se algo der
-- errado, o arquivo 0021_rollback.sql já reverte a migração; este backup é a segunda proteção,
-- tirada direto do banco, exatamente como as regras estão hoje.

select string_agg(
  format(
    'drop policy if exists %I on %I.%I;' || E'\n' ||
    'create policy %I on %I.%I as %s for %s to %s%s%s;',
    policyname, schemaname, tablename,
    policyname, schemaname, tablename,
    lower(permissive), lower(cmd), array_to_string(roles, ', '),
    case when qual is not null then E'\n  using (' || qual || ')' else '' end,
    case when with_check is not null then E'\n  with check (' || with_check || ')' else '' end
  ),
  E'\n\n' order by tablename, policyname
) as backup_das_politicas
from pg_policies
where schemaname = 'public'
  and tablename in (
    'protocols', 'workout_days', 'exercises', 'exercise_load_logs',
    'meals', 'meal_options', 'meal_items', 'meal_logs'
  );
