## Objetivo

No mobile, a página "Primeiros Passos" deve ter o vídeo principal ocupando toda a largura da tela (como o player do YouTube mobile), e a playlist abaixo em formato de lista vertical compacta — também ocupando toda a largura, sem padding lateral do container.

## Mudanças em `src/pages/PrimeirosPassos.tsx`

1. **Container responsivo**
   - Remover `px-4` e `max-w-7xl` no mobile; aplicar apenas a partir de `md`.
   - Estrutura: `px-0 md:px-4` e `max-w-none md:max-w-7xl`.
   - Título e descrição ganham padding interno próprio (`px-4`) para não colarem na borda.

2. **Card do player principal (mobile full-bleed)**
   - Remover bordas arredondadas, borda e padding do `Card` no mobile: `rounded-none md:rounded-lg border-0 md:border shadow-none md:shadow-lg`.
   - `CardContent` com `p-0 md:p-4` para o vídeo encostar nas laterais.
   - O `VideoPlayer` (aspect-video) já se adapta — vai ocupar 100% da largura da tela.
   - Título/descrição do vídeo selecionado movidos para BAIXO do player no mobile (estilo YouTube), mantendo o título atual no topo apenas em desktop. Alternativa mais simples: manter o bloco de título atual mas adicionar `px-4` para respeitar margem em mobile.

3. **Playlist mobile estilo YouTube**
   - No mobile, a playlist vira uma lista vertical full-width logo abaixo do player.
   - `PlaylistCard`: remover `rounded-lg` e `border` no mobile, usar apenas `border-b` para separar itens (estilo lista YouTube). Em desktop, manter o card atual.
   - Aumentar levemente a thumb no mobile (`w-32` ou `w-36`) para ficar mais legível.
   - Manter o scroll interno apenas em desktop (`lg:max-h-[560px] lg:overflow-y-auto`); no mobile, lista flui na página.

4. **Botões de ação inferiores**
   - Adicionar `px-4` no wrapper para não colarem nas bordas no mobile.

## Resultado esperado

- Mobile: player full-width sem margens, playlist em lista contínua abaixo (estilo app YouTube).
- Desktop: layout atual (grid 2/1 com player + sidebar) preservado.

## Arquivos afetados

- `src/pages/PrimeirosPassos.tsx` (apenas classes Tailwind; sem mudança de lógica)
