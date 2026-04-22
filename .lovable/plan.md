

## Corrigir erro do mapa — `render2 is not a function`

### Causa raiz

O projeto está em **React 18.3.1**, mas instalamos **`react-leaflet@^5.0.0`**, que exige **React 19**. Por isso o mapa quebra com `render2 is not a function` no preview e em produção (a tela de "Algo deu errado" intercepta antes de qualquer pixel aparecer no Portal).

### Correção

1. **Downgrade do react-leaflet** para a versão compatível com React 18:
   - `react-leaflet`: `^5.0.0` → `^4.2.1`
   - `leaflet` continua em `^1.9.4` (compatível).
   - `leaflet.markercluster` e `@types/*` continuam iguais.

2. **Sem mudanças de código** no `PropertyMap.tsx` — a API que usamos (`MapContainer`, `TileLayer`, `useMap`) é idêntica entre v4 e v5.

3. **Garantir que o container do mapa tem altura definida** já está OK (`height: 70vh, minHeight: 480`).

### Por que aparecia "Algo deu errado" e não aparecia em produção

- Em desenvolvimento o erro de runtime do react-leaflet 5 derruba a árvore React inteira → ErrorBoundary mostra "Algo deu errado".
- Em produção o build até gera, mas no momento de montar o `<MapContainer>` o mesmo erro acontece, mostrando a mesma tela.
- A correção é a mesma para os dois ambientes — basta usar a versão compatível.

### Arquivos alterados

- `package.json` — ajustar versão do `react-leaflet` para `^4.2.1`.

### O que NÃO muda

- `PropertyMap.tsx`, `PortalImoveis.tsx`, geocoding, edge function, migrações.
- Nenhum impacto em outras telas.

### Resultado

- Botão **Mapa** abre o mapa normalmente, sem tela de erro.
- Funciona idêntico em preview e produção.

