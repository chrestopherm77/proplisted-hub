

## Inversao da Ordem: Contato antes do Formulario

### O que muda

Mover a etapa de Contato (nome, telefone, verificacao WhatsApp, e-mail, termos LGPD) da ultima posicao para a segunda posicao, logo apos a escolha da intencao. O usuario primeiro escolhe a intencao, depois preenche dados de contato e valida o WhatsApp, e so entao preenche o formulario especifico. A ultima etapa do fluxo (ex: prazo/deadline) passa a ser a etapa de envio.

### Alteracao

| Arquivo | O que muda |
|---|---|
| `src/components/leadform/LeadFormWizard.tsx` | Mover a entrada `contact` do final do array `allSteps` para a posicao 2 (indice 1, logo apos `intention`) |

### Detalhes tecnicos

No array `allSteps` em `LeadFormWizard.tsx`, a entrada com `id: 'contact'` esta atualmente no final (apos todos os fluxos). Sera movida para logo apos a entrada `id: 'intention'`.

A condicao de visibilidade do contact (`isVisible: (data) => !!data.intention`) ja garante que so aparece apos escolher a intencao.

A logica de submit (`isLastStep`) ja funciona automaticamente pois depende do indice relativo ao array de steps visiveis - a ultima etapa visivel do fluxo (prazo, garantia, etc.) passara a ter o botao "Enviar".

Nenhuma outra alteracao e necessaria pois toda a logica de navegacao e submit ja e baseada em posicao relativa no array filtrado.

