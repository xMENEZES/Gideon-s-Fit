-- Catálogo de exercícios: sugestões de nome ao montar um treino de musculação.
--
-- Cada linha é um nome de exercício com o grupo muscular. Duas origens:
--   * owner_id nulo = nome do sistema (esta migração carrega a lista; nenhum papel do cliente grava);
--   * owner_id preenchido = nome guardado pela própria pessoa (profissional ou Usuário Padrão,
--     que são quem monta plano), visível só para ela.
-- O nome do exercício no treino continua texto livre: o catálogo só sugere, nunca obriga, e a
-- tabela exercises não muda. Não há edição de nome: apaga e cria de novo.
-- Só acrescenta (tabela nova). Reversão: 0033_rollback.sql

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  muscle_group text not null check (muscle_group in (
    'peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco',
    'abdomen', 'gluteos', 'coxas', 'panturrilha', 'corpo_todo'
  )),
  created_at timestamptz not null default now()
);

-- Sem nome repetido por dono (maiúsculas e minúsculas não contam; o nulo do sistema vale um dono).
create unique index uq_exercise_catalog_owner_name
  on public.exercise_catalog (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)));
create index idx_exercise_catalog_owner on public.exercise_catalog (owner_id);

alter table public.exercise_catalog enable row level security;
revoke all on public.exercise_catalog from anon;
revoke all on public.exercise_catalog from authenticated;
grant select, insert, delete on public.exercise_catalog to authenticated;

-- Quem monta plano: profissional e Usuário Padrão (definer, como em 0021, para não reavaliar RLS).
create or replace function public.can_edit_plans()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('trainer', 'standard')
  )
$$;

revoke execute on function public.can_edit_plans() from public, anon;
grant execute on function public.can_edit_plans() to authenticated;

create policy "exercise_catalog_select"
  on public.exercise_catalog for select to authenticated
  using (owner_id is null or owner_id = auth.uid());

create policy "exercise_catalog_insert"
  on public.exercise_catalog for insert to authenticated
  with check (owner_id = auth.uid() and public.can_edit_plans());

create policy "exercise_catalog_delete"
  on public.exercise_catalog for delete to authenticated
  using (owner_id = auth.uid());

-- Cota: até 200 nomes próprios por conta (mensagem traduzida em src/lib/quota.ts; manter o número igual).
create or replace function public.quota_exercise_catalog() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is null then return new; end if;
  if (select count(*) from public.exercise_catalog where owner_id = new.owner_id) >= 200 then
    raise exception 'quota_exceeded:exercise_catalog';
  end if;
  return new;
end $$;

revoke execute on function public.quota_exercise_catalog() from public, anon, authenticated;

create trigger quota_exercise_catalog before insert on public.exercise_catalog
  for each row execute function public.quota_exercise_catalog();

