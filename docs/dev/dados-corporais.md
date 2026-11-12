# Dados corporais (Perfil > Meus Dados)

## O que é

Cada pessoa pode informar a **data de nascimento**, a **altura** e o **peso** em **Perfil > Meus Dados**. O Perfil (antes "Minha conta") tem duas opções em lista: **Meus Dados** e **Informações da Conta** (aviso de descanso e exclusão da conta, o que a antiga tela já tinha). O administrador não treina e só tem "Informações da Conta". Os dados vão servir de base para o gerador de treino do Usuário Padrão (etapas seguintes; hoje só são guardados e mostrados).

## Regras

- **São dados de saúde** (LGPD, art. 11). Só são gravados com **consentimento específico**: na primeira vez a pessoa marca a caixa de aceite (o texto diz o que é guardado, para quê e quem pode ver) e o banco registra o instante em `consented_at`. O cliente não grava esse campo (permissão por coluna). **Apagar os dados** retira o consentimento; para informar de novo, é preciso aceitar outra vez. Apagar a conta apaga a linha (cascata).
- **Só maiores de 18 anos.** A data de nascimento é **obrigatória** (é ela que garante a idade) e precisa dar de 18 a 100 anos em "hoje" de Brasília. Altura (100 a 250 cm, inteiro) e peso (30 a 300 kg, uma casa decimal, aceita vírgula) são opcionais. As mesmas regras valem na tela (`src/lib/body-data.ts` e o schema), no servidor (a ação valida de novo) e no banco (restrições e o gatilho `body_data_guard`). O gerador de treino também será só para maiores de 18.
- **Quem lê:** a própria pessoa e, somente leitura, o **profissional do time em que ela é aluna** (aba **Dados** da ficha do aluno). Ao sair do time, o profissional deixa de ver (a política consulta o vínculo na hora). O plano próprio do profissional (linha "solo") não conta. Quem é Usuário Padrão e entrar num time passa a ser visto pelo profissional; o texto do aceite avisa isso. Ninguém além da pessoa altera ou apaga.
- **O peso guarda só o valor atual.** O histórico de peso fica para uma etapa futura. O IMC não aparece em nenhum lugar.
- `students.birth_date` (da `0002`) é um campo antigo, por vínculo com o profissional, sem uso na tela. **Não é reaproveitado**: os dados corporais são da pessoa, não do vínculo.

## Por que assim

- **Tabela própria** (`body_data`, uma linha por pessoa) em vez de colunas em `profiles`: no `profiles` o cliente só pode alterar o nome (permissão por coluna, migração `0020`), e isso não foi afrouxado.
- **Idade por gatilho, não por CHECK:** "hoje" muda, e uma restrição CHECK precisa ser imutável. A regra do 29/02 é a do Postgres (`data - interval 'N years'` cai em 28/02 em ano não bissexto) e está igual no código da tela, com testes.
- **Data de nascimento, não idade:** a idade se atualiza sozinha e dá para aplicar o limite de 18 anos com precisão.

## Limites e riscos

- A tela mostra a idade, mas ela não é gravada.
- Quem entra no time depois de aceitar fica visível ao profissional sem novo aviso além do texto do aceite.
- Contas de menores já existentes não são afetadas: simplesmente não conseguem salvar Meus Dados.

## Onde está

`supabase/migrations/0037_body_data.sql` (+ rollback e `supabase/tests/body_data_probe.sql`), `src/lib/body-data.ts` e `body-data.test.ts`, `src/lib/validations/body-data.schema.ts`, `src/lib/actions/body-data.ts`, `src/lib/data/body-data.ts`, `src/components/shared/body-data-form.tsx`, `src/app/(account)/conta/` (layout, `dados` e `informacoes`; `/conta` redireciona), aba em `src/app/(trainer)/dashboard/alunos/[studentId]/dados`, e as seções 2, 3, 4, 6 e 9 de `/privacidade`.
