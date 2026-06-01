## Objetivo

Diferenciar leads de **lançamentos / imóveis novos** no formulário de captura (residencial em `/LP`), refletir essa decisão nos leads e filtros, trocar o filtro de **Bairro** por **Zona**, e corrigir a opção em inglês no filtro **Objetivo**.

## 1. Nova árvore de perguntas (fluxo Comprar — residencial)

Inserir, **logo após** o passo "Qual tipo de imóvel" (quando for `HOUSE`/`APARTMENT`/`KITNET`), dois novos passos:

**Passo A — "Qual o tipo do imóvel?"** (sempre que for residencial)
- Novo
- Novo ou Usado
- Usado

**Passo B — "O imóvel que você busca está:"** (condicional: só se o tipo for `Novo` ou `Novo ou Usado`)
- Em Construção
- Pronto para morar
- Em construção ou pronto para morar

Quando o usuário escolher **Usado**, o Passo B é pulado.

O passo atual "O imóvel que você busca é (Pronto / Na planta / Aceito mais de uma opção)" hoje dentro de `BuyResidentialPrefsStep` será **removido de lá** e migrado para o Passo B acima, com os textos padronizados conforme o fluxograma.

### Modelo de dados

Em `src/components/leadform/types.ts → BuyFlowData`:
- Adicionar `propertyCondition?: 'NEW' | 'USED' | 'BOTH'`
- Manter `propertyReadyStatus?: 'READY' | 'UNDER_CONSTRUCTION' | 'BOTH'` (já existe), porém com rótulos atualizados ("Pronto para morar" / "Em Construção" / "Em construção ou pronto para morar").

## 2. Identificação clara no lead

No `LeadDetailsModal` e nas views de detalhe (`formatFormData.ts`) destacar:
- **Tipo do imóvel:** Novo / Usado / Ambos
- **Status da obra:** Em construção / Pronto para morar / Ambos

Quando o lead for **Novo** ou **Ambos**, exibir um **badge "Lançamento"** no card do lead em `Leads.tsx`, `MyLeads.tsx` e no header do `LeadDetailsModal`, para facilitar a identificação visual.

## 3. Novo filtro "Tipo de imóvel" no marketplace

Em `src/pages/Leads.tsx`:
- Adicionar filtro **Tipo de imóvel** com opções: Todos / Novo / Usado / Ambos.
- Extração via `formData.buy.propertyCondition` (com fallback: leads antigos sem essa info ficam como "Não informado" e passam por qualquer filtro exceto quando o usuário seleciona um valor específico).
- Incluir esse filtro também na função de **Salvar Alerta** e na exibição dos alertas existentes.

## 4. Filtro "Zona" no lugar de "Bairro"

Atualmente o formulário captura `neighborhood` mas não há campo de **zona**. Para suportar o filtro:

- Adicionar campo opcional `zone` em `BuyFlowData` e `RentFlowData`.
- No `BuyLocationBudgetStep` (e no equivalente de aluguel), adicionar um seletor "Zona" (Norte / Sul / Leste / Oeste / Centro / Outra) **acima** do campo Bairro, opcional.
- Em `Leads.tsx`: remover o filtro de Bairro e substituir por filtro **Zona**, alimentado por `formData.[intention].zone`. Leads sem zona aparecem em "Todas".
- Ajustar `lead_alerts` (chave `bairro` → `zone`) e migrar alertas existentes silenciosamente (alertas antigos com `bairro` ficam ignorados, sem quebrar).

## 5. Correção da opção em inglês no filtro "Objetivo"

Em `src/pages/Leads.tsx` o filtro lista valores de `intention` (`SELL/BUY/BUILD/RENT`) traduzidos via `objectiveLabels`. Vou:
- Garantir `extractObjective` normalize para upper-case e ignore valores nulos/vazios.
- Adicionar fallback: qualquer valor não mapeado é exibido como **"Outro"** em vez de mostrar a string em inglês.
- Conferir se a opção em inglês citada não vem de `purpose` (HOUSING/INVESTMENT/COMMERCIAL/TEMPORARY) sendo exibido por engano em algum lugar; se sim, aplicar `purposeLabels`.

## 6. Aplicação em `/LP`

O wizard usado pelas rotas `/LP` (e `/LP01`) é compartilhado (`LeadFormWizard.tsx`), então as mudanças dos itens 1 e 4 valem automaticamente para `/LP`.

## Arquivos a alterar

- `src/components/leadform/types.ts` — novos campos `propertyCondition`, `zone`.
- `src/components/leadform/steps/buy/BuyPropertyConditionStep.tsx` *(novo)* — Passo A.
- `src/components/leadform/steps/buy/BuyPropertyReadyStatusStep.tsx` *(novo)* — Passo B (extraído do prefs).
- `src/components/leadform/steps/buy/BuyResidentialPrefsStep.tsx` — remover o bloco "pronto/planta".
- `src/components/leadform/steps/buy/BuyLocationBudgetStep.tsx` — adicionar seletor de Zona.
- `src/components/leadform/LeadFormWizard.tsx` — registrar novos passos com visibilidade condicional.
- `src/pages/Leads.tsx` — filtro Tipo de imóvel, filtro Zona substituindo Bairro, badge "Lançamento", correção do label de Objetivo, ajustes em alertas.
- `src/pages/MyLeads.tsx` — badge "Lançamento" no card.
- `src/components/marketplace/LeadDetailsModal.tsx` — exibir Tipo do imóvel e Status da obra.
- `src/lib/formatFormData.ts` — rótulos `propertyConditionLabels`, ajustes em `propertyReadyStatus`, suporte a `zone`.

## Pontos a confirmar com você

1. **Zona** deve ser um seletor fixo (Norte/Sul/Leste/Oeste/Centro/Outra) ou texto livre?
2. O filtro **Tipo de imóvel** deve valer para todos os objetivos ou apenas para `Comprar`? (Sugiro só `Comprar`, mas confirma.)
3. Sobre a opção em inglês no filtro **Objetivo**: você lembra qual texto aparece (ex.: "BUY", "HOUSING", "Other")? Isso ajuda a apontar a origem exata.