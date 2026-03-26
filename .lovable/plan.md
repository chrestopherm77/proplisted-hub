

## Alterar copy do ContactStep

### Alteração única em `src/components/leadform/steps/ContactStep.tsx`

O componente `ContactStep` é compartilhado por ambos os fluxos (`/lp` e `/lp-01`), então basta uma única mudança:

- **Título**: de `"Seus dados de contato"` → `"Confirme que você é real"`
- **Subtítulo**: de `"Preencha suas informações para que possamos entrar em contato"` → `"Verificação de número real para receber ofertas de imóveis da sua preferência por um de nossos corretores"`

Localização no código: dentro do `<StepContainer>` (linha ~199).

