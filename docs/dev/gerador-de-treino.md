# Gerador de treino (base)

## O que é

Gerador que monta o treino do Usuário Padrão a partir de respostas. O código fica em `src/lib/workout-generator/` (classificação dos exercícios, regras e motor); a tela é o assistente **Gerar meu treino** (`/meu-plano/treino/gerar`): cinco perguntas, uma prévia com "Gerar outra variação" e a gravação do treino. Só para **maiores de 18 anos**.

O gerador é **determinístico** (mesmas respostas e mesma semente, mesmo treino) e feito de **regras**, não de IA: é gratuito, instantâneo, testável e os dados de saúde não saem do sistema.

## O que a pessoa informa

| Resposta | Para que serve |
|---|---|
| Data de nascimento (vem de Meus Dados) | Idade: a partir de 50 e de 60 anos o treino é mais leve; só maiores de 18. |
| Altura e peso (de Meus Dados) | IMC, só por dentro: IMC 30 ou mais evita corrida e impacto. Não é mostrado. |
| Já treinou? Há quantos meses? | Nível: menos de 6 meses (ou nunca) é iniciante; 6 meses a menos de 2 anos, intermediário; 2 anos ou mais, avançado. |
| Dias por semana (2 a 6) | Divisão do treino e número de séries. |
| Objetivo | Ganhar massa, emagrecer ou condicionamento: faixas de repetições e cardio. |
| Onde treina | Academia completa; em casa com halteres (sem máquinas, barra nem banco); em casa sem equipamento. |
| Dor ou lesão | Joelho, ombro ou coluna: exercícios que sobrecarregam a articulação ficam de fora. |

## Regras

- **Descanso não faz parte do gerador**, por decisão do dono do produto: nenhum tempo é sugerido; cada pessoa ajusta pelo que sente. O treino gerado grava `rest_seconds` **nulo** (o descanso passou a ser opcional na migração `0038`, sem valor padrão): o cartão do exercício não mostra "Xs descanso" nem o cronômetro, e a pessoa pode definir um tempo ao editar o exercício. O treino traz um aviso sobre isso.
- **Divisão:** 2 dias, corpo inteiro A e B; 3 dias, corpo inteiro A, B e C (avançado: empurrar, puxar e pernas); 4 dias, superior e inferior duas vezes; 5 dias, superior, inferior e empurrar, puxar, pernas; 6 dias, empurrar, puxar e pernas duas vezes. O nível limita os dias de força (iniciante 4, intermediário 5, avançado 6); quem pede mais recebe o máximo e um aviso.
- **Séries:** exercício principal (agachar, empurrar, puxar, quadril) 3 séries (avançado 4); isolado 2 (iniciante) ou 3; abdômen 2 ou 3. Com só 2 dias por semana, o principal de quem não é iniciante ganha 1 série. A partir de 60 anos, no máximo 3.
- **Repetições:** ganhar massa, principal `10-12` (iniciante), `8-12` (intermediário), `6-10` (avançado), e isolado `12-15`, `10-15`, `8-12`. Emagrecer e condicionamento, principal `12-15` (avançado `10-15`) e isolado `12-15` (iniciante) ou `15-20`. Abdômen `15-20`; exercício por tempo (prancha): `20-30 s`, `30-45 s`, `45-60 s`. A partir de 50 anos a faixa não desce de 8; a partir de 60, `12-15`.
- **Cardio:** ganhar massa, nenhum; condicionamento, 2 sessões; emagrecer, 3, no fim de dias de força, de 15 a 30 minutos pelo nível (máximo de 25 a partir de 60 anos). Atividades: caminhada; esteira e bicicleta só na academia; corrida só de intermediário em diante, e fora com impacto a evitar ou dor no joelho. Não há elíptico. A faixa de batimentos usa a estimativa 220 menos a idade (iniciante 50 a 60%, emagrecer 60 a 70%, condicionamento 65 a 75%).
- **Escolha dos exercícios:** cada dia tem "vagas" (um de empurrar, um de puxar, um de pernas, abdômen...). O gerador escolhe, entre os exercícios permitidos para o local, o nível, a idade e as dores, os que ainda não apareceram na semana, preferindo os de nível mais alto permitido e, na academia, os que não são de peso do corpo; a semente decide entre equivalentes. A partir de 60 anos, nunca passa do nível intermediário. Exercícios de salto não entram nos dias de força. A elevação frontal nunca é escolhida (o ombro da frente já trabalha nos desenvolvimentos).
- **Carga:** o gerador não sugere quilos. O aviso orienta escolher um peso em que as últimas repetições fiquem difíceis, com boa execução.

