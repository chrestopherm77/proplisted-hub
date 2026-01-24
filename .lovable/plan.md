

## Plano: Atualização da Landing Page e Notificações Falsas

### Resumo
Atualizar os textos da página inicial conforme solicitado e implementar um sistema de notificações falsas que aparecem periodicamente para criar prova social.

---

### Parte 1: Alterações de Texto

**Arquivo a modificar:** `src/pages/Index.tsx`

#### 1.1 Seção "Por que escolher o LeadBay?" (linha 64-66)

| Texto Atual | Novo Texto |
|-------------|------------|
| "A plataforma mais confiável para corretores de imóveis encontrarem clientes qualificados" | "A plataforma que corretores confiam para encontrar clientes com intenção real de compra" |

#### 1.2 Cards da mesma seção (linhas 73-76 e 83-86)

**Card "Leads Qualificados":**
| Texto Atual | Novo Texto |
|-------------|------------|
| "Todos os leads são verificados e qualificados antes de serem disponibilizados. Apenas contatos reais e com interesse genuíno." | "Leads 100% verificados com interesse real de compra ou venda. Economize tempo com contatos desqualificados." |

**Card "Seguro e Confiável":**
| Texto Atual | Novo Texto |
|-------------|------------|
| "Plataforma segura em conformidade com LGPD para proteção de dados. Seus investimentos e informações estão protegidos." | "Total segurança e conformidade com a LGPD. Seus dados e investimentos protegidos em cada transação" |

#### 1.3 Seção "Como Funciona" (linha 105-106)

| Texto Atual | Novo Texto |
|-------------|------------|
| "Processo simples e rápido para você começar a fechar negócios hoje mesmo" | "3 passos simples para começar a fechar negócios hoje" |

#### 1.4 Seção "Benefícios Exclusivos" (linhas 170-200)

**Leads Exclusivos por Região:**
| Texto Atual | Novo Texto |
|-------------|------------|
| "Cada lead pode ser vendido para no máximo 3 corretores, garantindo exclusividade" | "Cada lead é compartilhado com no máximo 3 corretores. Mais exclusividade, menos concorrência." |

**Pagamento Seguro:**
| Texto Atual | Novo Texto |
|-------------|------------|
| "Múltiplas formas de pagamento com a segurança do Asaas" | "Pagamento 100% seguro via PIX ou cartão, processado pela Asaas" |

**Histórico Completo:**
| Texto Atual | Novo Texto |
|-------------|------------|
| "Acesse todos os seus leads comprados a qualquer momento" | "Histórico completo de todos os leads adquiridos disponível 24/7" |

---

### Parte 2: Sistema de Notificações Falsas (Prova Social)

#### 2.1 Criar Componente de Notificação

**Novo arquivo:** `src/components/FakeNotification.tsx`

O componente terá:
- Array de mensagens variadas de prova social
- Nomes brasileiros aleatórios
- Ações aleatórias (agendou visita, fechou negócio, comprou lead)
- Tempos aleatórios (últimas X horas)
- Animação de entrada/saída suave
- Posição fixa no canto inferior esquerdo
- Timer para aparecer a cada 8-12 segundos

**Exemplos de mensagens:**
- "Gabriel agendou uma visita com um lead nas últimas 3 horas"
- "Marina fechou um negócio através de um lead há 5 horas"
- "Carlos comprou 3 leads para sua região há 2 horas"
- "Fernanda iniciou negociação com um lead há 1 hora"
- "Ricardo acabou de comprar um lead premium"

#### 2.2 Estrutura do Componente

```text
┌─────────────────────────────────────────┐
│ [Ícone] Nome + ação + tempo             │
│         Ex: "Gabriel agendou uma        │
│         visita nas últimas 3h"          │
└─────────────────────────────────────────┘
```

**Lógica:**
1. Estado para controlar visibilidade da notificação
2. useEffect com setInterval (8-12 segundos aleatório)
3. Seleciona nome, ação e tempo aleatoriamente
4. Mostra notificação por 4 segundos
5. Animação fade-in e fade-out

#### 2.3 Integrar na Landing Page

Adicionar o componente `<FakeNotification />` dentro da página Index.tsx, logo após o header ou no final do componente.

---

### Detalhes Técnicos

**Animações para a notificação:**
- Usar classes existentes do Tailwind: `animate-fade-in`, `animate-fade-out`
- Ou criar animação customizada de slide-in da esquerda

**Estilo da notificação:**
- Background branco com sombra
- Borda arredondada
- Ícone de usuário ou check verde
- Posição fixa: `fixed bottom-4 left-4`
- z-index alto para ficar sobre outros elementos
- Responsivo: esconder em mobile muito pequeno ou ajustar tamanho

**Dados mockados:**
```typescript
const names = ['Gabriel', 'Marina', 'Carlos', 'Fernanda', 'Ricardo', 'Juliana', 'Pedro', 'Ana', 'Lucas', 'Beatriz'];

const actions = [
  'agendou uma visita com um lead',
  'fechou um negócio através de um lead',
  'comprou 3 leads para sua região',
  'iniciou negociação com um lead',
  'acabou de comprar um lead premium',
];

const times = ['há 1 hora', 'há 2 horas', 'há 3 horas', 'nas últimas 4 horas', 'há 5 horas'];
```

---

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/FakeNotification.tsx` | **Criar** - Componente de notificações falsas |
| `src/pages/Index.tsx` | **Modificar** - Atualizar textos e adicionar componente |

---

### Resultado Esperado

1. Textos atualizados em todas as seções conforme especificado
2. Notificações de prova social aparecendo a cada 8-12 segundos
3. Visual profissional com animações suaves
4. Experiência que transmite confiança e atividade na plataforma

