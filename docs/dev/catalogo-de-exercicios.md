# Catálogo de exercícios

## O que é

Ao criar ou editar um **exercício de musculação**, o campo de nome sugere nomes de uma lista (152 exercícios em português, cada um com o grupo muscular). O nome do exercício continua **texto livre**: o catálogo só sugere, nunca obriga, e a tabela `exercises` não muda.

## Regras

- **Busca:** a partir de 2 letras, sem diferenciar acento nem maiúsculas, com todas as palavras digitadas presentes no nome. Primeiro os nomes que começam pelo texto, depois os que têm uma palavra começando por ele, depois os demais; até 8 sugestões. Toque ou setas e Enter escolhem.
- **Duas origens** na tabela `exercise_catalog`: `owner_id` nulo = nome do sistema (carregado pela migração, ninguém do cliente grava) e `owner_id` preenchido = nome guardado pela própria pessoa.
- **Guardar um nome novo:** ao digitar um nome que não está no catálogo, aparece "Guardar este nome no meu catálogo" (marcada por padrão), que pede o **grupo muscular**. Os nomes próprios aparecem como "meu" e têm um "x" para remover. Não há editar nome: apaga e cria de novo. Ao editar um exercício sem mexer no nome, não oferece guardar.
- **Quem usa:** profissional e Usuário Padrão (quem monta plano), no aluno e no modelo. Cota de **200 nomes próprios** por conta. Duplicados são evitados (sem diferenciar maiúsculas) e um nome próprio igual a um do sistema aparece uma vez só.
- **Acesso (RLS):** todos leem os nomes do sistema e os próprios; só quem monta plano grava e apaga os próprios; ninguém grava ou apaga nome do sistema nem de outra pessoa.

## Por que assim

- **Tabela, e não lista no código:** permite à pessoa guardar os próprios nomes. A lista do sistema vive na migração.
- **Os exercícios já criados não mudam:** o histórico de carga é por exercício do protocolo, e o catálogo não junta históricos. Ele só padroniza nomes daqui para frente e abre caminho para recursos que dependam de nomes consistentes (recorde por exercício, por exemplo).
- A lista é buscada só quando o diálogo abre, não a cada página. Se a busca falhar, a lista vem vazia e o campo segue como texto livre.

## Onde está

`src/lib/exercise-catalog.ts` (busca e limpeza de nomes, com testes), `src/lib/actions/exercise-catalog.ts`, `src/components/shared/exercise-name-field.tsx`. Migração `0033` (com `supabase/tests/exercise_catalog_probe.sql`).