-- Lista do sistema (152 nomes de musculação; o cardio já tem a lista fixa do app).
insert into public.exercise_catalog (name, muscle_group) values
  ('Supino reto com barra', 'peito'),
  ('Supino reto com halteres', 'peito'),
  ('Supino inclinado com barra', 'peito'),
  ('Supino inclinado com halteres', 'peito'),
  ('Supino declinado com barra', 'peito'),
  ('Supino declinado com halteres', 'peito'),
  ('Supino reto na máquina', 'peito'),
  ('Supino inclinado na máquina', 'peito'),
  ('Crucifixo reto com halteres', 'peito'),
  ('Crucifixo inclinado com halteres', 'peito'),
  ('Crucifixo na máquina (peck deck)', 'peito'),
  ('Crossover na polia alta', 'peito'),
  ('Crossover na polia baixa', 'peito'),
  ('Crucifixo na polia (cross over)', 'peito'),
  ('Flexão de braços', 'peito'),
  ('Flexão de braços com joelhos apoiados', 'peito'),
  ('Flexão de braços inclinada', 'peito'),
  ('Pullover com halter', 'peito'),
  ('Puxada frontal na polia', 'costas'),
  ('Puxada frontal aberta', 'costas'),
  ('Puxada com triângulo', 'costas'),
  ('Puxada supinada', 'costas'),
  ('Puxada com pegada neutra', 'costas'),
  ('Barra fixa', 'costas'),
  ('Barra fixa supinada', 'costas'),
  ('Remada curvada com barra', 'costas'),
  ('Remada curvada com halteres', 'costas'),
  ('Remada unilateral com halter (serrote)', 'costas'),
  ('Remada baixa na polia', 'costas'),
  ('Remada baixa com triângulo', 'costas'),
  ('Remada cavalinho', 'costas'),
  ('Remada na máquina', 'costas'),
  ('Remada unilateral na polia', 'costas'),
  ('Remada invertida', 'costas'),
  ('Pulldown com braços estendidos', 'costas'),
  ('Levantamento terra', 'costas'),
  ('Extensão lombar', 'costas'),
  ('Hiperextensão', 'costas'),
  ('Encolhimento com halteres', 'costas'),
  ('Encolhimento com barra', 'costas'),
  ('Desenvolvimento com barra', 'ombros'),
  ('Desenvolvimento com halteres', 'ombros'),
  ('Desenvolvimento com halteres sentado', 'ombros'),
  ('Desenvolvimento na máquina', 'ombros'),
  ('Desenvolvimento Arnold', 'ombros'),
  ('Elevação lateral com halteres', 'ombros'),
  ('Elevação lateral na polia', 'ombros'),
  ('Elevação lateral na máquina', 'ombros'),
  ('Elevação frontal com halteres', 'ombros'),
  ('Elevação frontal com barra', 'ombros'),
  ('Elevação frontal na polia', 'ombros'),
  ('Crucifixo inverso com halteres', 'ombros'),
  ('Crucifixo inverso na máquina', 'ombros'),
  ('Elevação posterior na polia', 'ombros'),
  ('Remada alta com barra', 'ombros'),
  ('Face pull', 'ombros'),
  ('Rotação externa com halter', 'ombros'),
  ('Rosca direta com barra', 'biceps'),
  ('Rosca direta com barra W', 'biceps'),
  ('Rosca alternada com halteres', 'biceps'),
  ('Rosca simultânea com halteres', 'biceps'),
  ('Rosca martelo com halteres', 'biceps'),
  ('Rosca martelo na corda', 'biceps'),
  ('Rosca concentrada', 'biceps'),
  ('Rosca Scott com barra', 'biceps'),
  ('Rosca Scott com halteres', 'biceps'),
  ('Rosca Scott na máquina', 'biceps'),
  ('Rosca na polia baixa', 'biceps'),
  ('Rosca inclinada com halteres', 'biceps'),
  ('Rosca 21', 'biceps'),
  ('Tríceps na polia com barra', 'triceps'),
  ('Tríceps na polia com corda', 'triceps'),
  ('Tríceps pulley invertido', 'triceps'),
  ('Tríceps testa com barra', 'triceps'),
  ('Tríceps testa com halteres', 'triceps'),
  ('Tríceps francês com halter', 'triceps'),
  ('Tríceps francês na polia', 'triceps'),
  ('Tríceps no banco', 'triceps'),
  ('Mergulho nas paralelas', 'triceps'),
  ('Tríceps coice com halter', 'triceps'),
  ('Tríceps na máquina', 'triceps'),
  ('Tríceps unilateral na polia', 'triceps'),
  ('Supino fechado', 'triceps'),
  ('Rosca de punho com barra', 'antebraco'),
  ('Rosca de punho com halteres', 'antebraco'),
  ('Rosca de punho inversa', 'antebraco'),
  ('Rosca inversa com barra', 'antebraco'),
  ('Abdominal supra', 'abdomen'),
  ('Abdominal infra', 'abdomen'),
  ('Abdominal remador', 'abdomen'),
  ('Abdominal oblíquo', 'abdomen'),
  ('Abdominal canivete', 'abdomen'),
  ('Abdominal na máquina', 'abdomen'),
  ('Abdominal na polia', 'abdomen'),
  ('Prancha', 'abdomen'),
  ('Prancha lateral', 'abdomen'),
  ('Elevação de pernas na barra fixa', 'abdomen'),
  ('Elevação de pernas deitado', 'abdomen'),
  ('Elevação de joelhos na paralela', 'abdomen'),
  ('Roda abdominal', 'abdomen'),
  ('Abdominal bicicleta', 'abdomen'),
  ('Rotação russa', 'abdomen'),
  ('Elevação pélvica com barra', 'gluteos'),
  ('Elevação pélvica com halter', 'gluteos'),
  ('Elevação pélvica na máquina', 'gluteos'),
  ('Ponte de glúteos', 'gluteos'),
  ('Glúteo na polia (coice)', 'gluteos'),
  ('Coice com caneleira', 'gluteos'),
  ('Glúteo na máquina', 'gluteos'),
  ('Cadeira abdutora', 'gluteos'),
  ('Abdução de quadril na polia', 'gluteos'),
  ('Agachamento sumô', 'gluteos'),
  ('Extensão de quadril', 'gluteos'),
  ('Agachamento livre com barra', 'coxas'),
  ('Agachamento no Smith', 'coxas'),
  ('Agachamento frontal', 'coxas'),
  ('Agachamento com halter (goblet)', 'coxas'),
  ('Agachamento búlgaro', 'coxas'),
  ('Agachamento hack', 'coxas'),
  ('Agachamento na máquina', 'coxas'),
  ('Agachamento na parede', 'coxas'),
  ('Leg press 45 graus', 'coxas'),
  ('Leg press horizontal', 'coxas'),
  ('Cadeira extensora', 'coxas'),
  ('Mesa flexora', 'coxas'),
  ('Cadeira flexora', 'coxas'),
  ('Flexora em pé', 'coxas'),
  ('Stiff com barra', 'coxas'),
  ('Stiff com halteres', 'coxas'),
  ('Levantamento terra romeno', 'coxas'),
  ('Avanço com halteres', 'coxas'),
  ('Avanço com barra', 'coxas'),
  ('Passada com halteres', 'coxas'),
  ('Afundo no Smith', 'coxas'),
  ('Subida no banco (step-up) com halteres', 'coxas'),
  ('Cadeira adutora', 'coxas'),
  ('Panturrilha em pé na máquina', 'panturrilha'),
  ('Panturrilha sentado', 'panturrilha'),
  ('Panturrilha no leg press', 'panturrilha'),
  ('Panturrilha no Smith', 'panturrilha'),
  ('Panturrilha em pé com halter', 'panturrilha'),
  ('Burpee', 'corpo_todo'),
  ('Agachamento com salto', 'corpo_todo'),
  ('Kettlebell swing', 'corpo_todo'),
  ('Thruster com halteres', 'corpo_todo'),
  ('Clean com barra', 'corpo_todo'),
  ('Arranco (snatch)', 'corpo_todo'),
  ('Salto no caixote', 'corpo_todo'),
  ('Polichinelo', 'corpo_todo'),
  ('Corda naval', 'corpo_todo'),
  ('Caminhada do fazendeiro', 'corpo_todo'),
  ('Levantamento turco (get-up)', 'corpo_todo');
