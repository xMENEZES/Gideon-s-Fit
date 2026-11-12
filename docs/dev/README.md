# Notas de projeto por recurso

Cada nota registra **o que o recurso faz, as decisões tomadas e por quê**, para quem for mexer nele depois (inclusive o futuro eu). O que o código já diz com clareza não se repete aqui; entram o contexto, as regras de negócio e os motivos.

As notas descrevem o comportamento da **versão 1.1.0** em diante. A lista do que mudou em cada versão está no [`CHANGELOG.md`](../../CHANGELOG.md), e o fluxo de trabalho em [`../VERSIONAMENTO.md`](../VERSIONAMENTO.md).

## Índice

| Nota | Assunto |
|---|---|
| [carga-e-equipamento](carga-e-equipamento.md) | Registro de carga: histórico, data, conjugado, séries feitas e equipamento |
| [cronometro-de-descanso](cronometro-de-descanso.md) | Contagem do descanso e alarme sonoro |
| [notificacao-push](notificacao-push.md) | Aviso do fim do descanso com a tela bloqueada |
| [status-e-calendario](status-e-calendario.md) | Calendário do Status, cores, dia de descanso e resumo nos cards |
| [gamificacao](gamificacao.md) | Resultado diário, sequências, selos e mensagens de incentivo |
| [ranking](ranking.md) | Ranking mensal do time |
| [cardio](cardio.md) | Exercícios de cardio |
| [catalogo-de-exercicios](catalogo-de-exercicios.md) | Sugestões de nome ao montar o treino |
| [senha-e-login](senha-e-login.md) | Regras da senha nova, erros do servidor e proteção do login |
| [times-e-perfis](times-e-perfis.md) | Perfis, times, código e solicitações |
| [menu-e-navegacao](menu-e-navegacao.md) | Menu inferior no celular e rotas de entrada |
| [desempenho-e-abertura](desempenho-e-abertura.md) | Abertura rápida e consultas ao banco |
| [banco-e-migracoes](banco-e-migracoes.md) | Convenções de migração, regras de acesso e testes do banco |

Há também o [teste de concorrência](../TESTE_DE_CONCORRENCIA.md) e o [roteiro de regressão](../TESTES_DE_REGRESSAO.md).

## Como escrever uma nota

Uma nota curta, em português, com estas partes (use só as que fizerem sentido):

- **O que é:** uma ou duas frases.
- **Regras:** o comportamento que não é óbvio no código.
- **Por que assim:** a decisão e a alternativa que ficou de fora.
- **Limites e riscos:** o que o recurso não faz, o que pode dar errado.
- **Onde está:** arquivos principais e migrações.

Regras para as notas: **sem dados pessoais, senhas, chaves ou identificadores de projetos** (o repositório é público), e atualizar a nota na mesma mudança que altera o comportamento.
