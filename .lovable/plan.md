
## Redirecionar para /lp-obrigado apos envio do formulario

### O que muda

Ao inves de mostrar a tela de sucesso inline no formulario, o usuario sera redirecionado para a pagina `/lp-obrigado` apos o envio. Essa pagina tera a mesma mensagem de agradecimento com o logo da LeadBay.

### Alteracoes

**1. Criar `src/pages/ThankYou.tsx`**

Nova pagina com o conteudo da tela de sucesso (logo LeadBay + mensagem de agradecimento). Reutiliza o mesmo visual do `SuccessScreen`.

**2. Registrar rota em `src/App.tsx`**

Adicionar `<Route path="/lp-obrigado" element={<ThankYou />} />` nas rotas.

**3. Alterar `src/components/leadform/LeadFormWizard.tsx`**

- Importar `useNavigate` do react-router-dom
- Apos o envio bem-sucedido (onde hoje faz `setIsSubmitted(true)`), trocar por `navigate('/lp-obrigado')`
- Remover o import do `SuccessScreen` e o bloco `if (isSubmitted)` que renderiza essa tela
- Remover o estado `isSubmitted` que nao sera mais necessario

### Resultado

- O formulario envia os dados e redireciona para `leadbay.com.br/lp-obrigado`
- A pagina de obrigado funciona como URL independente (pode ser compartilhada, usada como destino de pixel, etc.)
- O fluxo de reset do formulario continua funcionando normalmente
