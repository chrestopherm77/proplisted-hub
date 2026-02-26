

## Clonar /lp para /lp-01 com contato no final

### O que muda

A rota `/lp-01` tera o mesmo formulario da `/lp`, com a unica diferenca de que a etapa de contato (nome, WhatsApp, verificacao, termos) aparece no **final** do fluxo, apos todas as perguntas tecnicas. A pagina de obrigado sera `/lp-obrigado-01`.

### Abordagem

Em vez de duplicar todo o codigo do wizard, vamos adicionar uma **prop** ao `LeadFormWizard` que controla a posicao do contato. Isso evita manter dois componentes identicos.

### Alteracoes

**1. Alterar `LeadFormWizard.tsx`**

- Aceitar prop `contactAtEnd?: boolean` (default `false`, mantendo o comportamento atual da /lp)
- Quando `contactAtEnd` for `true`, mover a definicao do step `contact` para o final do array `allSteps`, logo apos todos os fluxos (sell, buy, build, rent)
- Ajustar a logica de partial lead tracking: quando o contato esta no final, o tracking so acontece apos o usuario preencher essa etapa (ja que nome/telefone so estarao disponiveis no fim)

**2. Alterar `LeadFormWizard.tsx` - redirecionamento**

- Aceitar prop `thankYouPath?: string` (default `/lp-obrigado`)
- Usar essa prop no `navigate()` apos o envio bem-sucedido

**3. Criar `src/pages/LeadForm01.tsx`**

- Pagina identica a `LeadForm.tsx` (mesmo layout, logo, pixel do Facebook)
- Renderiza `<LeadFormWizard contactAtEnd thankYouPath="/lp-obrigado-01" />`

**4. Criar `src/pages/ThankYou01.tsx`**

- Pagina identica a `ThankYou.tsx` (mesmo layout, pixel do Facebook)

**5. Registrar rotas em `App.tsx`**

- `/lp-01` renderiza `LeadForm01`
- `/lp-obrigado-01` renderiza `ThankYou01`

### Detalhes tecnicos

A mudanca principal no wizard e a construcao condicional do array de steps:

```text
contactAtEnd = false (atual /lp):
  intention -> contact -> [fluxo tecnico...]

contactAtEnd = true (nova /lp-01):
  intention -> [fluxo tecnico...] -> contact
```

O tracking de partial leads precisa ser ajustado para checar se ja tem dados de contato antes de tentar salvar, independente da posicao do step.

### Resultado

- `/lp` continua funcionando exatamente como hoje (contato no inicio)
- `/lp-01` funciona com contato no final
- Ambas compartilham o mesmo codigo-base, facilitando manutencao futura
