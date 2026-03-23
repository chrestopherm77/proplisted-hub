

## Melhorar Layout do Modal de Detalhes do Lead

### Problema
O modal atual usa `h-[85vh]` com muitos elementos fixos (header, footer com preço e botão), deixando pouco espaço para o conteúdo principal. O texto fica pequeno e precisa de muita rolagem.

### Solução

Alterar `src/components/marketplace/LeadDetailsModal.tsx`:

1. **Aumentar o modal**: Usar `max-w-3xl` e `h-[90vh]` para dar mais espaço total
2. **Aumentar tamanho dos textos**: Subir de `text-sm` para `text-base` nos campos de dados e descrição
3. **Reduzir padding/espaçamento do footer**: Compactar a seção de preço e botão para liberar mais espaço ao conteúdo
4. **Combinar preço e botão em linha**: Colocar valor e botão na mesma linha horizontal, removendo a caixa `bg-muted` grande
5. **Aumentar espaçamento dos campos**: Usar `gap-3` em vez de `gap-2` nos campos para melhor legibilidade
6. **Seções com fonte maior**: Títulos de seção `text-base` em vez de `text-sm`

Resultado: conteúdo mais visível, menos rolagem necessária, informações praticamente todas visíveis ao abrir.

