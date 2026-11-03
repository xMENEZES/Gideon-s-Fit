# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem [SemVer](https://semver.org/lang/pt-BR/) (veja `docs/VERSIONAMENTO.md`).

## Não lançado

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

[1.0.1]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.1
[1.0.0]: https://github.com/xMENEZES/Gideon-s-Fit/releases/tag/v1.0.0
