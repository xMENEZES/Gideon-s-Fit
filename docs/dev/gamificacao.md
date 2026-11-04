# Gamificação

Três partes: resultado diário (a base), sequências e selos, e mensagens de incentivo. O ranking mensal tem [nota própria](ranking.md).

## Resultado diário

- Tabela `daily_scores` (aluno, data, `workout_done`, `diet_done`). **Quem calcula é o banco**: gatilhos (security definer) em `exercise_load_logs` (insert) e `meal_logs` (insert, update e delete) recalculam o dia. O cliente nunca envia pontos.
- **Treino concluído** = todos os exercícios de um mesmo dia do protocolo registrados na data (cardio incluso). **Dieta completa** = todas as refeições do dia marcadas como feitas.
- Exclusão em cascata (apagar protocolo, por exemplo) **não** recalcula: o histórico fica preservado.

## Sequências e selos

- **Treino:** conta só dias treinados e só quebra no **3º dia seguido sem treinar**. **Dieta:** tolera 1 dia de folga (refeição livre) e quebra no **2º dia seguido** incompleto. **Treino + Dieta:** dia com os dois e sequência de treino viva. O dia de hoje, em andamento, nunca quebra; conta só dias cumpridos.
- **Selos:** 3 linhas (Treino, Dieta, Treino + Dieta) × marcos 3, 7, 14, 30, 60, 100 e 200 dias = 21 selos, em SVG paramétrico. Ficam em `achievements`, **gravados só pelo servidor** (service role, `lib/gamification/award.ts`, chamado ao registrar carga, cardio ou refeição feita).
- Sequências e selos são **separados por plano** (time x plano próprio).
- A celebração de selo novo aparece **uma vez** (marcada no `sessionStorage`); depois fica só o ícone do maior selo de cada linha no cartão de topo.

## Mensagens de incentivo

- Tabela `incentive_messages`. **Dono nulo = mensagem do sistema** (só a migração mexe); o profissional cria, edita e ativa as dele, até **10 por evento** (cota por gatilho).
- Eventos: treino concluído, alimentação concluída, dia completo e sequência (selo novo, com `{sequencia}`). `{nome}` vira o nome do aluno.
- **Quem vê o quê:** aluno de time vê as do profissional (se houver alguma ativa para o evento; senão cai nas do sistema); Usuário Padrão sempre vê as do sistema. Com mais de uma ativa, cada aluno vê uma por dia.

## Onde está

`src/lib/streaks.ts`, `src/lib/seals.ts`, `src/lib/incentive.ts`, `src/lib/data/incentive.ts`, `src/lib/gamification/award.ts`. Migrações `0025` (mensagens) e `0027` (resultado diário e selos).
