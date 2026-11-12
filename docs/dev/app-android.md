# App Android (TWA)

## O que é

O app Android é o próprio site dentro de um **TWA** (Trusted Web Activity), gerado com o Bubblewrap. O projeto Android fica **fora deste repositório**, numa pasta separada do computador de quem constrói o app (id do pacote `app.gideonsfit.twa`). Mudanças do site chegam ao app sozinhas; só é preciso refazer o APK quando muda o **nome, o ícone, as cores, o endereço ou a versão** do app.

## Regras

- **O site declara quem pode abrir seus links em tela cheia** em `public/.well-known/assetlinks.json`, com a impressão digital SHA-256 do certificado que assinou o APK. Se a impressão digital do APK não estiver nesse arquivo, o app abre com barra de navegador (Custom Tab) em vez de tela cheia.
- **O arquivo aceita várias impressões digitais.** Ao trocar a chave de assinatura, a nova é **acrescentada** e a antiga fica, para o app já instalado continuar válido. O teste `src/lib/assetlinks.test.ts` confere o formato e que nenhuma se repete.
- **Ordem ao trocar a chave:** primeiro a impressão digital nova entra no `assetlinks.json` e o site é publicado; só depois o APK novo é instalado. Assinar com uma chave diferente muda a assinatura, então o app antigo precisa ser **desinstalado** antes de instalar o novo (o Android não atualiza por cima).
- **A versão do app** (`versionCode`) precisa subir a cada APK novo: o Android só aceita atualizar por cima de uma versão menor.
- **Nada de chave ou senha neste repositório.** O keystore (a chave de assinatura) e a senha ficam fora, com cópia de segurança em outro lugar: quem perde o keystore ou a senha nunca mais consegue atualizar o app com a mesma assinatura. A impressão digital, ao contrário, **não é segredo** (o site a publica).

## Como se refaz o APK (resumo)

1. Regenerar o projeto Android a partir do `twa-manifest.json` (baixa o ícone atual do site) com a versão nova.
2. Compilar `assembleRelease` e `bundleRelease` com o Gradle e alinhar o APK (`zipalign`).
3. Assinar o APK (`apksigner`) e o AAB (`jarsigner`) com o keystore, digitando a senha no próprio terminal.
4. Conferir que a impressão digital da assinatura está no `assetlinks.json` **publicado** no site antes de instalar.

## Limites e riscos

- O alerta de "app não verificado" (barra de navegador) é o sintoma de uma impressão digital que não está no `assetlinks.json`; o Chrome guarda o resultado da verificação, então depois de publicar o arquivo pode ser preciso reinstalar o app.
- O ícone é a mesma imagem para o uso normal e o "maskable"; em máscaras redondas as pontas do "G" podem ficar perto da borda.
- iOS não usa isto: o caminho recomendado é o PWA no Safari.

## Onde está

`public/.well-known/assetlinks.json`, `src/lib/assetlinks.test.ts` e o manifest em `src/app/manifest.ts`. O projeto Android (Bubblewrap), os scripts de assinatura e o keystore ficam fora do repositório.
