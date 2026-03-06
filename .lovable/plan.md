

## Adicionar evento `fbq('track', 'Lead')` nas páginas de obrigado

Ambas as páginas já possuem o Meta Pixel com `PageView`. Basta adicionar `fbq('track', 'Lead');` após o `fbq('track', 'PageView');` no script inline de cada arquivo.

### Arquivos alterados
- `src/pages/ThankYou.tsx` — adicionar `fbq('track', 'Lead');` na linha após `fbq('track','PageView');`
- `src/pages/ThankYou01.tsx` — mesma alteração

