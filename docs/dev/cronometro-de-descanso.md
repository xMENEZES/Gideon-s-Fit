# Cronômetro de descanso

## O que é

Cada exercício de musculação tem um descanso (`exercises.rest_seconds`, de 5 a 3600 segundos, padrão 60) definido pelo profissional. Quem treina vê um cronômetro no cartão do exercício, com Iniciar, Pausar e Reiniciar. No fim da contagem o app avisa por **som e vibração** e, com a tela bloqueada, por notificação push.

## Regras

- **A contagem vem do relógio.** O cronômetro guarda o instante em que termina e recalcula a cada 250 ms, em vez de contar "um segundo por tick". Assim não atrasa quando o navegador reduz a frequência dos temporizadores com a tela em segundo plano.
- **Som e vibração.** São 6 bipes alternando dois tons e 6 pulsos de vibração, cerca de 3 segundos no total. O navegador só libera o áudio depois de um toque, então o contexto de áudio nasce no "Iniciar" e é usado no fim. A vibração depende do aparelho (não existe no iPhone).
- **Sem alerta visual.** Houve um alerta de tela piscando (v1.2.0), retirado depois que a notificação push provou funcionar no celular. Com a tela ligada, o aviso é só o som e a vibração.

## Limites

- **O alarme do app não dispara com a tela bloqueada**: a página é suspensa e o navegador bloqueia a vibração de páginas em segundo plano. Manter a tela acesa durante a contagem (Wake Lock) foi descartado por decisão do dono. Para o celular bloqueado existe a **notificação push** (ver [notificacao-push](notificacao-push.md)): ao iniciar o cronômetro o app agenda o aviso no servidor, e pausar ou reiniciar o cancela.
- O som do app é sempre o dos 6 bipes; a notificação push usa o som padrão do sistema.

## Onde está

`src/components/shared/rest-timer.tsx`. O aviso por push está descrito em [notificacao-push](notificacao-push.md).
