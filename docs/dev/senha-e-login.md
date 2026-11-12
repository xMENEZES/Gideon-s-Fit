# Senha e proteção do login

## O que é

Regras para criar uma senha nova (cadastro, convite e redefinição) e como o app lida com tentativas de login. O app chama o Supabase Auth direto do navegador, então **quem manda é o Supabase**; a validação do app só orienta a pessoa e economiza uma ida ao servidor.

## Regras

- **Senha nova:** de 8 a 72 caracteres, com letra minúscula, letra maiúscula, número e símbolo, e fora da lista de senhas comuns (`Senha@123`, `Password1!`, nome do app, times de futebol etc.). A regra está em `src/lib/password-rules.ts` (funções puras, com testes) e entra nos formulários por `passwordSchema` (`src/lib/validations/auth.schema.ts`). Os conjuntos de caracteres espelham os do servidor: só letras ASCII contam como maiúscula e minúscula, e acento ou espaço não é símbolo.
- **Login não usa essas regras.** Quem já tem senha antiga e fraca precisa continuar entrando; só a senha nova é validada.
- **Lista de regras ao vivo** (`PasswordRequirements`) nos três formulários; mensagem final em uma frase ("A senha precisa de: ...").
- **Erros do servidor** (`src/lib/auth-errors.ts`): `weak_password`, `same_password` e limite de tentativas (429) viram frases em português.
- **72 caracteres:** o servidor guarda a senha com bcrypt, que só lê os 72 primeiros bytes.

## O que o servidor faz (conferido no banco de testes)

- Tamanho mínimo e classes de caracteres dependem da configuração do projeto no painel do Supabase (Authentication → Sign In / Providers → Email). **Conferir em cada projeto (testes e produção) depois de qualquer mudança**: no banco de testes, em 12/11/2026, o servidor aceitava senha só com minúsculas e senha comum, recusando apenas senha com menos de 6 ou mais de 72 caracteres. Sem a configuração no painel, a regra do app é contornável chamando a API direto.
- **Não há bloqueio da conta por tentativas erradas:** 8 senhas erradas seguidas e a certa entrou normalmente. A proteção é o limite por IP do Supabase (padrão de 30 pedidos de cadastro/entrada por 5 minutos e 150 de login por senha, segundo a documentação).
- Proteção contra senha vazada exige o plano Pro do Supabase.

## Por que assim

- A regra do app não fecha a porta sozinha (o navegador pode ser contornado), mas dá resposta imediata e é a mesma que o servidor deve aplicar.
- **Fora desta mudança:** CAPTCHA (Cloudflare Turnstile) em login, cadastro e "esqueci a senha" e autenticação em dois fatores, tratados em mudanças próprias.

## Onde está

`src/lib/password-rules.ts`, `src/lib/auth-errors.ts`, `src/components/shared/password-requirements.tsx`, `src/lib/validations/auth.schema.ts` e as telas em `src/app/(auth)/` (cadastro, definir-senha, redefinir-senha).
