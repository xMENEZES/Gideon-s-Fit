# Notificação push do fim do descanso

## O que é

Com a tela do celular bloqueada, a página é suspensa: o alarme do app (bipes e vibração) não dispara. A notificação push resolve isso: um servidor espera o fim do descanso e manda uma notificação ao aparelho, que o sistema mostra mesmo com a tela bloqueada.

## Como funciona

1. **Inscrição.** A pessoa liga o aviso pelo convite no topo do treino do dia ("Ativar aviso") ou em **Perfil > Informações da Conta**. O navegador pede permissão, entrega um endereço e chaves, e o app guarda em `push_subscriptions` pela função `register_push_subscription`. Uma pessoa pode ter até 10 aparelhos. Se outra pessoa entrar no mesmo aparelho, a inscrição passa para ela.
2. **Agendamento.** Ao tocar em "Iniciar" no cronômetro, o app chama `POST /api/rest-alarm` com os segundos e o nome do exercício. A rota só agenda se a pessoa tiver aparelho inscrito: grava um aviso pendente em `rest_alarms` (com o horário do fim) e responde na hora.
3. **Espera e envio.** Depois da resposta, `after()` mantém a função viva até o horário (`sendRestAlarm`, em `src/lib/push-server.ts`). Ao chegar, ela "reivindica" o aviso com um `update ... where status = 'pending'`: só quem muda de pendente para enviado envia. Aí manda o push para todos os aparelhos da pessoa. Aparelhos que respondem 404 ou 410 (desinstalados) saem da lista.
4. **Cancelamento.** Pausar, reiniciar ou iniciar de novo chama `DELETE /api/rest-alarm?id=...`, que muda o aviso para cancelado. Se o cancelamento chegar antes do horário, nada é enviado.
5. **No aparelho.** O service worker (`public/sw.js`) recebe o push. **Com o app à vista, não mostra a notificação** (o app já avisou sozinho). Com o app fechado, em segundo plano ou com a tela bloqueada, mostra "Descanso terminou" com o nome do exercício. Uma tag fixa faz um aviso novo substituir o anterior. Tocar na notificação abre o app.

## Regras e limites

- **Descanso de 5 a 240 segundos.** A função fica viva durante todo o descanso, e a rota tem tempo máximo de 300 s (Fluid Compute da Vercel). Descansos mais longos seguem só com o alerta do app aberto.
- **Teto de 5 avisos pendentes por conta** (gatilho `quota_rest_alarms`), porque cada um prende uma função do servidor. Avisos com mais de 1 dia são apagados.
- **TTL de 60 s e urgência alta.** Um aviso de descanso que chega com minutos de atraso não serve. O Android pode atrasar notificações com a economia de bateria.
- **O som é o da notificação do sistema**, não os 6 bipes do app. No iPhone só funciona com o app adicionado à tela inicial.
- Com a permissão **bloqueada** nas configurações do aparelho, o app mostra como liberar; não dá para pedir de novo por código.

## Chaves

Par de chaves VAPID (identifica o servidor perante o serviço de notificações do navegador): `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (pública, vai ao navegador), `VAPID_PRIVATE_KEY` (**segredo, só no servidor**) e `VAPID_SUBJECT` (o endereço do app). Há **dois pares**, um para testes (ambiente Preview e `.env.local`) e outro para produção. Se a chave privada de produção se perder, gera-se outro par e cada pessoa liga o aviso de novo. `scripts/push-keys-to-vercel.mjs` grava as chaves na Vercel sem mostrá-las na tela.

## Segurança

- A rota exige login, confere a origem do pedido e usa o cliente da própria pessoa: as regras de acesso valem (só vê, cria e cancela os próprios avisos).
- Endereços de inscrição são tratados como segredo da pessoa: só ela os lê e apaga. O conteúdo da notificação não tem dado pessoal além do nome do exercício.

## Onde está

`src/lib/rest-push.ts` (regras puras, com testes), `src/lib/push-server.ts`, `src/app/api/rest-alarm/route.ts`, `src/lib/actions/push.ts`, `src/lib/push-client.ts`, `push-opt-in.tsx`, `push-settings-card.tsx`, `rest-timer.tsx` e `public/sw.js`. Migração `0034` (com `supabase/tests/push_notifications_probe.sql`).
