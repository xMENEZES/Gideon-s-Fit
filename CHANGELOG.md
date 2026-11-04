# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem [SemVer](https://semver.org/lang/pt-BR/) (veja `docs/VERSIONAMENTO.md`).

## Não lançado

### Adicionado
- Notas de projeto por recurso em `docs/dev/` (carga e equipamento, cronômetro de descanso, Status, gamificação, ranking, cardio, catálogo de exercícios, times e perfis, menu, desempenho e banco de dados), com índice e modelo para novas notas.

## [1.3.0] - 2026-11-04

Deploy em produção com a migração `0034_push_notifications.sql` (tag no commit `712eee1`).

### Adicionado
- Aviso do fim do descanso por notificação push: com a tela do celular bloqueada, o app manda uma notificação "Descanso terminou" quando o cronômetro zera. Liga-se pelo convite no topo do treino do dia ou em "Minha conta", por aparelho. Vale para descansos de até 4 minutos e não aparece com o app aberto (que já avisa por conta própria). Exige a migração `0034_push_notifications.sql` (tabelas novas, só acrescenta) e as chaves de envio na Vercel.

## [1.2.0] - 2026-11-04

Deploy em produção com a migração `0033_exercise_catalog.sql` (tag no commit `8c0fd87`).

### Adicionado
- Alerta de tela piscando no fim do descanso: a tela pisca no ritmo dos bipes (6 vezes, cerca de 3 s), útil em academia barulhenta ou com o celular no silencioso. Com "reduzir movimento" ligado no aparelho, só o cronômetro fica em destaque, sem piscar. Só aparece com a tela ligada.
- Catálogo de exercícios: ao criar ou editar um exercício de musculação, o campo de nome sugere nomes de uma lista de 152 exercícios em português (a partir de 2 letras, sem diferenciar acento), com o grupo muscular ao lado. Dá para digitar qualquer nome fora da lista. Um nome novo pode ser guardado no catálogo pessoal (com o grupo muscular) e aparece nas próximas buscas, com um "x" para remover. Vale para profissionais e Usuários Padrão. Exige a migração `0033_exercise_catalog.sql` (tabela nova, só acrescenta).
- Documento do teste de concorrência (`docs/TESTE_DE_CONCORRENCIA.md`): como o app fala com o banco, a medição feita no banco de testes (até 100 telas simultâneas e registros de carga concorrentes, sem nenhum erro) e o que fazer se o uso crescer.

## [1.1.0] - 2026-11-04

Deploy em produção com a migração `0032_load_equipment.sql` (tag no commit `b9e7a7b`).

### Adicionado
- Registro de carga com equipamento: a pessoa pode marcar se a carga foi feita com halter, máquina ou barra (opcional). O próximo registro do mesmo exercício já vem com a última escolha, e o equipamento aparece no Status. Exige a migração `0032_load_equipment.sql` (só acrescenta uma coluna opcional).

### Alterado
- Tela do profissional: o ranking do time saiu de "Mensagens" e ganhou uma tela própria ("Ranking"), com o mesmo cartão de ligar e desligar.
- Menu do profissional no celular: passa a ficar na barra de baixo, como o do aluno, com ícones para Alunos (com a contagem de solicitações), Modelos, Mensagens, Ranking e Alertas (com a contagem de alertas). Em telas largas os links continuam no topo, agora com o Ranking.
- Tela do profissional: o resumo do status de cada aluno (dias de treino e aderência alimentar) passa a aparecer nos cards de "Meus alunos", e a tela "Status" do menu foi removida (o endereço antigo redireciona para "Meus alunos"). O status detalhado continua na ficha de cada aluno.

### Corrigido
- Scripts de teste das migrações 0029 e 0032 (`supabase/tests`): faltava preencher `created_by`, coluna obrigatória, e eles falhavam antes de testar as restrições.

## [1.0.2] - 2026-11-03

Deploy em produção (tag no commit `147b226`).

### Adicionado
- Banco de testes (staging) separado da produção, com contas de teste e dados fictícios, usado pelo ambiente local e pelos previews da Vercel.

### Alterado
- Dependências: atualização das bibliotecas (React 19.3.1, `@supabase/supabase-js` 2.118, `@supabase/ssr` 0.12.7, entre outras de versão menor), o que também fechou 14 dos 16 alertas de segurança de desenvolvimento.
- Dependabot passa a ignorar as versões maiores de `typescript` (o `typescript-eslint` ainda não suporta o 7), `eslint` (plugins do `eslint-config-next` só declaram suporte até a 9) e `@types/node` (acompanha o Node 22).

## [1.0.1] - 2026-11-03

Primeiro deploy sob a política de versionamento (tag no commit `7365ba2`).

### Adicionado
- Política de versionamento (`docs/VERSIONAMENTO.md`), roteiro de regressão, modelo de Pull Request e validação automática (CI).

### Corrigido
- Lint sem erros: as páginas de confirmação de e-mail, definição de senha e redefinição de senha deixam de ter os três erros que existiam (a confirmação lê o link direto da URL, sem estado, e a navegação final usa `window.location.assign`). O comportamento não muda, e o CI passa a exigir o lint limpo.

## [1.0.0] - 2026-11-03

Primeira versão marcada: o estado que estava em produção quando a política de versionamento foi adotada.

### Adicionado
- Protocolos de treino (séries, repetições, descanso, carga recomendada, cardio, vídeo) e de alimentação (refeições, opções e grupos de escolha), com histórico.
- Registro de carga com exercício conjugado (botão "+"), séries feitas e cronômetro de descanso com som e vibração de cerca de 3 s.
- Status com calendário de dois círculos por dia (treino e alimentação), cores verde, amarelo, vermelho e azul, e dia de descanso marcado pela pessoa.
- Gamificação: mensagens de incentivo, sequências, selos e ranking mensal do time (com aceite do aluno).
- Perfis: Usuário Padrão, Aluno do time, Profissional e Administrador, com times por código e modelos de protocolo.
- App instalável (PWA), tela de abertura própria, menu inferior no celular, tema claro e escuro, logo e ícones novos, cor da marca roxa `#6C0077`.
- Segurança: RLS em todas as tabelas, cabeçalhos de segurança, validação de entrada, exclusão de conta pelo próprio usuário.

[1.3.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.3.0
[1.2.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.2.0
[1.1.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.1.0
[1.0.2]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.2
[1.0.1]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.1
[1.0.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.0
