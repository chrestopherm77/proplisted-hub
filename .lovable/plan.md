

## Mover Meta Pixel para a pagina /lp apenas

### Problema atual

O Meta Pixel esta no `index.html`, o que causa erro de build (tag `<noscript>` com `<img>` no `<head>`) e carrega em todas as paginas. O usuario quer o pixel apenas na rota `/lp`.

### Solucao

| Arquivo | O que muda |
|---------|------------|
| `index.html` | Remover todo o bloco do Meta Pixel (script + noscript) |
| `src/pages/LeadForm.tsx` | Adicionar o Meta Pixel via `useEffect` -- carrega o script dinamicamente quando o componente monta e remove quando desmonta |

### Como vai funcionar

1. Remover o script do Meta Pixel e a tag `<noscript>` do `index.html`
2. No componente `LeadForm.tsx`, usar um `useEffect` que:
   - Injeta o script do Facebook Pixel no `<head>` da pagina
   - Inicializa o pixel com `fbq('init', '1267609825231112')`
   - Dispara o evento `fbq('track', 'PageView')`
   - Remove o script quando o usuario sair da pagina `/lp`

### Detalhe tecnico

```text
Usuario acessa /lp
    -> useEffect monta
    -> Script fbevents.js carregado
    -> fbq('init') + fbq('track', 'PageView')

Usuario sai de /lp
    -> useEffect cleanup
    -> Script removido do DOM
```

Assim o pixel so sera carregado e executado quando o usuario estiver na pagina `/lp`.

