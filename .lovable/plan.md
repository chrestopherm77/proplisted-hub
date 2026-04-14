

# Plano: Sidebar Lateral + Página "Nossa IA"

## 1. Converter navegação de topo para sidebar lateral

Trocar o layout atual (header com nav horizontal) por uma sidebar fixa à esquerda usando os componentes `SidebarProvider` e `Sidebar` já existentes no projeto.

**Estrutura nova:**
- **Sidebar esquerda** (desktop): logo no topo, links de navegação vertical, botão de sair no rodapé
- **Mobile**: mantém o Sheet lateral que já existe (MobileMenu), sem mudança
- **Header**: fica reduzido a apenas o `SidebarTrigger` + ícones de carrinho/perfil (no desktop, o header pode até sumir - a sidebar assume tudo)

**Arquivos afetados:**
| Arquivo | Mudança |
|---------|---------|
| `src/components/Layout.tsx` | Refatorar para usar `SidebarProvider` + `Sidebar` + `SidebarContent` ao invés de header com nav |
| `src/components/MobileMenu.tsx` | Manter como está (já é sheet lateral) |

**Comportamento:**
- Desktop: sidebar fixa à esquerda com logo, links (Meus Leads, Leads Disponíveis, Balcão de Parcerias, Lançamentos, Financiamento, Giro do Mercado, Nossa IA, Admin) e ações (perfil, sair)
- Sidebar colapsável via ícone
- Carrinho visível no topo ou na sidebar
- Páginas públicas (sem user logado) mantêm layout simples sem sidebar

## 2. Criar página "Nossa IA"

Nova página `/nossa-ia` com as 4 imagens enviadas organizadas em seções com copy descritivo e espaço para vídeo.

**Layout da página:**
1. **Hero/Intro** com título "Nossa IA" e subtítulo explicativo
2. **Espaço para vídeo** - placeholder com ícone de play, pronto para receber URL de vídeo
3. **Seção CRM** (image-72) - Kanban de gestão de leads com copy sobre pipeline comercial
4. **Seção Dashboard** (image-73) - Métricas de vendas com copy sobre analytics
5. **Seção Agentes IA** (image-74) - Agentes especialistas com copy sobre atendimento automatizado
6. **Seção Agendamentos** (image-75) - Gestão de visitas com copy sobre organização

As imagens serão copiadas para `src/assets/` e importadas no componente.

**Arquivos novos/afetados:**
| Arquivo | Ação |
|---------|------|
| `src/pages/NossaIA.tsx` | Criar página com seções, imagens e vídeo placeholder |
| `src/App.tsx` | Adicionar rota `/nossa-ia` |
| `src/components/Layout.tsx` | Adicionar link "Nossa IA" na sidebar |
| `src/components/MobileMenu.tsx` | Adicionar link "Nossa IA" no menu mobile |
| `src/assets/nossa-ia-crm.png` | Copiar imagem CRM |
| `src/assets/nossa-ia-dashboard.png` | Copiar imagem Dashboard |
| `src/assets/nossa-ia-agentes.png` | Copiar imagem Agentes |
| `src/assets/nossa-ia-agendamentos.png` | Copiar imagem Agendamentos |

## Detalhes técnicos

- Sidebar usa componentes de `@/components/ui/sidebar` (SidebarProvider, Sidebar, SidebarContent, SidebarMenu, etc.)
- Páginas sem autenticação (Auth, LeadForm, ThankYou, etc.) continuam sem sidebar
- A página "Nossa IA" fica acessível para todos os usuários logados
- Link "Nossa IA" terá ícone de `Bot` ou `Brain` do lucide-react

