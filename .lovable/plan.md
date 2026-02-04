

## Plano: Notificação por Email de Novo Lead + Carrinho Fixo Lateral

### Resumo

Este plano implementa duas funcionalidades:

1. **Sistema de Notificação por Email**: Quando um lead é cadastrado no `/lp`, enviar email para todos os usuários cadastrados na mesma **cidade** informando sobre o novo lead (sem dados pessoais)
2. **Carrinho Flutuante Lateral**: Adicionar um botão fixo "Meu Carrinho" na lateral da tela para maior visibilidade

---

## Parte 1: Sistema de Notificação por Email

### Pré-requisitos de Banco de Dados

A tabela `profiles` precisa armazenar a cidade dos usuários para fazer o matching. Será necessário adicionar os campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `address_uf` | `TEXT` | Estado (ex: "MG") |
| `address_city` | `TEXT` | Cidade (ex: "Belo Horizonte") |
| `address_neighborhood` | `TEXT` | Bairro (ex: "Savassi") |

---

### Fluxo da Notificação

```text
1. Lead preenche formulário em /lp
   ↓
2. LeadFormWizard salva o lead no banco
   ↓
3. Frontend chama Edge Function "notify-new-lead"
   ↓
4. Edge Function:
   a. Extrai cidade do lead (form_data.sell.city / buy.city / etc.)
   b. Busca profiles com address_city igual
   c. Busca emails desses profiles via auth.users
   d. Para cada usuário:
      - Gera HTML do email com características do lead
      - Envia via Resend
   ↓
5. Usuários recebem email com:
   - Características do lead (SEM nome/telefone)
   - Botão "Ver Lead" que abre direto o card no Marketplace
```

---

### Nova Edge Function: `notify-new-lead`

**Localização**: `supabase/functions/notify-new-lead/index.ts`

**Parâmetros de entrada**:
```typescript
{
  leadId: string;        // ID do lead criado
  city: string;          // Cidade do lead
  intention: string;     // SELL, BUY, BUILD, RENT
  description: string;   // Descrição gerada
  formData: object;      // Dados do formulário (sem nome/telefone)
}
```

**Lógica da função**:
1. Buscar profiles onde `address_city` = `city`
2. Para cada profile, buscar email em `auth.users` via `id`
3. Gerar HTML do email com:
   - Título: "Novo lead disponível na sua região!"
   - Subtítulo: "[Cidade] - [Tipo de interesse]"
   - Características do lead formatadas
   - Botão: "Ver Lead" com link para `/leads?leadId={leadId}`
4. Enviar emails via Resend (em lote ou sequencial)
5. Logar resultados

---

### Conteúdo do Email

```text
Assunto: 🏠 Novo lead em [Cidade]! Confira agora

Corpo:
- Logo LeadBay
- "Um novo lead chegou na sua região!"
- Cidade: [Cidade/UF]
- Interesse: [Comprar/Vender/Alugar/Construir]
- Características:
  - Tipo: [Casa, Apartamento, etc.]
  - Quartos: X
  - Orçamento: R$ X.XXX,XX
  - etc.
- [BOTÃO] "Ver Lead" → https://proplisted-hub.lovable.app/leads?leadId=XXX

⚠️ NÃO inclui: Nome, Telefone, Email do lead
```

---

### Atualização do LeadFormWizard

Após salvar o lead com sucesso, chamar a Edge Function:

```typescript
// Após criar o lead no marketplace
const leadCity = formData.sell?.city || formData.buy?.city || 
                 formData.build?.city || formData.rent?.city;

// Chamar edge function para notificar (fire-and-forget)
supabase.functions.invoke('notify-new-lead', {
  body: {
    leadId: createdLeadId,
    city: leadCity,
    intention: formData.intention,
    description: description,
    formData: formDataJson, // Sem name/phone
  }
});
```

---

### Arquivos a Criar/Modificar (Parte 1)

