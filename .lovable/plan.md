

## Mostrar erros de campos obrigatórios no cadastro

### Problema atual

O botão "Avançar"/"Finalizar Cadastro" fica **desabilitado silenciosamente** quando campos não estão preenchidos (`!isStepComplete()` na linha 573). O usuário não recebe nenhum feedback visual indicando **quais campos** estão faltando — apenas vê o botão cinza sem explicação.

### Solução

Remover o `!isStepComplete()` do `disabled` do botão e deixar o `validateStep()` ser o responsável por bloquear o avanço, mostrando **mensagens de erro inline** em cada campo obrigatório vazio. Assim o usuário clica, vê os campos em vermelho com a mensagem "Campo obrigatório", e sabe exatamente o que preencher.

### Alteração em `src/components/auth/MultiStepSignup.tsx`

1. **Linha 573**: Remover `!isStepComplete()` do `disabled` do botão — manter apenas `isLoading || isSendingCode`
2. **Adicionar toast genérico** no `validateStep` quando houver erros: `toast.error("Preencha todos os campos obrigatórios")`

### Resultado

- Botão sempre clicável (exceto durante loading)
- Ao clicar sem preencher, cada campo vazio mostra borda vermelha + mensagem de erro
- Toast informando "Preencha todos os campos obrigatórios"
- Validação já existe em `validateStep` para todos os campos — apenas não era acionada porque o botão ficava desabilitado