## A tela

- **Quem vê:** só o Usuário Padrão, por "Gerar meu treino" na tela de montagem do treino (`/meu-plano/treino/editar`), no cabeçalho do protocolo e quando ainda não há treino.
- **Antes das perguntas:** precisa de nascimento, altura e peso de Meus Dados. Se faltar algo, a própria tela mostra o formulário de Meus Dados com os três obrigatórios. Menor de 18 anos vê o aviso de que o gerador é só para maiores.
- **Perguntas:** já treinou e há quanto tempo (faixas), dias por semana (2 a 6), objetivo, onde treina e dores ou lesões. As respostas **não são guardadas** em tabela: só o treino gerado fica gravado; as observações do protocolo podem citar as articulações evitadas.
- **Prévia:** mostra os dias, séries, repetições ou minutos e os avisos, sem gravar nada. "Gerar outra variação" muda a semente e pode ser repetido; "Voltar e ajustar" volta às perguntas.
- **Usar este treino:** o servidor **refaz o treino** a partir das respostas e da semente (o gerador é determinístico) e chama a função `create_generated_workout` (migração `0038`), que grava protocolo, dias e exercícios numa transação. O treino ativo anterior vai para o histórico (com as cargas registradas), a dieta não é tocada, e o novo vale por 8 semanas. Se já havia treino com exercícios, a tela pede confirmação.
- **Segurança:** o celular só envia respostas e semente, nunca o plano; o servidor lê nascimento, altura e peso do banco; a função só aceita Usuário Padrão e o plano próprio dele, e valida o formato de tudo (tamanhos, tipos, limites das cotas).

## Por que assim

- **Dado no código, não no banco:** a classificação (`catalog.ts`) é versionada, revisável num PR e coberta por testes de cobertura em todo CI; corrigir é um deploy comum, sem migração. O treino gerado grava só o **nome** do exercício (texto livre), então não depende do catálogo de sugestões do banco (`exercise_catalog`). Um teste garante que os nomes batem com o catálogo do banco, para as sugestões não divergirem.
- **Aviso em vez de bloqueio:** quando não há boa opção (quem treina em casa sem equipamento não tem exercício de puxar; dores e equipamento deixam um dia com menos de 4 exercícios), o treino sai mesmo assim com um aviso, em vez de recusar a pessoa.

## Limites e riscos

- **Os números e a classificação são um rascunho** (12/11/2026), a ser revisado por um profissional de educação física: níveis, articulações sensíveis, séries e repetições. Estão concentrados em `catalog.ts` e `rules.ts` justamente para o ajuste ser simples.
- Não substitui avaliação profissional nem médica; o treino traz esse aviso.
- 9 exercícios novos (`isNew`) foram propostos para quem treina em casa e ainda não existem nas sugestões do banco.

## Onde está

`src/lib/workout-generator/`: `catalog.ts` (161 exercícios e tipos), `rules.ts` (nível, divisão, séries e repetições, cardio, validação), `generate.ts` (motor), `answers.ts` (respostas do assistente e o que vai para o banco) e os testes `catalog.test.ts`, `rules.test.ts`, `generate.test.ts` (inclui uma varredura de 8.100 combinações de respostas) e `answers.test.ts`. Tela e ações: `src/app/(standard)/meu-plano/treino/gerar/page.tsx`, `src/components/shared/generator-wizard.tsx`, `generated-plan-preview.tsx`, `generate-workout-button.tsx` e `src/lib/actions/generated-workout.ts`. Banco: `supabase/migrations/0038_generated_workout.sql` (+ rollback e `supabase/tests/generated_workout_probe.sql`).
