

# Plano: Corrigir flash de branding e aplicar cores do parceiro

## Problema 1: Flash de logo/nome antigo
O `Index.tsx` usa `loading` do `useAuth` mas ignora o `loading` do `usePartner`. Enquanto o parceiro carrega do banco, a página já renderiza com fallback "LeadBay". Solução: esperar o `loading` do partner também antes de renderizar.

## Problema 2: Cores não mudam no site do parceiro
O `PartnerContext` define `--partner-primary` e `--partner-secondary`, mas o Tailwind usa `--primary` (em HSL). As cores do parceiro nunca são aplicadas. Solução: converter hex para HSL e sobrescrever `--primary`, `--secondary`, `--ring`, `--primary-dark`, `--primary-light` e `--foreground` diretamente no document root.

## Implementação

### 1. `src/contexts/PartnerContext.tsx`
- Adicionar função `hexToHsl(hex)` para converter cor hex em componentes HSL
- No useEffect de cores, quando houver parceiro:
  - Converter `primary_color` e `secondary_color` para HSL
  - Sobrescrever `--primary`, `--primary-dark`, `--primary-light`, `--ring` com a primária
  - Sobrescrever `--secondary` com a secundária
  - Sobrescrever `--foreground` e `--card-foreground` para branco (`0 0% 100%`) se o parceiro tiver cores escuras
- No cleanup (else), remover todas essas propriedades

### 2. `src/pages/Index.tsx`
- Desestruturar `loading: partnerLoading` do `usePartner()`
- Na tela de loading, incluir condição `partnerLoading` junto com `loading` do auth
- Isso elimina o flash: a página só renderiza depois que o parceiro foi detectado

### Resultado
- No domínio do parceiro: cores roxas, texto branco, logo e nome do parceiro — sem flash
- No domínio principal: tudo permanece como está, sem nenhuma alteração visual

### Sobre as cores roxo claro + letras brancas
Essas cores são controladas pelos campos `primary_color` e `secondary_color` na tabela de parceiros. Para aplicar roxo claro com letras brancas, basta atualizar o registro do parceiro no admin com:
- `primary_color`: `#c084fc` (roxo claro)
- `secondary_color`: `#a855f7` (roxo médio)
O código vai detectar que a cor é escura o suficiente e automaticamente aplicar texto branco, ou podemos adicionar um campo `text_color` no parceiro para controle explícito.

### Arquivos afetados
- `src/contexts/PartnerContext.tsx` — hex→HSL + sobrescrever variáveis CSS do design system
- `src/pages/Index.tsx` — aguardar `partnerLoading` antes de renderizar

