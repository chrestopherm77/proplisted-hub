
## Corrigir exibicao de respostas no modal de Lead Parcial

### Problema

O `form_data` salvo no banco contem apenas `{"intention":"BUY"}` sem o objeto `buy` (ou `sell`, `build`, `rent`). Isso acontece porque:

1. Os sub-objetos (`formData.buy`, `formData.sell`, etc.) sao `undefined` ate que o usuario preencha a primeira resposta do fluxo especifico via `updateFlowData`.
2. Quando `JSON.stringify` serializa `undefined`, a chave simplesmente desaparece do JSON.
3. O `formatFormDataToSections` verifica `normalizedFormData?.buy` e nao encontra nada, exibindo "Nenhuma resposta registrada ainda".

### Solucao

Alterar o `trackPartialLead` no `LeadFormWizard.tsx` para garantir que os sub-objetos sejam sempre salvos como objetos (mesmo que vazios), em vez de `undefined`:

```text
const formDataJson = {
  intention: formData.intention,
  sell: formData.sell || {},
  buy: formData.buy || {},
  build: formData.build || {},
  rent: formData.rent || {},
};
```

Isso garante que o JSON salvo sempre contenha as chaves dos fluxos. Quando o usuario seleciona "Comprar" e depois escolhe "Finalidade: Moradia", o `buy` ja existira no JSON e a resposta aparecera no modal.

### Alteracoes

| Arquivo | Acao |
|---|---|
| `src/components/leadform/LeadFormWizard.tsx` | Trocar `formData.sell` por `formData.sell \|\| {}` (e o mesmo para buy, build, rent) no objeto `formDataJson` dentro de `trackPartialLead` |

Alteracao de uma unica linha, sem impacto em outros componentes.
