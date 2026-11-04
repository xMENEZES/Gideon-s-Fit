# Times e perfis

## Perfis

| Perfil | O que faz |
|---|---|
| **Profissional** | Monta treino e protocolo alimentar dos alunos, usa modelos, edita as mensagens de incentivo, liga o ranking e aprova entradas no time. Cadastro livre, sem aprovação. |
| **Usuário Padrão** (`standard`) | Plano próprio em `/meu-plano`: monta e treina o próprio protocolo. Pode pedir para entrar num time. |
| **Aluno do time** | Segue o protocolo montado pelo profissional, em `/aluno`. Registra carga e refeições. |
| **Administrador** | Área `/admin`: convida profissionais. |

O cadastro é aberto (Google ou e-mail e senha). O **convite por e-mail de aluno foi removido**: a pessoa se cadastra e entra no time por código.

## Plano próprio

Quem usa o plano próprio tem uma linha "solo" em `students` com `trainer_id = profile_id`. Assim, o plano próprio e o de aluno compartilham as mesmas tabelas e telas.

## Entrar e sair do time

- O profissional gera um **código de time de 8 caracteres** (`team_codes`). O Usuário Padrão envia uma solicitação em "Entrar no Time" (`team_join_requests`) e **só entra quando o profissional aprova**. Ao entrar, o plano próprio fica oculto.
- Um limite atômico de tentativas de código (função `register_join_attempt`) evita adivinhar códigos.
- O aluno pode **sair do time sozinho**: o que o profissional montou para ele é apagado e a pessoa volta a Usuário Padrão.
- Excluir a conta é decisão da própria pessoa (`/conta`, com o e-mail digitado para confirmar). Profissional excluído: os alunos viram Usuário Padrão. O administrador não se exclui.

## Regras de segurança

- Isolamento entre contas por **RLS em todas as tabelas**; o profissional só enxerga os alunos do próprio time.
- O cliente altera em `profiles` apenas o `full_name`. `students` não tem insert nem update de cliente: só o servidor, com a chave de serviço, cria e muda vínculos.
- E-mails de confirmação de cadastro e de redefinição de senha usam um link próprio (`/auth/confirm?token_hash=...`), para scanners de e-mail não consumirem o token e a pessoa ver "link inválido".
- Cotas por conta (gatilhos `quota_exceeded:<chave>`): por exemplo 200 alunos por profissional e 100 modelos. Mensagens em `src/lib/quota.ts`.

## Onde está

Rotas em `src/app/(trainer)`, `(student)`, `(standard)`, `(admin)` e `(account)`; `src/lib/auth/`; `src/lib/team/`. Migrações `0001` a `0016`, `0020`, `0022` e `0023`.
