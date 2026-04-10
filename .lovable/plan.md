

# Plano: Reformular "Buscar Oferta" — Cards detalhados, Modal, Headline e "Minhas Ofertas"

## Resumo
Reformular a página PropertySearches com cards mais ricos (headline + descrição em texto corrido), subtítulo, botões "Ver detalhes" e "Enviar Oferta" nos cards, modal de detalhes ao invés de navegar para outra página, e sidebar "Minhas Ofertas" à direita.

---

## 1. Banco de Dados

### Nova coluna `headline` na tabela `property_searches`
```sql
ALTER TABLE public.property_searches ADD COLUMN headline text;
```

### Nova tabela `property_search_offers` para rastrear ofertas enviadas
```sql
CREATE TABLE public.property_search_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id uuid NOT NULL REFERENCES public.property_searches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(search_id, user_id)
);
ALTER TABLE public.property_search_offers ENABLE ROW LEVEL SECURITY;
-- Authenticated can insert own, select own
```

Isso permite listar as ofertas que o usuário logado já enviou para exibir na sidebar "Minhas Ofertas".

---

## 2. `NewPropertySearch.tsx` — Novo campo "Headline"
- Adicionar campo de texto "Headline" (descrição curta da procura, ex: "Procura por: Casa para compra") no formulário, junto ao campo de Título
- Salvar como `headline` no insert

---

## 3. `PropertySearches.tsx` — Reformulação completa

### Layout: 2 colunas (conteúdo principal + sidebar)
- **Esquerda (70%)**: título "Buscar Oferta" + subtítulo "Veja pessoas procurando imóveis agora" + filtros + lista de cards
- **Direita (30%)**: seção "Minhas Ofertas" com cards resumidos das ofertas que o usuário enviou

### Cards da listagem (inspirado na imagem):
- **Headline** como texto principal do card (ex: "Procura por: Casa para compra")
- **Valor** à direita, formatado R$
- **Região** (cidade/estado) abaixo do valor
- **Badges**: tipo (colorido) + operação
- **Texto corrido** abaixo da headline: composição das informações (bairro, quartos, tamanho, vagas, observação)
- **Botões no rodapé do card**: "Ver detalhes" (abre modal) e "Enviar Oferta" (mesma lógica WhatsApp + incremento)
- Remover a navegação para `/property-searches/:id` ao clicar no card

### Modal "Ver detalhes"
- Reutilizar o conteúdo do `PropertySearchDetail` como um Dialog/modal dentro da página
- Exibir todas as informações detalhadas + botão "Enviar Oferta" dentro do modal

### Sidebar "Minhas Ofertas"
- Buscar da tabela `property_search_offers` as ofertas do usuário logado, com join nos dados da procura
- Exibir cards pequenos: tipo do imóvel, localização, valor
- Se não houver ofertas: texto "Nenhuma oferta enviada"

---

## 4. `PropertySearchDetail.tsx` — Enviar Oferta registra na tabela
- Além de incrementar `offer_count`, inserir registro em `property_search_offers`

---

## Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | `headline` column + `property_search_offers` table |
| `src/pages/NewPropertySearch.tsx` | Campo "Headline" no formulário |
| `src/pages/PropertySearches.tsx` | Layout 2 colunas, cards detalhados, modal, sidebar "Minhas Ofertas" |
| `src/pages/PropertySearchDetail.tsx` | Registrar oferta na nova tabela |

