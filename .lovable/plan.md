## O que vai mudar no modelo "Agnus Premium"

### 1. Seção "Sobre nós" (corrigir foto cortada e duplicação no final)

Hoje a imagem do "Sobre" aparece duas vezes:
- uma vez na seção "Sobre nós" (ok, mas em formato esticado);
- outra vez no rodapé, em uma faixa larga de 288px de altura cobrindo a foto inteira (é essa a "imagem cortada" que aparece no fim da página).

Ajustes:
- **Remover a faixa duplicada do rodapé** (`Footer.tsx`): tirar o bloco que mostra `about_image_url`/`about_text` antes da grade do footer. Sobre fica só na seção "Sobre nós".
- **Melhorar o layout da seção "Sobre nós"** (`Template1.tsx`):
  - Card com fundo claro, padding generoso, em duas colunas (foto à esquerda, texto à direita) no desktop, empilhado no mobile.
  - Foto com `aspect-[4/3]`, `object-cover`, `object-position: center top` e altura máxima controlada (≈ 380px), bordas arredondadas e sombra suave — assim o rosto não é cortado pela metade.
  - Título e texto com tipografia coerente com o resto do site.

### 2. Menu superior configurável (ocultar item / definir destino)

Hoje os itens do menu (Início, Sobre, Contato, Financie, Negocie seu Imóvel) sempre aparecem e sempre rolam para a seção interna correspondente.

Ajustes no admin (`BrokerPortalsManagement.tsx`, aba "Avançado"):
- Para cada item do menu, três campos:
  - **Rótulo** (já existe).
  - **Visível** (switch on/off) — permite ocultar um item.
  - **Destino**: select com opções
    - "Seção da página" (padrão; rola até `home`/`sobre`/`contato`/`financie`/`negociar`);
    - "Link externo" (libera campo de URL — abre em nova aba);
    - "Outra seção da página" (libera select com as seções existentes).
- O mesmo bloco é reutilizado para os links no rodapé.

Estrutura salva em `branding.menu_items`:

```text
menu_items: [
  { id: 'home',     label: 'Início',           visible: true,  mode: 'section', target: 'home' },
  { id: 'sobre',    label: 'Sobre',            visible: true,  mode: 'section', target: 'sobre' },
  { id: 'contato',  label: 'Contato',          visible: true,  mode: 'section', target: 'contato' },
  { id: 'financie', label: 'Financie',         visible: false, mode: 'url',     target: 'https://...' },
  { id: 'negociar', label: 'Negocie seu Imóvel', visible: true, mode: 'section', target: 'negociar' },
]
```

Mantém compatibilidade com `branding.menu_labels` antigo (lê labels antigas se `menu_items` não existir ainda).

Header e Footer (`Header.tsx`, `Footer.tsx`):
- Renderizam apenas itens com `visible !== false`.
- `mode: 'section'` → chama `onNav(target)` (rolagem suave atual).
- `mode: 'url'`  → renderiza `<a href target="_blank" rel="noreferrer">`.

### 3. Transição "esfumaçada" entre header e hero

A linha dura entre o cabeçalho preto e a foto do hero será trocada por uma sobreposição com gradiente suave:

- No `Header.tsx`: remover a `border-b border-white/5` e adicionar uma sombra/gradiente inferior (`shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]` + uma faixa absoluta com `bg-gradient-to-b from-black/80 to-transparent`).
- No `Hero.tsx`: adicionar no topo da seção um overlay absoluto `from-[var(--bp-bg)]/90 via-[var(--bp-bg)]/40 to-transparent` (≈ 120px) que esfuma a borda superior contra o header, sem alterar o filtro escuro central.

Resultado: o header parece "derreter" sobre a foto, sem linha visível.

## Arquivos alterados

- `src/components/broker-portal/templates/template1/Template1.tsx` — refazer card "Sobre nós".
- `src/components/broker-portal/templates/template1/Footer.tsx` — remover faixa duplicada de `about_image_url`/`about_text`; usar `menu_items`.
- `src/components/broker-portal/templates/template1/Header.tsx` — usar `menu_items`, esfumaçar borda inferior.
- `src/components/broker-portal/templates/template1/Hero.tsx` — gradiente superior esfumaçado.
- `src/components/admin/BrokerPortalsManagement.tsx` — editor de `menu_items` (visível + destino + URL) na aba Avançado; default migra `menu_labels` para `menu_items` ao abrir.

Nenhuma mudança no banco de dados (tudo dentro do JSON `branding`).
