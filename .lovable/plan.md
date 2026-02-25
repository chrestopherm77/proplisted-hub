

## Reverter rastreamento: criar lead parcial somente apos validacao do contato

### O que muda

O rastreamento voltara a funcionar como antes: o lead parcial so e criado na tabela `lp_partial_leads` **depois** que o usuario validar nome e telefone na etapa de Contato. Isso garante que nome e telefone sempre aparecam na tabela do admin.

### Alteracoes em `src/components/leadform/LeadFormWizard.tsx`

1. **Restaurar verificacao `hasContact` no `trackPartialLead`**: Adicionar de volta a condicao que exige `name` e `phone` preenchidos antes de criar/atualizar o lead parcial. Se nao tiver contato validado, a funcao retorna sem fazer nada.

2. **Ajustar o debounce `useEffect`**: Ao inves de disparar desde a etapa 0, so disparar apos o contato ter sido validado (etapa >= 2, ou seja, apos a etapa de contato).

3. **Manter o progresso funcionando**: O tracking continua atualizando `current_step`, `step_index`, `total_steps` e `form_data` a cada mudanca de etapa — so que agora so comeca apos o contato.

### Resultado

| Campo | Comportamento |
|---|---|
| Nome | Sempre preenchido (obrigatorio) |
| Telefone | Sempre preenchido (obrigatorio) |
| Intencao | Salva junto com o contato |
| Progresso | Atualizado a cada etapa apos contato |
| Respostas | Salvas no form_data em tempo real |

