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
- [ ] **A** Login com senha errada: no 3º erro seguido a tela avisa "Tente de novo em 1:00" com contagem regressiva e o botão desabilitado; durante a espera nem a senha certa entra; passada a espera, 2 tentativas livres e a 6ª pede 5 minutos; trocar o e-mail no campo libera o botão; acertar a senha entra e zera a contagem.
- [ ] **A** Login com Google continua funcionando e a sessão do login por e-mail vale em todas as áreas (profissional, aluno e usuário padrão), inclusive após recarregar.
- [ ] **A** CAPTCHA: no login, no cadastro e no "esqueci a senha" o botão só libera depois do widget gerar o token (invisível na maior parte das vezes); depois de cada envio o botão espera um token novo; sem a chave do site (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) nada aparece e tudo funciona como antes; com a chave de teste que sempre barra, o erro "verificação de segurança" aparece e não conta tentativa; o login com Google segue sem CAPTCHA.
- [ ] **A** Sair encerra a sessão (voltar a uma rota protegida pede login).
- [ ] **A** Minha conta abre, e a exclusão de conta pede a confirmação do e-mail (não excluir de verdade fora de conta de teste).

- [ ] **A** Cadastro, convite (`/definir-senha`) e redefinição (`/redefinir-senha`): a lista de regras da senha marca cada item ao digitar, cabe em 360 px nos dois temas, e enviar `abcdefg1` (falta maiúscula e símbolo) ou `Senha@123` (comum) mostra a frase do problema sem chamar o servidor; uma senha forte segue o fluxo.
- [ ] **A** Login com uma senha antiga e fraca (conta de teste criada com ela) continua entrando.

- [ ] **A** Margem lateral no celular (360 px): cartões, abas, listas e a barra do topo encostam a 12 px das bordas, sem rolagem horizontal, nos temas claro e escuro, nas telas do profissional, do aluno, do Usuário Padrão e em Minha conta; em tablet e computador (a partir de 640 px) o espaçamento segue como antes.

## Usuário Padrão
- [ ] **A** Abas Treino, Alimentar, Status e Time; a barra de baixo some ao rolar para baixo e volta ao rolar para cima.
- [ ] **A** Registrar carga: valor simples, conjugado com o botão "+", séries preenchidas e em branco.
- [ ] **A** Histórico de carga (toque em "X kg atual"): com 2 a 7 registros, cada ponto do gráfico tem a data (dd/mm) embaixo, sem rótulo escondido nem ponto cortado nas bordas; com mais de 7, mostra os 7 mais recentes e a nota; confira também em tela estreita (320 px) e no tema escuro.
- [ ] **A** Registrar carga com equipamento: marcar halter, máquina, barra ou cross (tocar de novo desmarca; no celular os 4 botões ficam na mesma linha, sem cortar o texto), salvar sem escolher, e conferir que o próximo registro do mesmo exercício já vem com a última escolha e que o Status mostra o equipamento no fim da linha.
- [ ] **A** Cronômetro: iniciar, pausar, ajustar, reiniciar.
- [ ] **C** Cronômetro: som e vibração no fim da contagem.
- [ ] **C** Aviso por notificação push: ligar pelo convite do treino ou em Minha conta; iniciar o cronômetro (descanso curto), bloquear a tela e receber "Descanso terminou" no fim; pausar ou reiniciar antes do fim cancela o aviso; com o app aberto não aparece notificação; tocar na notificação abre o app; desligar em Minha conta para de avisar.
- [ ] **C** Cronômetro: no fim da contagem tocam o som e a vibração, sem nenhuma camada roxa sobre a tela; pausar, reiniciar ou iniciar de novo funciona.
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
- [ ] **A** Ranking do profissional: com o ranking ligado e alunos participando, a "Classificação do mês" lista só os participantes, com posição, nome (apelido ou primeiro nome) e pontos batendo com a tela do aluno, mostra o aviso de quantos não participam, e some com o ranking desligado ou sem participantes; a tela do aluno segue igual.
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
