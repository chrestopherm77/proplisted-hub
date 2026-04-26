
## Plano — Ajustes em Lançamentos

### 1. Zona — opção "Nenhuma" (poder desselecionar)
**Arquivo:** `src/pages/NewLaunch.tsx` (e o futuro editor reutilizando)

- Adicionar `<SelectItem value="__none__">Nenhuma</SelectItem>` como primeira opção do Select de Zona.
- No submit, converter `zone === "__none__"` para `null` antes do INSERT (já existe `zone || null`, ajusto para `zone && zone !== "__none__" ? zone : null`).
- Mesmo padrão será aplicado nos outros selects opcionais conforme necessário (mantendo o escopo só em Zona por ora, conforme pedido).

### 2. Editar lançamento depois de publicado
Hoje só existe `/launches/new` (criar). Vou:

- **Refatorar `src/pages/NewLaunch.tsx`** para suportar modo edição via parâmetro de rota:
  - Nova rota: `/launches/:id/edit` em `src/App.tsx`.
  - Ao montar, se houver `id`, carrega o lançamento (`select('*').eq('id', id).single()`) e popula todos os states.
  - Botão final muda de "Publicar" para "Salvar alterações".
  - No submit, em modo edição: `update(...).eq('id', id)` em vez de `insert`.
  - Permissão: só o `user_id` dono do lançamento OU `MASTER_ADMIN` pode editar (já garantido pelas RLS existentes — `Users can update own launches` + `Admins can manage all launches`).
  - Banner/logo/PDFs: se o usuário não trocar o arquivo, mantém URLs atuais; se trocar, faz upload novo e substitui.

- **Adicionar botão "Editar" em `src/pages/LaunchDetail.tsx`**:
  - Aparece ao lado do botão "Excluir" no header.
  - Visível apenas se `user.id === launch.user_id` ou `isAdmin`.
  - Navega para `/launches/${id}/edit`.

### 3. Logo/banner cortado no card da listagem
**Arquivo:** `src/pages/Launches.tsx` (cards do grid)

Causa: o card usa `aspect-[16/10]` com `object-cover` no `banner_url`. Quando o usuário sobe a logo como banner (caso da imagem enviada — "Construa Comigo"), ela é cortada.

**Correção:**
- Trocar `object-cover` por `object-contain` na imagem do card e adicionar fundo neutro (`bg-white`) para que **logos e imagens proporcionais apareçam inteiras dentro do quadro do card**, sem corte (igual ao print).
- Manter o `aspect-[16/10]` (formato do quadro inalterado).
- A logo flutuante pequena no canto inferior esquerdo (`launch.logo_url`) será **escondida** quando não houver `banner_url` separado — evita duplicação visual.

**Não mexer** na página de detalhe (`LaunchDetail.tsx` banner permanece `object-cover` no aspect 16/7, que é o comportamento esperado para banner de cabeçalho).

### 4. Mensagem padrão no WhatsApp do coordenador
**Arquivo:** `src/pages/LaunchDetail.tsx`

Hoje: `whatsLink` só monta `https://wa.me/55<numero>` sem texto.

**Correção:**
- Buscar o `name` do corretor logado a partir de `profiles` (ou usar `user.user_metadata?.name`) no `fetchLaunch`.
- Trocar `whatsLink` por uma versão que monte:
  ```
  Olá! Sou {nome do corretor logado}, vim através do site Conecta&Imob 
  e tenho interesse no empreendimento {nome do lançamento}. 
  Pode me passar mais informações?
  ```
- Encodar com `encodeURIComponent` e usar o helper `buildWaLink(phone, message)` que já existe em `src/lib/whatsapp.ts` (faz a normalização correta de telefone para 12 dígitos — regra do projeto).
- Aplicar nos dois botões (WhatsApp 1 e WhatsApp 2).
- Fallback: se por algum motivo o nome do corretor não carregar, usar "Olá! Vim através do site Conecta&Imob..." sem o nome.

### Resumo dos arquivos
- **Editar:** `src/pages/NewLaunch.tsx` (modo edição + Zona "Nenhuma"), `src/pages/LaunchDetail.tsx` (botão Editar + WhatsApp com mensagem), `src/pages/Launches.tsx` (card sem corte), `src/App.tsx` (nova rota `/launches/:id/edit`).
- **Sem mudanças no banco** — RLS de `launches` já permite update pelo dono e pelo admin.
