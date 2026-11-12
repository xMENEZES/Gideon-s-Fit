# CAPTCHA (Cloudflare Turnstile)

## O que é

Verificação de que quem usa o login, o cadastro e o "esqueci a senha" não é um robô. É o que fecha a brecha do limite de tentativas ([limite-de-tentativas-de-login](limite-de-tentativas-de-login.md)): com o CAPTCHA ligado **no Supabase**, até quem chama a API direto com a chave pública precisa de um token válido a cada pedido.

## Como funciona

1. O widget do Turnstile (`src/components/shared/turnstile-widget.tsx`) carrega o script da Cloudflare, gera um token e o formulário o envia como `captchaToken` (`signUp`, `resetPasswordForEmail`) ou no corpo de `POST /api/auth/login`, que o repassa a `signInWithPassword`.
2. O Supabase confere o token com a Cloudflare (usa a chave **secreta** guardada no painel dele). Token inválido volta como erro `captcha_failed`, mostrado como "Não foi possível confirmar a verificação de segurança".
3. O token **vale uma vez só**: depois de cada envio o widget gera outro, e o botão fica desabilitado até o token chegar.
4. O widget usa `appearance: interaction-only`: normalmente é invisível e só aparece se a Cloudflare precisar de uma interação.
5. O login com Google não usa CAPTCHA (o Supabase não o aplica ao OAuth). As telas de definir e redefinir senha também não: já exigem sessão.

## Regras

- **Sem `NEXT_PUBLIC_TURNSTILE_SITE_KEY` o widget não aparece e nada muda.** É isso que permite o código ir ao ar antes de o CAPTCHA ser ligado no Supabase. Com a chave no app e o CAPTCHA desligado no Supabase, o token é simplesmente ignorado.
- **Com a chave, `/api/auth/login` exige o token**: sem ele responde 400 `captcha` antes de contar a tentativa. Token recusado pelo Supabase também não conta contra o IP.
- **Ordem para ligar (cada ambiente):** 1) `NEXT_PUBLIC_TURNSTILE_SITE_KEY` na Vercel (a variável `NEXT_PUBLIC_` é embutida no build, então exige novo deploy); 2) código no ar; 3) só então ligar o CAPTCHA no Supabase (Authentication → Attack Protection, provedor Turnstile, chave secreta). Ligar no Supabase antes do app ter o widget impede todo mundo de entrar. **Para desligar em emergência:** desmarcar o CAPTCHA no Supabase (o app segue funcionando).
- **Chaves de teste da Cloudflare** (documentadas por ela) servem para o banco de testes e o ambiente local: site `1x00000000000000000000AA` (sempre aprova) e secreta `1x0000000000000000000000000000000AA`. Há também a de sempre barrar (`2x00000000000000000000AB`) para testar o erro. Produção usa um widget real, só com o domínio de produção.
- A chave do site é pública (vai ao navegador). **A secreta fica só no painel do Supabase**, nunca no código nem na Vercel.

## Limites e riscos

- O Turnstile depende do script de `challenges.cloudflare.com`: bloqueadores de anúncio ou rede restrita podem impedir; a tela avisa e o botão fica desabilitado. A CSP foi aberta só para esse domínio (script, iframe e conexão).
- Token vem da Cloudflare, então a verificação acontece no Supabase; o app **não** valida o token por conta própria (ele valeria uma vez só e o Supabase o recusaria depois).
- Um robô que mande um token qualquer ao nosso `/api/auth/login` ainda conta tentativas contra o e-mail e o IP dele antes de o Supabase recusar o token.

## Onde está

`src/components/shared/turnstile-widget.tsx` (widget e `useCaptcha`), `src/app/api/auth/login/route.ts`, telas em `src/app/(auth)/` (login, cadastro, esqueci-senha), `src/lib/auth-errors.ts` (mensagem), CSP em `next.config.ts`.
