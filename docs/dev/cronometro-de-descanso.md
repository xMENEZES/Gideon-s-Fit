# Cronômetro de descanso

## O que é

Cada exercício de musculação tem um descanso (`exercises.rest_seconds`, de 5 a 3600 segundos, padrão 60) definido pelo profissional. Quem treina vê um cronômetro no cartão do exercício, com Iniciar, Pausar e Reiniciar. No fim da contagem o app avisa por **som, vibração e tela piscando**.

## Regras

- **A contagem vem do relógio.** O cronômetro guarda o instante em que termina e recalcula a cada 250 ms, em vez de contar "um segundo por tick". Assim não atrasa quando o navegador reduz a frequência dos temporizadores com a tela em segundo plano.
- **Som e vibração.** São 6 bipes alternando dois tons e 6 pulsos de vibração, cerca de 3 segundos no total. O navegador só libera o áudio depois de um toque, então o contexto de áudio nasce no "Iniciar" e é usado no fim. A vibração depende do aparelho (não existe no iPhone).
- **Alerta de tela piscando.** Uma camada roxa da marca (40% de opacidade) cobre a tela e pisca no ritmo dos bipes: 6 piscadas, 2 por segundo, abaixo do limite de 3 por segundo recomendado para quem tem sensibilidade a luz intermitente (WCAG 2.3.1). A camada não captura toques. Com **"reduzir movimento"** ligado no aparelho, a tela não pisca: o cronômetro só ganha um contorno por alguns segundos.
- Reiniciar ou iniciar de novo no meio do alerta interrompe a piscada.

## Limites

- **O alarme do app não dispara com a tela bloqueada**: a página é suspensa, não há tela para piscar e o navegador bloqueia a vibração de páginas em segundo plano. Manter a tela acesa durante a contagem (Wake Lock) foi descartado por decisão do dono. Para o celular bloqueado existe a **notificação push** (ver [notificacao-push](notificacao-push.md)): ao iniciar o cronômetro o app agenda o aviso no servidor, e pausar ou reiniciar o cancela.
- O som do app é sempre o dos 6 bipes; a notificação push usa o som padrão do sistema.

## Onde está

`src/components/shared/rest-timer.tsx` e `src/lib/rest-alert.ts` (calendário das piscadas, com testes).
