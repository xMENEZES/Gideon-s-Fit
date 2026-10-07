# Referência do teste de isolamento (RLS): 07/10/2026

Resultado de `rls_isolation_probe.sql` (Partes A e B) com as migrações 0001 a 0020 aplicadas, **antes** da
otimização das políticas (Etapa 2). Depois da Etapa 2, rodar o mesmo script de novo: os números abaixo
precisam ser **idênticos**, e a Parte B precisa continuar com 7 "OK" em cada conta.

## Parte A: linhas visíveis por conta

| Tabela | Profissional | Aluno do time | Usuário Padrão |
|---|---|---|---|
| profiles | 2 | 1 | 1 |
| students | 1 | 1 | 1 |
| protocols (todos) | 3 | 3 | 2 |
| modelos (templates) | 0 | 0 | 0 |
| workout_days | 3 | 3 | 0 |
| exercises | 4 | 4 | 0 |
| exercise_load_logs | 9 | 9 | 0 |
| meals | 1 | 1 | 0 |
| meal_options | 2 | 2 | 0 |
| meal_items | 2 | 2 | 0 |
| meal_logs | 2 | 2 | 0 |
| team_codes | 1 | 0 | 0 |
| team_join_requests | 3 | 0 | 3 |
| team_join_attempts | 0 | 0 | 0 |

## Parte B: tentativas de escalada (as 3 contas, idêntico)

| Tentativa | Resultado |
|---|---|
| alterar o próprio papel (profiles.role) | OK: bloqueado (permission denied for table profiles) |
| alterar students.trainer_id | OK: bloqueado (permission denied for table students) |
| inserir em students | OK: bloqueado (permission denied for table students) |
| alterar team_join_requests | OK: nenhuma linha alterada |
| inserir em team_join_requests | OK: bloqueado (new row violates row-level security policy) |
| apagar team_codes | OK: nenhuma linha apagada |
| alterar exercise_load_logs | OK: nenhuma linha alterada |

## Leitura dos resultados

- Nenhuma conta enxerga mais do que deveria: o Usuário Padrão não vê dados do time, o aluno não vê
  códigos nem solicitações de outras pessoas, e o profissional só vê o aluno dele.
- Profissional e aluno veem os mesmos 3 protocolos porque são os do mesmo aluno (um treino do histórico,
  o treino ativo e o protocolo alimentar ativo).
- O Usuário Padrão tem 2 protocolos próprios e vê as 3 solicitações de entrada que ele mesmo fez.
- Nenhuma tentativa de escalada funcionou nas três contas.

---

## Verificação após a migração 0021 (otimização das políticas): 07/10/2026

O script foi executado de novo nas três contas depois da 0021. **Todas as contagens da Parte A ficaram
idênticas à tabela acima, e a Parte B continuou com 7 "OK" em cada conta.** As permissões não mudaram.

Medição de desempenho (consultas aninhadas, servidor de desenvolvimento): protocolo alimentar de
283 a 380 ms para 63 a 107 ms; protocolo de treino de 366 a 371 ms para 92 a 110 ms.
