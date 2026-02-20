

## Adicionar Meta Pixel na pagina /lp

### O que sera feito

Adicionar o codigo do Meta Pixel (Facebook Pixel) no `index.html` para que ele carregue em todas as paginas do site, incluindo a pagina `/lp` onde os clientes fazem cadastro.

### Alteracao

| Arquivo | O que muda |
|---------|------------|
| `index.html` | Adicionar o script do Meta Pixel dentro do `<head>`, logo antes do fechamento `</head>` |

### Codigo que sera adicionado

O Meta Pixel com ID `1267609825231112` sera inserido no `<head>` do `index.html`. Isso inclui:
- O script principal do Facebook Pixel
- O evento `PageView` para rastrear visitas
- A tag `<noscript>` como fallback para navegadores sem JavaScript

### Observacao

Como o site e uma SPA (Single Page Application), o pixel sera carregado uma vez e o evento `PageView` sera disparado no carregamento inicial. Se futuramente quiser rastrear eventos especificos (como envio de formulario, clique em botao), podemos adicionar chamadas `fbq('track', 'Lead')` nos componentes React relevantes.

