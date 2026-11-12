# Limite de tentativas de login

## O que é

Atraso progressivo nas tentativas de login por e-mail e senha: depois de 3 tentativas a pessoa espera 1 minuto, depois de mais 3 espera 5 minutos, e assim por diante. Não bloqueia a conta; só torna a força bruta (tentar senhas em série) lenta demais para valer a pena.

## Como funciona

1. O navegador chama `POST /api/auth/login` (`src/app/api/auth/login/route.ts`) em vez de falar direto com o Supabase. A rota confere o limite, tenta o login no Supabase e devolve a sessão por cookie (o mesmo cookie de antes). O login com Google não passa por aqui.
2. **Antes** de olhar a senha, a rota chama `login_throttle_begin` (migração `0035`). Se algum contador está em espera, responde `429` com `retryAfter` e **não confere a senha**, nem a certa: assim a espera não serve para testar senhas.
3. Se passou, a tentativa é contada **na hora** (e a linha do banco fica travada durante a conta), então pedidos em paralelo não furam o limite: só os 3 primeiros chegam ao Supabase.
4. Erro de e-mail ou senha: responde `401` e, se essa tentativa iniciou uma espera, manda o `retryAfter`. A tela mostra "Tente de novo em 1:00" com contagem regressiva e o botão desabilitado.
5. Login certo: zera os contadores do e-mail (não o do IP).

## Os três contadores (`src/lib/login-throttle.ts`)

| Contador | Conta | A cada | Esperas | Zera sem tentativas em |
|---|---|---|---|---|
| e-mail + IP | tentativas | 3 | 1 min, 5 min, 15 min, 1 h (repete 1 h) | 24 h |
| IP | erros, em qualquer e-mail | 20 | 1 min, 5 min, 15 min, 1 h | 1 h |
| e-mail (qualquer IP) | tentativas | 10 | 1 min, 5 min, 15 min (máximo) | 1 h |

- **E-mail + IP** é o principal (o exemplo do pedido: 3 erros, 1 min; mais 3, 5 min).
- **IP** pega quem testa muitos e-mails; o limite é alto porque várias pessoas dividem um IP (rede da academia).
- **E-mail de qualquer IP** pega o ataque vindo de vários IPs. É curto e com limite alto de propósito: qualquer pessoa pode errar a senha de outra de propósito, e isso não pode travar a conta dela por muito tempo.
- Tentativa barrada não conta nem prolonga a espera. E-mail que não existe é contado igual (não revela quem tem conta).
- Os números ficam num lugar só, em `LOGIN_THROTTLE_POLICY`; o banco só tem o mecanismo. Mudar os degraus não exige migração.

## Privacidade e dados

A tabela `login_throttle` guarda só **hashes** (HMAC-SHA256, com a chave de serviço como segredo) do e-mail e do IP, contagem e horário. Só o servidor (chave de serviço) lê e escreve. Linhas com mais de 1 dia e sem espera ativa são apagadas aos poucos.

## Limites e riscos

- **Vale para quem usa a tela do app.** Quem chama o Supabase direto com a chave pública (que está no navegador) escapa desta espera. Fechar isso é papel do CAPTCHA do Supabase, que também vale para chamadas diretas, e do limite por IP do próprio Supabase.
- **Se o contador falhar** (banco fora do ar, migração não rodada), a rota deixa o login seguir sem ele e registra o erro: as pessoas não ficam sem entrar. Por isso a ordem do deploy é migração, depois app.
- **Atrás de NAT** (academia, empresa) o contador de IP vê todos como um só; por isso o limite é de 20 erros.
- **Atacante pode atrasar a pessoa certa:** errar a senha dela 3 vezes a partir do mesmo IP só trava aquele IP; de IPs diferentes, só com 10 tentativas, por no máximo 15 minutos.
- O IP vem de `x-real-ip` / `x-forwarded-for`, preenchidos pela Vercel (o cliente não escolhe). Fora da Vercel (local), todos aparecem como "desconhecido".

## Onde está

`supabase/migrations/0035_login_throttle.sql` (+ rollback e `supabase/tests/login_throttle_probe.sql`), `src/lib/login-throttle.ts` (política, mensagens), `src/lib/login-throttle-keys.ts` (hash e IP, só servidor), `src/app/api/auth/login/route.ts`, `src/app/(auth)/login/page.tsx`.
