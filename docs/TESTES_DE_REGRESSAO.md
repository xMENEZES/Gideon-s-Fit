# Roteiro de regressão

Fluxos críticos que não podem quebrar. Em cada branch, rode os que a mudança pode afetar (na dúvida, todos) e marque no Pull Request. Use **contas de teste**, em 360 px, nos temas claro e escuro.

Legenda: **A** = dá para automatizar ou checar no preview local; **C** = só no celular, pelo dono.

## Público (sem login)
- [ ] **A** `/` mostra a página de divulgação, com botões "Criar conta" e "Entrar".
- [ ] **A** `/login`, `/cadastro`, `/esqueci-senha`, `/privacidade`, `/excluir-conta` e `/offline` abrem.
- [ ] **A** Rota protegida sem login (`/aluno/treino`, `/meu-plano/treino`, `/dashboard`, `/admin`, `/conta`) leva a `/login`.
- [ ] **A** `/abrindo/<destino>` abre a tela de abertura e `/abrindo/xyz` dá 404.

## Entrada e conta
- [ ] **A** Login com e-mail e senha leva à tela inicial certa de cada perfil.
- [ ] **A** Sair encerra a sessão (voltar a uma rota protegida pede login).
- [ ] **A** Minha conta abre, e a exclusão de conta pede a confirmação do e-mail (não excluir de verdade fora de conta de teste).

## Usuário Padrão
- [ ] **A** Abas Treino, Alimentar, Status e Time; a barra de baixo some ao rolar para baixo e volta ao rolar para cima.
- [ ] **A** Registrar carga: valor simples, conjugado com o botão "+", séries preenchidas e em branco.
- [ ] **A** Registrar carga com equipamento: marcar halter, máquina ou barra (tocar de novo desmarca), salvar sem escolher, e conferir que o próximo registro do mesmo exercício já vem com a última escolha e que o Status mostra o equipamento no fim da linha.
- [ ] **A** Cronômetro: iniciar, pausar, ajustar, reiniciar.
- [ ] **C** Cronômetro: som e vibração no fim da contagem.
- [ ] **C** Aviso por notificação push: ligar pelo convite do treino ou em Minha conta; iniciar o cronômetro (descanso curto), bloquear a tela e receber "Descanso terminou" no fim; pausar ou reiniciar antes do fim cancela o aviso; com o app aberto não aparece notificação; tocar na notificação abre o app; desligar em Minha conta para de avisar.
- [ ] **C** Cronômetro: a tela pisca (6 vezes, cerca de 3 s) no fim da contagem; com "reduzir movimento" ligado no aparelho, só o cronômetro fica em destaque; reiniciar ou iniciar de novo no meio do alerta interrompe a piscada.
- [ ] **A** Alimentação: marcar refeição como feita e como "não fiz" com motivo.
- [ ] **A** Status: calendário com os dois círculos por dia, cores corretas, dia de hoje só com contorno.
- [ ] **A** Dia de descanso: marcar e desmarcar; não aparece no dia com treino registrado.
- [ ] **A** Editar plano: criar dia de treino, exercício, refeição, opção e alimento.
- [ ] **A** Time: pedir entrada com código.

## Aluno do time
- [ ] **A** Abas conforme o que o profissional liberou (treino e/ou alimentação), Status, Time.
- [ ] **A** Ranking: a aba só aparece com o ranking ligado; aviso de participação, participar, ver a lista, sair.
- [ ] **A** Sair do time devolve o plano próprio.

## Profissional
- [ ] **A** Alunos: lista, ficha de um aluno, treino e dieta do aluno, Status do aluno (somente leitura do descanso).
- [ ] **A** Alunos: cada card mostra o resumo "Treino" e "Alimentar" do aluno; o menu não tem mais "Status" e `/dashboard/status` redireciona para `/dashboard`.
- [ ] **A** Modelos: criar, aplicar a alunos.
- [ ] **A** Catálogo de exercícios (novo exercício de musculação, no aluno e no modelo): digitar 2 letras sugere nomes (sem diferenciar acento), escolher com toque e com setas e Enter; digitar um nome que não está na lista continua valendo; nome novo oferece "Guardar este nome no meu catálogo" (pede o grupo muscular) e aparece nas próximas buscas como "meu"; o "x" remove o nome guardado; ao editar sem mexer no nome não oferece guardar; exercício de cardio não muda.
- [ ] **A** Mensagens de incentivo: editar (o cartão do ranking não fica mais aqui).
- [ ] **A** Ranking: tela própria com o cartão do ranking (ligar e desligar), e a aba Ranking aparece ou some para os alunos.
- [ ] **A** Menu do profissional: no celular fica embaixo (Alunos, Modelos, Mensagens, Ranking, Alertas) com as contagens em Alunos e Alertas, some ao rolar para baixo e volta ao rolar para cima; em tela larga os links ficam no topo.
- [ ] **A** Alertas e solicitações de entrada (aprovar e recusar).

## Administrador
- [ ] **A** `/admin` abre e convida profissional.

## App instalado (PWA)
- [ ] **C** Instalar pelo Chrome e abrir pelo ícone novo.
- [ ] **C** Abrir logado depois de um tempo parado: tela escura "Abrindo..." quase na hora.
- [ ] **A** `/sw.js` na versão esperada do cache e página `/offline`.

## Segurança
- [ ] **A** Cabeçalhos de segurança presentes (CSP, `X-Frame-Options`, `nosniff`).
- [ ] **A** Um aluno não enxerga dados de outro (ver `supabase/tests/rls_isolation_probe.sql`, quando a mudança mexer em regras de acesso).
- [ ] **A** Nenhum segredo, e-mail pessoal ou dado real nos arquivos alterados.

## Banco (quando houver migração)
- [ ] Migração e rollback revisados; script de teste rodou com todos os itens "ok" no banco de testes.
- [ ] A migração só acrescenta e é compatível com o código atual da `main`.
