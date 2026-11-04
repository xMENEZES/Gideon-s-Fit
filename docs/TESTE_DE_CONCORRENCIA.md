# Teste de concorrência

Medição de como o Gideon's Fit se comporta quando muita gente usa ao mesmo tempo, feita em 04/11/2026 sobre a versão 1.1.0. Ela responde a uma pergunta: **as conexões com o banco travam ou falham em caso de muitos acessos simultâneos?** Resposta curta: não houve nenhum erro; o que existe é um limite de capacidade do plano Free sob rajada.

## Como o app fala com o banco

- O app só usa a **API HTTP do Supabase** (PostgREST e Auth) por meio do `supabase-js`. Não há driver de Postgres, `DATABASE_URL` nem conexão direta com o banco.
- Cada requisição cria um cliente leve, sem estado. Não existe conexão aberta e esquecida no lado do app, e portanto nada para "encerrar".
- O pool de conexões com o Postgres fica **dentro do Supabase** (no PostgREST), com tamanho definido pelo plano. O Supavisor (pooler) não se aplica, porque ele serve a conexões Postgres diretas.
- O JWT é verificado no próprio servidor do app, com a chave pública embutida (`src/lib/supabase/jwks.ts`), sem ida ao Supabase Auth a cada tela.
- Uma tela do aluno faz cerca de 7 consultas em paralelo (a leitura de sessão não conta).

Por isso, o teste mede a capacidade do projeto Supabase, não a forma de conectar.

## Ambiente

| Item | Valor |
|---|---|
| Banco | Projeto de **testes** (`aitkfgdawdxidpcegoku`), plano Free. A produção não foi tocada. |
| Código | Versão 1.1.0 |
| Contas | Duas contas de aluno de teste, com JWT real (as regras de acesso, RLS, e os gatilhos valem) |
| Cliente | Um único computador, `supabase-js` sobre Node |
| Data | 04/11/2026 |

## O que foi simulado

**Abertura da tela do aluno.** As 7 consultas reais da tela, disparadas em paralelo, uma tela por "usuário" (as duas contas se alternam):

1. perfil (`profiles`)
2. vínculo do aluno (`students`)
3. estado do ranking (`my_ranking_state`)
4. treino ativo com dias, exercícios e cargas (`protocols` com recursos embutidos)
5. selos (`achievements`)
6. mensagens de incentivo (`incentive_messages`)
7. progresso da dieta de hoje (`protocols` com refeições e registros)

**Registro de carga.** Inserções em `exercise_load_logs` na **mesma conta e no mesmo exercício**, o pior caso para o gatilho que recalcula o resultado diário (`daily_scores`).

**Misto.** 25 telas e 10 registros de carga ao mesmo tempo.

**Método.** A carga sobe em degraus. Em cada degrau, todas as telas começam no mesmo instante (o pior caso: rajada, não tráfego espalhado), em 3 rodadas com pausa entre elas. Há uma guarda que interrompe a escalada se mais de 10% das telas falharem ou se o p95 passar de 15 s (não foi acionada). Antes de cada cenário e ao final, os registros de teste são apagados.

## Resultados

### Abertura da tela do aluno

O "tempo da tela" é o da consulta mais lenta das 7 (a tela só aparece quando todas voltam).

| Telas ao mesmo tempo | Telas medidas | p50 | p95 | p99 | Máximo | Telas com erro |
|---|---|---|---|---|---|---|
| 1 (referência, uma por vez) | 10 | 0,09 s | 0,15 s | 0,15 s | 0,15 s | 0 |
| 10 | 30 | 0,43 s | 0,82 s | 2,08 s | 2,08 s | 0 |
| 25 | 75 | 1,22 s | 1,58 s | 1,60 s | 1,60 s | 0 |
| 50 | 150 | 2,07 s | 2,25 s | 2,26 s | 2,27 s | 0 |
| 100 | 300 | 8,53 s | 12,31 s | 12,33 s | 12,47 s | 0 |

Nenhuma das 7 consultas se destaca: dentro de cada degrau, o p95 de todas fica na mesma faixa. Isso indica **fila em um gargalo comum**, não uma consulta específica lenta.

### Registro de carga simultâneo (mesma conta e exercício)

