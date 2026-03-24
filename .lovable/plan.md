

## Correção: Tela branca quando navegador traduz automaticamente

### Problema

Quando o Google Chrome (ou outro navegador) tenta traduzir a página automaticamente, ele modifica nós de texto diretamente no DOM. O React espera controlar o DOM inteiro e, ao detectar que os nós foram alterados externamente, lança um erro e a tela fica branca (crash do React).

### Solução

Duas mudanças simples que resolvem o problema:

**1. `index.html` — Desabilitar tradução automática**

Adicionar `class="notranslate"` e `translate="no"` no `<html>`, além da meta tag do Google:
```html
<html lang="pt-BR" class="notranslate" translate="no">
  <head>
    <meta name="google" content="notranslate" />
```
Isso instrui navegadores a não traduzir a página automaticamente (já que o conteúdo já está em português).

Também corrigir o `lang="en"` para `lang="pt-BR"` — isso já reduz a chance do navegador oferecer tradução.

**2. `src/main.tsx` — Error Boundary para evitar tela branca**

Adicionar um Error Boundary no nível raiz que captura o crash do React e mostra uma mensagem amigável em vez de tela branca, com botão para recarregar a página.

### Resultado
- Navegadores não tentarão traduzir automaticamente (conteúdo já é PT-BR)
- Se por algum motivo o React crashar, o Error Boundary exibe mensagem em vez de tela branca

