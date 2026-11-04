# Status e calendário

## O que é

A aba **Status** mostra como a pessoa está cumprindo o protocolo: um calendário com dois círculos por dia, o detalhe do dia tocado e o resumo de um período. O profissional vê o Status de cada aluno na ficha dele (somente leitura) e um **resumo** de cada aluno nos cards da tela "Alunos".

## Regras do calendário

- **Dois círculos fixos por dia:** o da esquerda é o treino, o da direita é a alimentação.
- **A cor só aparece depois que o dia termina.** Hoje fica só com o contorno; dias sem protocolo também. Verde = completo, amarelo = parcial, vermelho = nada feito, azul = descanso (só no círculo do treino).
- **Treino completo** é o `workout_done` do resultado diário (`daily_scores`), a mesma regra das sequências e dos selos: todos os exercícios de um dia do protocolo registrados na data. Já o "dia treinado" do detalhe conta **qualquer registro** na data.
- **Alimentação só conta dias encerrados.** O dia de hoje aparece como "Em andamento" e só entra nos totais e no aproveitamento quando termina.
- **Dia de descanso** é marcado pela própria pessoa, no cartão do dia (tabela `rest_days`, migração `0030`). Um gatilho recusa marcar um dia que já tem exercício registrado. A pessoa grava; o profissional só lê. **Descanso não segura a sequência** (decisão do dono).
- **Seleção:** um toque num dia mostra o dia; um segundo toque em outro dia forma um período (totais e só as ocorrências "Não fez", com motivo). A seleção é instantânea no cliente. Os atalhos "Protocolo atual" e "Últimos 7, 14 e 30 dias" são resolvidos no servidor.

## Resumo nos cards do profissional

Cada card de "Alunos" mostra "Treino: X de Y dias treinados" e "Alimentar: N% (feitas de previstas)". O resumo carrega em segundo plano (Suspense), para os nomes aparecerem sem esperar, e todos os cards compartilham **uma única consulta** para o time inteiro (`getTeamStatusSummaries`, com cache por requisição). A tela "Status do time" separada foi removida; `/dashboard/status` redireciona para `/dashboard`.

## Onde está

`src/lib/status.ts`, `src/lib/status-select.ts`, `src/lib/status-summary.ts`, `src/lib/data/team-status.ts`, `src/lib/rest-day.ts` e os componentes `status-*.tsx`. Migrações `0027` (resultado diário) e `0030` (descanso).