| Registros ao mesmo tempo | Registros medidos | p50 | p95 | p99 | Máximo | Erros |
|---|---|---|---|---|---|---|
| 1 | 3 | 0,12 s | 0,65 s | 0,65 s | 0,65 s | 0 |
| 5 | 15 | 0,11 s | 0,34 s | 0,34 s | 0,34 s | 0 |
| 10 | 30 | 0,09 s | 0,29 s | 0,54 s | 0,54 s | 0 |
| 20 | 60 | 0,11 s | 0,30 s | 0,41 s | 0,41 s | 0 |

Sem conflito, impasse (deadlock) ou perda de registro: o gatilho do resultado diário aguenta as inserções concorrentes.

### Misto (25 telas e 10 registros juntos, 3 rodadas)

| | Medidos | p50 | p95 | Erros |
|---|---|---|---|---|
| Telas | 75 | 2,80 s | 3,25 s | 0 |
| Registros de carga | 30 | 2,69 s | 3,20 s | 0 |

Com leitura pesada em andamento, os registros passam de cerca de 0,3 s para cerca de 3 s: eles entram na mesma fila das leituras. Todos terminam.

## Análise

- **Nenhuma falha em todo o teste.** Foram 640 telas (cerca de 4.500 consultas) e 138 registros de carga, todos concluídos, sem erro, tempo esgotado ou conexão recusada. Não há evidência de travamento por conexões abertas ou ociosas.
- **A latência cresce de forma quase linear até 50 telas simultâneas** (cerca de 40 ms a mais por tela no p50), e **dá um salto em 100** (de 2,3 s para 12,3 s no p95). Em 50 telas, a vazão foi de cerca de 150 consultas por segundo (350 consultas em cerca de 2,3 s). Em 100 telas, caiu para cerca de 57 por segundo (700 em cerca de 12 s). A queda de vazão com mais carga indica **saturação** do projeto.
- **O limite é a capacidade do projeto no plano Free sob rajada**, e a fila afeta leitura e escrita igualmente.
- **Contexto de uso:** 100 pessoas abrindo a tela no mesmo segundo é um cenário extremo para um app em que cada profissional atende algumas dezenas de alunos. O uso normal é espalhado ao longo do dia e fica muito abaixo do ponto de saturação.

## Conclusão sobre pool de conexões

**Não há o que mudar na forma de conexão.** O app não abre conexões diretas ao Postgres e, portanto, não deixa conexões ociosas nem esgota o limite de conexões do banco. O pool existe do lado do Supabase e não apresentou falha. Trocar para um pooler não resolveria nada aqui, porque o app não usa conexões Postgres.

## Limites deste teste

- **Cliente único.** Todas as requisições saem de um computador, em HTTP/1.1, com uma conexão nova por consulta. Parte da lentidão no degrau de 100 pode ser do próprio cliente (o custo de abrir 700 conexões ao mesmo tempo), não só do servidor.
- **Não cobre a Vercel.** Partida fria e concorrência das funções do app não foram medidas. Os testes foram feitos direto contra a API do banco.
- **Não cobre o login.** O Supabase Auth recebeu só 2 logins, no começo.
- **Volume de dados pequeno.** O banco de testes tem poucos registros. A produção (do mesmo plano, mas outra instância) tem mais dados, o que pode deixar as consultas um pouco mais lentas com o tempo.
- **Rajada, não fluxo contínuo.** O teste mede o pior caso de pico, não o tráfego real distribuído.

## Se o uso crescer

Em ordem de custo, do mais barato ao mais caro:

1. **Reduzir as consultas por tela.** Juntar perfil e vínculo do aluno em uma só consulta (função no banco) e guardar em cache as mensagens de incentivo, que mudam raramente. Menos consultas por tela significam menos fila.
2. **Subir o plano ou o compute do Supabase**, que aumenta a capacidade do pool e da CPU do banco.
3. **Repetir este teste** depois de qualquer uma das mudanças, com os mesmos degraus, para comparar.

## Como repetir

O teste é um script Node que usa o `supabase-js` com os tokens reais das contas de teste. Regras para repetir:

- Rodar **somente no banco de testes**: o script se recusa a rodar se a URL não for a do projeto de testes.
- Subir a carga em degraus (10, 25, 50 e 100 telas, 3 rodadas cada) com a guarda de parada.
- Apagar os registros de teste ao final (registros de carga do dia e resultado diário das contas de teste).
- Registrar os resultados no mesmo formato das tabelas acima.
