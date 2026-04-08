

# Plano: Ajustes no "Procura seu Imóvel"

## Problemas identificados

1. **Menu de tipos** mostra 10 cards (Casa Rua, Casa Condomínio separados, cada rural separado). Deve mostrar 6 cards, com sub-seleção dentro do formulário.
2. **Falta campo "Estado"** em todos os tipos.
3. **Campo Valor** não tem máscara de moeda (R$ X.XXX,XX).
4. **Falta coluna "Ofertas"** na listagem — precisa de um contador no banco.
5. **Botão "Enviar Oferta" não aparece** no detalhe — dois problemas:
   - A condição `search.user_id !== user.id` esconde para o próprio dono, mas o problema real é que a RLS de `profiles` só permite ver o próprio perfil, então `ownerPhone` fica `null` para outros usuários, e o botão não funciona.
   - Deve sempre mostrar o botão (exceto para o dono), e resolver o acesso ao telefone.

---

## Mudanças

### 1. Migration SQL
- Adicionar coluna `state` (text, nullable) na tabela `property_searches`
- Adicionar coluna `offer_count` (integer, default 0) na tabela `property_searches`
- Criar uma policy RLS em `profiles` permitindo usuários autenticados lerem `phone` de qualquer perfil (necessário para o botão WhatsApp funcionar)

### 2. `NewPropertySearch.tsx` — Reformular seleção de tipos
- Mudar para 6 cards: Casa, Apartamento, Sala Comercial, Lote, Rural, Prédio Comercial
- Para **Casa**: adicionar campo Select "Tipo de Casa" (Rua / Condomínio) dentro do formulário
- Para **Rural**: adicionar campo Select "Tipo de Propriedade" (Fazenda / Sítio / Rancho / Chácara) dentro do formulário
- Adicionar campo **Estado** (campo aberto) em todos os tipos
- Adicionar máscara de moeda no campo **Valor (R$)** — ao digitar, formatar como `R$ 350.000`
- Salvar `state` no insert

### 3. `PropertySearches.tsx` — Adicionar coluna Ofertas
- Incluir `offer_count` na interface e exibir na listagem ao lado do preço/data

### 4. `PropertySearchDetail.tsx` — Corrigir botão + ofertas
- Sempre mostrar botão "Enviar Oferta" quando `user_id !== user.id` (já está assim, mas o phone não carrega por RLS)
- Incrementar `offer_count` ao clicar em "Enviar Oferta" (update no banco antes de abrir WhatsApp)
- Exibir campo "Estado" nos detalhes
- Remover condição que depende de `ownerPhone` estar preenchido para mostrar o botão — mostrar botão sempre, buscar phone via abordagem que funcione com RLS

### 5. RLS — Permitir leitura de phone de outros perfis
- Nova policy SELECT em `profiles` para authenticated: permitir ler apenas a coluna `phone` de qualquer perfil. Como RLS não filtra por coluna, criar uma view ou usar uma function `security definer` que retorna o phone dado um user_id.
- Abordagem escolhida: criar function `get_profile_phone(p_user_id uuid)` como `security definer` que retorna o phone. O frontend chama `.rpc('get_profile_phone', { p_user_id })` ao invés de query direta na profiles.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `ALTER TABLE` add `state`, `offer_count`; criar function `get_profile_phone` |
| `src/pages/NewPropertySearch.tsx` | 6 cards, sub-seleção Casa/Rural, campo Estado, máscara valor |
| `src/pages/PropertySearches.tsx` | Mostrar ofertas na listagem |
| `src/pages/PropertySearchDetail.tsx` | Exibir estado, incrementar offer_count, usar rpc para phone |

