

## Painel Admin — editar TODAS as informações do lead + Unificação visível em Leads Disponíveis

### O que muda

**1. Edição completa do lead no admin (`/admin` → Leads → Editar)**

O modal de edição hoje só permite alterar 5 campos básicos. Vou expandir para um modal maior, com abas, que permite editar **tudo** que o lead preencheu no formulário — separado por preferência quando o lead foi unificado.

Estrutura do modal "Editar Lead":

```text
┌─ Editar Lead: Helena Paulino ─────────────────────┐
│                                                    │
│ [ Dados básicos ] [ Preferência 1 ] [ Preferência 2 ]
│                                                    │
│  Nome:        [____________________]              │
│  Telefone:    [____________________]              │
│  Email:       [____________________]              │
│  Créditos:    [____________________]              │
│  Máx. vendas: [____________________]              │
│  Status:      [Ativo ▼]  [Promoção ☐] [Esgotado ☐]│
│                                                    │
│  Descrição (texto livre, regenerada ao salvar):   │
│  [_______________________________________]        │
│                                                    │
└─ Aba "Preferência 1" (intenção: COMPRAR) ────────┐
│  Intenção:    [Comprar ▼]                         │
│  UF:          [SP]      Cidade: [Ribeirão Preto]  │
│  Bairro:      [comercial residencial palmares]    │
│  Tipo imóvel: [Apartamento ▼]                     │
│  Quartos:     [2]   Banheiros: [1]                │
│  Vagas:       [1]   Finalidade: [Moradia ▼]       │
│  Orçamento:   [R$ 270.000,00]                     │
│  Pagamento:   [Financiamento ▼]                   │
│  Prazo:       [30 dias ▼]                         │
│  + outros campos do flow BUY...                   │
│                                                    │
│  [🗑 Excluir esta preferência]                    │
│                                                    │
│ [Cancelar]                       [Salvar tudo]    │
└────────────────────────────────────────────────────┘
```

Como funciona:
- O modal lê `form_data` do lead e identifica quantas "preferências" existem (1 flow = 1 preferência; flow em array = N preferências; múltiplos flows BUY+RENT = N preferências). Cria uma aba por preferência.
- Cada aba mostra **todos os campos** daquela preferência usando os mesmos rótulos PT-BR já existentes em `formatFormData.ts` (Tipo de imóvel, Quartos, Vagas, Bairro, Cidade, Orçamento, Forma de pagamento, Prazo, etc.). Campos selecionáveis viram `<Select>`, texto vira `<Input>`, booleanos viram `<Switch>`.
- Botão "Excluir esta preferência" remove aquela entrada do `form_data` e da `description`.
- Ao salvar: o sistema regrava `form_data` (mantendo a estrutura mesclada) e **regenera a `description`** no formato `Preferência 1: ... \n\n Preferência 2: ...` automaticamente — assim o card no marketplace fica consistente.

**2. Unificação visível em "Leads Disponíveis" (marketplace)**

Hoje, quando duas pessoas com o mesmo telefone preenchem o formulário, o backend já mescla em um único lead (`merge-or-create-lead`), mas o modal de detalhes mostra os dados embaralhados, sem deixar claro que são duas intenções diferentes.

Mudanças no modal de detalhes do marketplace (`LeadDetailsModal`):

```text
┌─ Lead #301F3972 ────────────────── 4/5 disponíveis ┐
│                                                     │
│ Interesse: Comprar e Alugar                        │
│ Região: Ribeirão Preto/SP                          │
│                                                     │
│ ┌─ 🎯 Preferência 1 — Comprar imóvel ────────────┐│
│ │ 📍 Localização                                  ││
│ │   Cidade: Ribeirão Preto/SP                    ││
│ │   Bairro: comercial residencial palmares       ││
│ │ 🏠 Imóvel                                       ││
│ │   Tipo: Apartamento · 2 quartos · 1 vaga       ││
│ │   Finalidade: Moradia                          ││
│ │ 💰 Financeiro                                   ││
│ │   Orçamento: até R$ 270.000                    ││
│ │   Pagamento: Financiamento                     ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│ ┌─ 🎯 Preferência 2 — Alugar ────────────────────┐│
│ │ 📍 Localização                                  ││
│ │   Cidade: Ribeirão Preto/SP                    ││
│ │   Bairro: jardim são luiz                      ││
│ │ 🏠 Imóvel                                       ││
│ │   Tipo: Apartamento · 2 quartos                ││
│ │ 💰 Financeiro                                   ││
│ │   Aluguel máx: R$ 2.000                        ││
│ │   Garantia: A definir                          ││
│ └─────────────────────────────────────────────────┘│
│                                                     │
│         [💎 25 créditos]    [Comprar com Créditos] │
└─────────────────────────────────────────────────────┘
```

Como funciona:
- Crio uma função `splitFormDataIntoPreferences(formData)` que detecta as N preferências dentro do `form_data` (cobre os 3 casos: flow único, flow em array, múltiplos flows).
- Cada preferência é renderizada num bloco visual destacado com cabeçalho "🎯 Preferência N — {intenção}" e usa o `formatFormDataToSections` já existente para listar os detalhes (sem reescrever lógica de rótulos).
- Quando há só 1 preferência, o título "Preferência 1" não aparece (mantém a UI limpa de hoje).
- O mesmo bloco de preferências também aparece no `PurchasedLeadModal` (após a compra) e no `LeadCrmDialog` (Meus Leads), pra manter consistência.

**3. Coerência com a unificação atual**

A função `merge-or-create-lead` já faz o merge correto. Vou apenas garantir que ela sempre escreva o `form_data` de forma estruturada para o split funcionar — quando a mesma intenção é repetida, vira array `rent: [{...}, {...}]`; quando intenções diferentes, vira `buy: {...}, rent: {...}` com `intention: ['BUY', 'RENT']`. Isso já acontece, só vou validar e ajustar se necessário.

### Detalhes técnicos

- `LeadsManagement.tsx`: trocar o Dialog de edição por um componente novo `LeadEditDialog.tsx` com tabs (`@/components/ui/tabs`). Reutilizar todos os enums/rótulos de `formatFormData.ts` para gerar selects.
- Novo helper `src/lib/leadPreferences.ts` com `splitFormDataIntoPreferences()` — usado tanto no admin quanto nos modais do marketplace/CRM.
- `LeadDetailsModal.tsx`, `PurchasedLeadModal.tsx`, `LeadCrmDialog.tsx`: trocar a renderização única de seções por um loop sobre as preferências retornadas pelo helper.
- Ao salvar no admin, regenerar `description` com prefixos `Preferência N:` no mesmo padrão que o `merge-or-create-lead` já gera, para manter compatibilidade.
- Sem migração de banco. Não mexe em RLS, edge functions de pagamento, nem na lógica de `purchase`. Apenas leitura/escrita do campo `form_data` (jsonb) e `description` (text) na tabela `leads`, que já têm policy de admin.

### Resultado

- No admin, você abre qualquer lead e edita **qualquer campo** que o usuário preencheu — incluindo cada preferência separadamente, com selects nos campos certos (não mais texto cru).
- Em "Leads Disponíveis", quando alguém faz 2 cadastros com o mesmo número, o card mostra claramente "Preferência 1" e "Preferência 2", cada uma com suas informações organizadas — exatamente como você pediu.
- Cards permanecem unificados (1 lead por telefone), o que mantém a economia de créditos pra quem compra.

