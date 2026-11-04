# Política de segurança

Obrigado por ajudar a manter o Gideon's Fit seguro. O app guarda dados de treino e alimentação de pessoas reais, e levamos relatos de vulnerabilidade a sério.

## Versões com suporte

Só a versão em produção (<https://gideons-fit.vercel.app>), que corresponde à última versão marcada e à branch `main`. Correções de segurança entram nela; versões antigas não recebem correção separada.

## Como reportar uma vulnerabilidade

**Não abra uma issue pública nem divulgue o problema antes da correção.** Use o canal privado do GitHub:

1. Abra a aba **Security** do repositório.
2. Escolha **Report a vulnerability** (ou vá direto para <https://github.com/xMENEZES/Gideon-s-Fit/security/advisories/new>).
3. Descreva o problema.

Inclua, se puder:

- o que acontece e qual o impacto (por exemplo, "uma pessoa lê o treino de outra");
- os passos para reproduzir, com a página ou rota envolvida;
- a versão ou a data em que testou;
- provas (captura de tela, resposta da requisição), **sem dados reais de terceiros**.

## O que esperar

O projeto é mantido por uma pessoa, então os prazos são de melhor esforço:

- confirmação do recebimento em até **7 dias**;
- avaliação e correção priorizadas pela gravidade (o que expõe dados de outras contas vem antes);
- aviso quando a correção estiver em produção e, se você quiser, crédito pela descoberta.

## O que está no escopo

- o app em produção e o código deste repositório;
- autenticação, sessão e recuperação de senha;
- isolamento entre contas: uma pessoa ver, alterar ou apagar dados que não são dela (regras de acesso no banco, RLS);
- injeção, XSS, CSRF e falhas de validação de entrada;
- exposição de segredos ou de dados pessoais;
- cabeçalhos de segurança e política de conteúdo (CSP) ausentes ou fracos.

## O que está fora do escopo

- ataques de negação de serviço e testes de carga;
- engenharia social e phishing;
- falhas em serviços de terceiros (Supabase, Vercel, Google, GitHub): relate a eles;
- relatórios de scanner automático sem prova de impacto;
- ataques que exigem acesso físico ao aparelho ou aparelho já comprometido;
- navegadores ou sistemas desatualizados;
- criação de muitas contas ou envio de muitas requisições para testar limites.

## Ao testar

- Use **somente contas suas**. Não acesse, altere nem apague dados de outras pessoas.
- Se por acaso vir dados reais de outra pessoa, **pare e avise**; não os copie nem os divulgue.
- Não degrade o serviço para os demais usuários.

## Proteções já adotadas

Para dar contexto ao que você vai testar: regras de acesso em todas as tabelas do banco, política de conteúdo (CSP) em modo de bloqueio e demais cabeçalhos de segurança, validação de entrada no servidor e no banco, cotas de uso por conta, exclusão de conta pelo próprio usuário, validação automática (CI) em cada mudança e atualização de dependências monitorada.
