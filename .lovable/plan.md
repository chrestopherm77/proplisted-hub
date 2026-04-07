

# Plano: "Procura seu Imóvel" — Painel de Buscas de Imóveis

## Resumo
Nova seção onde usuários cadastram o imóvel que procuram. Outros corretores veem a lista e podem enviar ofertas via WhatsApp direto para quem cadastrou.

---

## 1. Banco de Dados — Nova tabela `property_searches`

```sql
CREATE TABLE public.property_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_type text NOT NULL, -- CASA, APARTAMENTO, SALA_COMERCIAL, LOTE, RURAL, PREDIO_COMERCIAL
  operation_type text NOT NULL, -- VENDA, ALUGUEL
  city text NOT NULL,
  neighborhood text, -- Bairro/Condomínio
  zone text,
  size_m2 text,
  bedrooms text,
  value text, -- valor em texto formatado
  parking_spots text,
  observation text,
  house_type text, -- RUA, CONDOMINIO (só para CASA)
  rural_type text, -- FAZENDA, SITIO, RANCHO, CHACARA (só para RURAL)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**RLS**: Todos autenticados podem ver buscas ativas. Usuário pode inserir/editar/deletar as próprias. Admins podem tudo.

---

## 2. Novas Páginas

### `src/pages/PropertySearches.tsx` — Lista de Procuras
- Layout similar à imagem 1 (tabela com colunas: Bairro/Condomínio, Operação, Preço, Ofertas)
- Botão "+ Nova Procura" no topo
- Filtros: busca por texto, status (Ativas), tipo de imóvel
- Ícone por tipo de propriedade (casa, apartamento, etc.)
- Badge "Ativa" verde ao lado do tipo

### `src/pages/PropertySearchDetail.tsx` — Detalhe da Procura
- Layout similar à imagem 3 (card com Operação, Tipo, Cidade, Bairro, Tamanho, Valor, Data, Observação)
- Data de criação automática
- Botão "Enviar Oferta" que abre WhatsApp (`https://wa.me/55{phone}`) usando o telefone do perfil do criador
- Seção "Ofertas" (placeholder para futuro)

### `src/pages/NewPropertySearch.tsx` — Criar Nova Procura
- Tela de seleção de tipo (imagem 2): Casa de Rua, Casa em Condomínio, Apartamento, Sala Comercial, Lote, Fazenda, Sítio, Rancho, Chácara, Prédio Comercial
- Ao selecionar tipo, abre formulário com os campos específicos
- Botão "Adicionar" no final para salvar

---

## 3. Campos por Tipo de Imóvel

| Campo | Casa | Apto | Sala Com. | Lote | Rural | Prédio Com. |
|-------|------|------|-----------|------|-------|-------------|
| Cidade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Operação | Venda/Compra | ✅ | Venda/Aluguel | Venda/Aluguel | Venda/Aluguel | Venda/Aluguel |
| Tipo casa (Rua/Cond.) | ✅ | - | - | - | - | - |
| Bairro/Condomínio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Zona | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tamanho (m²) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Quartos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Valor (R$) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vagas garagem | ✅ | ✅ | ✅ | - | - | - |
| Tipo rural | - | - | - | - | ✅ | - |
| Observação | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 4. Navegação

- Novo link "Procura-Imob" no menu desktop (`Layout.tsx`) e mobile (`MobileMenu.tsx`)
- Rotas: `/property-searches`, `/property-searches/new`, `/property-searches/:id`
- Registrar em `App.tsx`

---

## 5. Lógica do WhatsApp

Ao clicar "Enviar Oferta", buscar o `phone` da tabela `profiles` pelo `user_id` da procura e abrir `https://wa.me/55{phone_limpo}` com mensagem pré-preenchida.

---

## Arquivos Afetados

| Arquivo | Mudança |
|---------|---------|
| **Migration SQL** | Criar tabela `property_searches` + RLS |
| `src/pages/PropertySearches.tsx` | **Novo** — Lista de procuras |
| `src/pages/PropertySearchDetail.tsx` | **Novo** — Detalhe + botão WhatsApp |
| `src/pages/NewPropertySearch.tsx` | **Novo** — Formulário de criação |
| `src/App.tsx` | Adicionar 3 rotas |
| `src/components/Layout.tsx` | Link "Procura-Imob" no menu desktop |
| `src/components/MobileMenu.tsx` | Link "Procura-Imob" no menu mobile |

