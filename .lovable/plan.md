

# Plano: Página de Financiamento com envio via WhatsApp

## Resumo
Criar uma nova página `/financiamento` com formulário que coleta dados de simulação de financiamento. Ao enviar, uma Edge Function dispara a mensagem formatada via Mega API para o WhatsApp `553191914663`, incluindo nome e telefone do corretor logado.

## Implementação

### 1. Edge Function `send-financing-whatsapp`
- Recebe os dados do formulário + nome/telefone do corretor
- Valida inputs com Zod
- Monta mensagem formatada com todos os campos
- Envia via Mega API (mesma instância `megacode-Mj46Nd4U5tP`, token `MEGA_API_TOKEN` já configurado)
- Destino fixo: `553191914663@s.whatsapp.net`

### 2. Página `src/pages/Financing.tsx`
- Formulário com os campos:
  - **Modalidade**: Select (Imóvel Novo / Imóvel Usado / Aquisição de Terreno e Construção / Construção em Terreno Próprio / Outro)
  - **UF do Imóvel**: Select via IBGE (`useIBGELocation`)
  - **Cidade do Imóvel**: Select dinâmico via IBGE
  - **Valor Aproximado do Imóvel**: Input com formatação R$
  - **Renda Bruta Familiar Mensal**: Input com formatação R$
  - **Data de Nascimento**: Input date
  - **Utilizar FGTS?**: Select Sim/Não
- Ao submeter, chama a Edge Function via `supabase.functions.invoke`
- Nome e telefone do corretor puxados do perfil logado
- Tela de sucesso após envio

### 3. Navegação
- Adicionar link "Financiamento" no menu desktop (`Layout.tsx`) e mobile (`MobileMenu.tsx`)

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/send-financing-whatsapp/index.ts` | Nova Edge Function |
| `src/pages/Financing.tsx` | Nova página com formulário |
| `src/App.tsx` | Rota `/financiamento` |
| `src/components/Layout.tsx` | Link no menu |
| `src/components/MobileMenu.tsx` | Link no menu mobile |

