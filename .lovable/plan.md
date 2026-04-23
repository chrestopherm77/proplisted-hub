

## Remover preview da descrição no modal de Lead

No modal de Leads Disponíveis (`LeadDetailsModal.tsx`), o cabeçalho hoje mostra um resumo das preferências (`Preferência 1: Interesse / Região / Características...`) logo abaixo do título. Esse bloco duplica o que aparece em "📋 Detalhes do Lead" mais abaixo.

### Mudança
- Remover o bloco renderizado por `parseDescriptionToDisplay(lead.description)` no `DialogHeader` (linhas 115–117).
- Remover a função auxiliar `parseDescriptionToDisplay` (não usada em mais lugar nenhum).
- Reduzir o padding inferior do header (`pb-3` → `pb-2`) para o conteúdo "Detalhes do Lead" subir e ocupar quase toda a área.

### Resultado
- Header enxuto: só o título `Lead #XXXX`, data de cadastro (admin) e badge de disponibilidade.
- A área de scroll com "📋 Detalhes do Lead" passa a ocupar praticamente todo o modal.
- Footer com créditos e botão de compra continua igual.

### Arquivo afetado
- `src/components/marketplace/LeadDetailsModal.tsx`

### O que NÃO muda
- Card do marketplace, lógica de compra, modal pós-compra, dados salvos, estilos do footer.

