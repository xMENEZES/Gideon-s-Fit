# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem [SemVer](https://semver.org/lang/pt-BR/) (veja `docs/VERSIONAMENTO.md`).

## Não lançado

## [1.8.0] - 2026-11-12

Deploy em produção com a migração `0038_generated_workout.sql` (descanso opcional e função que grava o treino gerado; tag no commit `431e323`). O gerador foi liberado para todos os Usuários Padrão maiores de 18 anos, com a classificação e as regras ainda em rascunho, sem a revisão de um profissional de educação física.

### Alterado
- O **descanso** entre as séries (`rest_seconds`) passa a ser **opcional** e sem valor padrão. Sem descanso definido, o cartão do exercício não mostra "Xs descanso" nem o cronômetro, e o campo "Descanso" ao editar o exercício pode ficar em branco. Ao criar um exercício à mão o campo continua vindo com 60. Exige a migração `0038_generated_workout.sql`.

### Adicionado
- **Gerar meu treino** (Usuário Padrão, a partir de 18 anos): assistente com cinco perguntas (experiência, dias por semana, objetivo, onde treina e dores ou lesões), prévia do treino com séries e repetições (e cardio, quando o objetivo pede) e "Gerar outra variação". Usa nascimento, altura e peso de Meus Dados, que a própria tela pede se faltarem. **O gerador não sugere descanso.** As respostas não ficam guardadas: só o treino gerado, que vale por 8 semanas e manda o treino anterior para o histórico. Base: classificação de 161 exercícios, regras de séries e repetições por nível, objetivo, idade e dias, e o motor, em `src/lib/workout-generator/`. Exige a migração `0038_generated_workout.sql` (função que grava o treino numa transação). Veja `docs/dev/gerador-de-treino.md`.
- A política de privacidade passa a descrever o treino gerado e o que não fica guardado.

## [1.7.0] - 2026-11-12

Deploy em produção com a migração `0037_body_data.sql` (tabela nova, só acrescenta; tag no commit `86cb61f`).

### Alterado
- A tela **Minha conta** passou a se chamar **Perfil** (ícone de pessoa no topo) e ganhou duas opções em lista: **Meus Dados** (novo) e **Informações da Conta**, que traz o que a tela já tinha (aviso de descanso e exclusão de conta). O endereço `/conta` continua valendo e leva a Meus Dados.
- Política de privacidade atualizada (12/11/2026): dados de saúde (data de nascimento, altura e peso), consentimento, acesso do profissional e idade mínima de 18 anos para esses dados.

### Adicionado
- **Meus Dados**: cada pessoa pode informar data de nascimento (obrigatória), altura e peso (opcionais), **só para maiores de 18 anos** e **com consentimento**, que pode ser retirado com "Apagar meus dados". O **profissional vê, somente leitura**, os dados dos alunos do time na nova aba **Dados** da ficha do aluno. Exige a migração `0037_body_data.sql` (tabela nova, só acrescenta), que deve rodar **antes** do deploy. Base para o gerador de treino do Usuário Padrão (próximas etapas).

## [1.6.0] - 2026-11-12

Deploy em produção, sem migração (tag no commit `d2555a6`).

### Segurança
- Atualização do grupo de dependências: Next 16.4.3 → 16.4.5, `@supabase/supabase-js` 2.119, `lucide-react` 1.70, Tailwind 4.3.4, `eslint-config-next` 16.4.5 e Vitest 5.1 (mudanças pequenas e correções). O `npm audit` da produção já dava 0 vulnerabilidades e continua dando.
- Alerta do Dependabot em `minimatch` (negação de serviço) resolvido: as duas ferramentas de desenvolvimento que o usavam (lint e CLI de componentes) passam a usar a versão 11.0.8 por `overrides` no `package.json`. Ele nunca fez parte do app em produção.
- Alerta em `deepmerge` (poluição de protótipo) **não tem versão corrigida** publicada e vem só da CLI de componentes (`shadcn`), usada em desenvolvimento. Fica registrado como risco aceito até sair a correção.

### Alterado
- `@hookform/resolvers` atualizado da 5.4 para a 7.0.6 (a conexão entre os formulários e a validação com `zod`). As mudanças das versões 6 e 7 que quebram compatibilidade são só dos resolvers de `effect` e `typebox`, que o projeto não usa; o de `zod` segue igual. Nenhuma tela muda.

