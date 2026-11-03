## O que muda
<!-- Em poucas linhas, em português. O título do PR vira o título do commit na main. -->

## Por quê
<!-- O problema ou o pedido que motivou a mudança. -->

## Como foi validado
- [ ] CI verde (tipos, lint, testes e build)
- [ ] Preview local em 360 px, temas claro e escuro, sem estouro horizontal
- [ ] Roteiro de regressão (`docs/TESTES_DE_REGRESSAO.md`) sem pendência para o que esta mudança pode afetar
- [ ] Partes que só funcionam no celular testadas pelo dono (se houver)

## Banco de dados
- [ ] Sem migração
- [ ] Com migração `NNNN`: tem rollback e script de teste, rodou no banco de testes e só acrescenta (compatível com a `main` atual)

## Segurança e privacidade
- [ ] Sem segredos, e-mails pessoais ou dados reais nos arquivos
- [ ] Regras de acesso (RLS) e permissões revisadas, se a mudança tocar dados

## Documentação e versão
- [ ] README e `docs/` atualizados, se necessário
- [ ] `CHANGELOG.md` atualizado (seção "Não lançado")

## Depois do merge
O deploy é um passo separado e **só acontece com autorização do dono do projeto**. Se houver migração, ela roda em produção antes do deploy.
