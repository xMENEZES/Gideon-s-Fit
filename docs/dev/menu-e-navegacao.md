# Menu e navegação

## Menu inferior no celular

- No celular (abaixo de 640 px) o menu fica na **barra de baixo** (`BottomNav`), para aluno, Usuário Padrão e profissional. A partir de 640 px os links ficam no topo e a barra some.
- A barra **some ao rolar para baixo e volta ao rolar para cima** (com uma tolerância de 8 px para ignorar tremida do dedo); no topo da página sempre aparece.
- **Itens do aluno:** Treino, Alimentar, Status, Ranking (só se o profissional ligou) e Time. **Itens do profissional:** Alunos, Modelos, Mensagens, Ranking e Alertas.
- **Contagens no profissional:** "Alunos" mostra as solicitações de entrada pendentes e "Alertas" mostra os protocolos que terminam em até 7 dias. As contagens carregam em segundo plano (Suspense) e são feitas **uma vez por visita** (cache por requisição), porque o menu aparece em dois lugares (topo e barra de baixo).
- Um componente não atravessa do servidor para o cliente, então os ícones são passados **por nome**, e as contagens como elementos já renderizados.

## Item ativo

`src/lib/nav.ts` decide o item ativo: a própria rota e as filhas contam. `exact` limita à própria rota (para `/dashboard`, pai das outras) e `alsoActiveFor` acrescenta prefixos (a ficha do aluno ativa "Alunos").

## Rotas de entrada

As raízes das áreas só redirecionam (`/aluno` → `/aluno/treino`, `/meu-plano` → `/meu-plano/treino`), feito no `next.config.ts` antes de renderizar o layout, para poupar uma ida ao banco. A tela "Status do time" do profissional foi removida; `/dashboard/status` redireciona para `/dashboard`.

## Onde está

`src/components/shared/bottom-nav.tsx`, `nav-link.tsx`, `top-bar.tsx`, `section-tabs.tsx`, `trainer-nav-badges.tsx`, `src/lib/nav.ts` e os `layout.tsx` de cada área.
