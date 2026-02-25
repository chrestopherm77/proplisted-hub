
## Traduzir valores de forma de pagamento para portugues

### Problema

Os fluxos de Compra e Construcao usam valores em minusculo (`cash`, `financing`, `consortium`, `trade`, `combined`) para `paymentMethod`. O mapa `paymentMethodLabels` em `formatFormData.ts` so tem traducao para `financing` e `consortium` em minusculo — faltam `cash`, `trade` e `combined`.

### Solucao

Adicionar as traducoes faltantes no `paymentMethodLabels` em `src/lib/formatFormData.ts`:

```text
'cash': 'Recursos proprios',
'trade': 'Permuta',
'combined': 'Combinacao de formas',
```

### Alteracao

| Arquivo | Acao |
|---|---|
| `src/lib/formatFormData.ts` | Adicionar 3 entradas ao `paymentMethodLabels` (linhas ~124-125) |

Alteracao de 3 linhas, sem impacto em outros componentes.