| Arquivo | Ação |
|---------|------|
| `supabase/functions/notify-new-lead/index.ts` | **CRIAR** - Edge Function para enviar emails |
| `supabase/config.toml` | **MODIFICAR** - Adicionar configuração da nova função |
| `src/components/leadform/LeadFormWizard.tsx` | **MODIFICAR** - Chamar edge function após submit |
| **Migration SQL** | **CRIAR** - Adicionar campos `address_uf`, `address_city`, `address_neighborhood` na tabela `profiles` |

---

## Parte 2: Carrinho Flutuante Lateral

### Design

Botão fixo no canto inferior direito da tela:

```text
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                      Conteúdo                           │
│                                                         │
│                                              ┌────────┐ │
│                                              │ 🛒 (3) │ │
│                                              │Carrinho│ │
│                                              └────────┘ │
└─────────────────────────────────────────────────────────┘
```

- Posição: `fixed bottom-6 right-6`
- Mostra contador de itens no carrinho
- Ao clicar, navega para `/cart`
- Aparece apenas para usuários logados
- Animação sutil ao adicionar item

---

### Novo Componente: `FloatingCart.tsx`

```typescript
// src/components/FloatingCart.tsx
interface FloatingCartProps {
  itemCount: number;
}

export function FloatingCart({ itemCount }: FloatingCartProps) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate('/cart')}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center 
                 bg-primary text-primary-foreground rounded-full p-4 shadow-lg
                 hover:scale-105 transition-transform"
    >
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <Badge className="absolute -top-2 -right-2">{itemCount}</Badge>
      )}
      <span className="text-xs mt-1 font-medium">Carrinho</span>
    </button>
  );
}
```

---

### Integração no Layout

O `FloatingCart` será adicionado ao `Layout.tsx` para aparecer em todas as páginas quando o usuário estiver logado:

```typescript
// Layout.tsx
const [cartCount, setCartCount] = useState(0);

useEffect(() => {
  if (user) {
    fetchCartCount();
    // Opcional: Realtime subscription para atualizar contador
  }
}, [user]);

return (
  <div>
    {/* ... header, main, footer ... */}
    {user && <FloatingCart itemCount={cartCount} />}
  </div>
);
```

---

### Arquivos a Criar/Modificar (Parte 2)

| Arquivo | Ação |
|---------|------|
| `src/components/FloatingCart.tsx` | **CRIAR** - Componente do carrinho flutuante |
| `src/components/Layout.tsx` | **MODIFICAR** - Adicionar FloatingCart e lógica de contagem |

---

## Resumo de Arquivos

### Novos Arquivos (3)
1. `supabase/functions/notify-new-lead/index.ts` - Edge Function de notificação
2. `src/components/FloatingCart.tsx` - Componente do carrinho flutuante
3. Migration SQL para adicionar campos de localização em `profiles`

### Arquivos Modificados (4)
1. `supabase/config.toml` - Adicionar nova Edge Function
2. `src/components/leadform/LeadFormWizard.tsx` - Chamar edge function
3. `src/components/Layout.tsx` - Adicionar FloatingCart
4. `src/components/auth/MultiStepSignup.tsx` - Garantir que campos de cidade são salvos no profile

---

## Considerações de Segurança

| Aspecto | Implementação |
|---------|---------------|
| **Privacidade** | Email NÃO inclui nome, telefone ou email do lead |
| **RLS** | Edge function usa service role para queries |
| **Rate Limit** | Limitar envios por lead (apenas 1x por lead) |
| **Opt-out** | Futuro: campo `receive_notifications` no profile |

---

## Dependências

- **Resend API Key**: Já configurado (`RESEND_API_KEY`)
- **Domínio verificado**: leadbay.com.br (já configurado para outros emails)

---

## Detalhes Técnicos

### Link Direto para o Lead

O botão "Ver Lead" no email terá a URL:
```
https://proplisted-hub.lovable.app/leads?leadId={LEAD_ID}
```

Isso exigirá uma pequena modificação em `Leads.tsx` para:
1. Ler o parâmetro `leadId` da URL
2. Abrir automaticamente o modal `LeadDetailsModal` com esse lead

### Matching de Cidade

O matching será feito comparando:
- `profiles.address_city` (do usuário cadastrado)
- `form_data.{flow}.city` (do lead do formulário)

Ambos serão normalizados para uppercase antes da comparação.

