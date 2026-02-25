

## Adicionar Meta Pixel na página /lp-obrigado

### O que muda

Adicionar o mesmo Meta Pixel (ID: 1267609825231112) na página `ThankYou.tsx` (`/lp-obrigado`), usando o mesmo padrão de injeção dinâmica já utilizado no `LeadForm.tsx`.

### Alteração

**Arquivo: `src/pages/ThankYou.tsx`**

- Importar `useEffect` do React
- Adicionar o mesmo bloco `useEffect` do `LeadForm.tsx` que injeta o script do Facebook Pixel, dispara `PageView`, e remove tudo no cleanup

O código do pixel será idêntico ao já existente na `/lp`, garantindo que o Meta Pixel rastreie também os acessos à página de obrigado — útil para medir conversões no Facebook Ads.