## [1.5.0] - 2026-11-12

Deploy em produção com a migração `0036_equipment_cross.sql` (só amplia a lista de equipamentos aceita; tag no commit `c8ad225`).

### Alterado
- Margem lateral das telas no celular reduzida de 24 px para 12 px (áreas do profissional, do aluno, do Usuário Padrão, administrador e Minha conta), e a barra do topo acompanha. Em telas maiores (a partir de `sm`) nada muda; a página fica mais larga e os cartões aproveitam melhor a tela.

### Adicionado
- **Cross** como equipamento no registro de carga (ao lado de Halter, Máquina e Barra), com o mesmo comportamento: opcional, sugerido na próxima vez e mostrado no Status. Exige a migração `0036_equipment_cross.sql` (só amplia a lista aceita), que deve rodar **antes** do deploy.
- Classificação do mês na tela **Ranking do profissional**: com o ranking ligado, a lista com a posição e os pontos de cada aluno que participa (apelido ou primeiro nome), empate dividindo a posição, e o aviso de quantos alunos do time não aparecem por não participarem. Antes a tela só tinha o liga/desliga e a contagem. Sem migração: usa os acessos que o profissional já tem aos seus alunos.

## [1.4.0] - 2026-11-12

Deploy em produção com a migração `0035_login_throttle.sql` (tag no commit `c466a44`). O CAPTCHA só passa a valer depois de ligado no painel do Supabase (veja `docs/dev/captcha.md`).

### Alterado
- Senha nova (cadastro, convite do profissional e redefinição) agora exige de 8 a 72 caracteres com letra minúscula, letra maiúscula, número e símbolo, e recusa senhas comuns (como `Senha@123`). Os três formulários mostram a lista de regras e marcam o que já foi cumprido enquanto a pessoa digita. O login não mudou: quem tem senha antiga e fraca continua entrando.
- Mensagens em português para senha recusada pelo servidor, senha igual à atual e excesso de tentativas.

### Adicionado
- CAPTCHA (Cloudflare Turnstile) no login, no cadastro e no "esqueci a senha", desligado até a chave do site ser configurada (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`). Com o CAPTCHA ligado também no Supabase, as tentativas de login feitas direto na API passam a exigir o token, o que completa o limite de tentativas. O login com Google não muda. A CSP libera `challenges.cloudflare.com`.
- Limite de tentativas de login por e-mail e senha, com espera que cresce: 3 tentativas, 1 minuto; mais 3, 5 minutos; depois 15 minutos e 1 hora. Há três contadores (e-mail + IP, IP e e-mail de qualquer IP) e a tela mostra a contagem regressiva. O login passa por uma rota do servidor (`/api/auth/login`); o login com Google não muda. Exige a migração `0035_login_throttle.sql` (tabela e funções novas, só acrescenta), que deve rodar **antes** do deploy.
- Notas de projeto por recurso em `docs/dev/` (carga e equipamento, cronômetro de descanso, Status, gamificação, ranking, cardio, catálogo de exercícios, times e perfis, menu, desempenho e banco de dados), com índice e modelo para novas notas.

## [1.3.2] - 2026-11-04

Deploy em produção, sem migração (tag no commit `306b22c`).

### Corrigido
- Gráfico do histórico de carga: agora mostra a data (dia e mês) de **todos** os dias treinados, embaixo de cada ponto. Antes o gráfico escondia parte das datas (a primeira e, com mais registros, várias outras) e cortava o primeiro ponto na borda.

## [1.3.1] - 2026-11-04

Deploy em produção, sem migração (tag no commit `438495c`).

### Removido
- Alerta de tela piscando no fim do descanso (camada roxa sobre a tela toda), que entrou na 1.2.0. Com o aviso por notificação push funcionando, o cronômetro volta a avisar só por som e vibração com a tela ligada, e por notificação com a tela bloqueada.

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

[1.3.2]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.3.2
[1.3.1]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.3.1
[1.3.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.3.0
[1.2.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.2.0
[1.1.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.1.0
[1.0.2]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.2
[1.0.1]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.1
[1.0.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.0
