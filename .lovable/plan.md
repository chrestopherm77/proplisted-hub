

## Rastreamento em tempo real e progresso atualizado

### Problema

1. **O progresso so e rastreado apos a etapa de contato** — `trackPartialLead` exige nome e telefone preenchidos (`hasContact`). Antes disso, nada aparece no admin.
2. **O admin so carrega dados uma vez** — `LeadTracking` faz `fetchData()` no mount e nunca mais atualiza. Nao ha subscricao realtime, entao o admin precisa recarregar a pagina para ver mudancas.
3. **O tracking so dispara ao clicar "Proximo"** — se o usuario preenche e minimiza o celular, o progresso atual nao e salvo.

### Solucao

**1. Rastrear desde a primeira etapa (sem exigir contato)**

Remover a verificacao `hasContact` do `trackPartialLead`. Permitir que o lead parcial seja criado mesmo sem nome/telefone — basta ter um `session_id`. Isso faz com que o admin veja o lead desde a escolha da intencao.

**2. Salvar progresso a cada mudanca de etapa e tambem no estado atual**

Alem de chamar `trackPartialLead` no `handleNext`, adicionar um `useEffect` que dispara o tracking sempre que `currentStepIndex` ou `formData` mudam (com debounce para nao sobrecarregar o banco). Isso captura o estado mesmo se o usuario minimizar o celular.

**3. Ativar realtime na tabela `lp_partial_leads`**

Criar uma migracao SQL para habilitar realtime na tabela:

```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.lp_partial_leads;
```

**4. Adicionar subscricao realtime no LeadTracking**

No componente `LeadTracking`, alem do `fetchData()` inicial, assinar o canal realtime da tabela `lp_partial_leads`. Quando houver INSERT ou UPDATE, atualizar o estado local automaticamente — o lead aparece e atualiza seu progresso em tempo real sem recarregar a pagina.

### Alteracoes por arquivo

| Arquivo | Acao |
|---|---|
| Migracao SQL | Habilitar realtime em `lp_partial_leads` |
| `src/components/leadform/LeadFormWizard.tsx` | Remover exigencia de contato; adicionar tracking com debounce no `useEffect` |
| `src/components/admin/LeadTracking.tsx` | Adicionar subscricao realtime para atualizar leads em tempo real |

### Detalhes tecnicos

**LeadFormWizard.tsx — tracking sem exigir contato:**
- Remover o bloco `if (!hasContact) return;` do `trackPartialLead`
- O payload ja envia `name` e `phone` como opcionais (podem ser null/vazio)
- Adicionar `useEffect` com debounce de ~2 segundos observando `currentStepIndex` e `formData` para salvar progresso automaticamente

**LeadTracking.tsx — realtime:**
```text
useEffect(() => {
  fetchData();

  const channel = supabase
    .channel('partial-leads-realtime')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'lp_partial_leads',
    }, (payload) => {
      // INSERT: adicionar ao array
      // UPDATE: atualizar o item existente
      // DELETE: remover do array
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

Quando o admin abrir a aba Rastreamento, vera os leads aparecendo e atualizando seu progresso em tempo real conforme o usuario preenche o formulario no celular.

