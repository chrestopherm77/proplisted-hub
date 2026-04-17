
## Estabilizar carregamento e melhorar diagnóstico de erros

A tela "Algo deu errado" é o `ErrorBoundary` em `main.tsx` capturando um erro de runtime, mas hoje ele:
- Não mostra qual foi o erro
- Não se recupera quando o usuário navega
- Não loga em algum lugar útil pra debug

Sem o erro real, não dá pra apontar a causa raiz. Vou então **endurecer o app contra erros transitórios** e **melhorar o ErrorBoundary** pra que (a) ele se recupere sozinho na navegação, (b) mostre a mensagem real em modo dev, e (c) ofereça "Voltar pro início" além de "Recarregar".

### Mudanças

**1. `src/main.tsx` — ErrorBoundary mais inteligente**
- Mostra `error.message` (útil pra você reportar próximo erro)
- Mostra stack só em desenvolvimento
- Botão "Voltar para o início" que limpa o erro e vai pra `/`
- Reseta automaticamente se a URL mudar (evita ficar travado eternamente em uma tela de erro depois que a rota muda)
- Loga o erro com mais detalhe no console (já estava, mas melhorando o formato)

**2. `src/pages/MyLeads.tsx` — proteção contra dados quebrados**
- Try/catch adicional no `grouped` (caso uma `stage` retornada do banco não exista no enum, hoje quebraria com `Cannot read property 'push' of undefined`)
- Filtrar leads cujo `stage` não está em `STAGES` antes de agrupar
- Validar que `lead.phone` existe antes de chamar `buildWaLink`

**3. `src/lib/whatsapp.ts` — não quebrar com input vazio**
- Garantir que `buildWaLink(undefined | null | '')` retorna string segura sem throw

**4. `src/components/AppSidebar.tsx` — defensive**
- Garantir que `creditBalance.toLocaleString` não quebra se vier `null`
- Validar `partner.logo_url` (já é nullable, ok) e adicionar `onError` no `<img>` da logo pra cair no fallback

### O que isso resolve
- Próxima vez que aparecer "Algo deu errado", você vai ver **a mensagem do erro real** e pode me passar — fica trivial corrigir.
- Erros pontuais não vão mais "prender" o app: navegar resolve.
- As 4 áreas mais propensas a quebra (logo, sidebar, kanban, whatsapp) ficam blindadas.

### Arquivos
- `src/main.tsx` (editar — ErrorBoundary melhorado)
- `src/pages/MyLeads.tsx` (editar — defensivo no `grouped` e fetch)
- `src/lib/whatsapp.ts` (editar — input safety)
- `src/components/AppSidebar.tsx` (editar — onError na logo + null safety)

### Observação
Se o erro acontecer de novo depois disso, a nova tela vai mostrar exatamente qual foi — me manda o print que eu corrijo na hora.
