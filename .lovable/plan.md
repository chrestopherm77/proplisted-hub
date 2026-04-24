# Plano aprovado — Avatar menu + enxugar sidebar

## Decisões
- **Planos**: manter na lista lateral.
- **Comprar Créditos no footer**: remover.
- **Dropdown do avatar**: Perfil, Comprar Créditos, Planos, Sair.

## 1. Migration
- `ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT`.
- `INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)`.
- Policies em `storage.objects` para bucket `avatars`:
  - **SELECT** público.
  - **INSERT/UPDATE/DELETE** apenas quando `auth.uid()::text = (storage.foldername(name))[1]`.

## 2. Novo `src/components/UserAvatarMenu.tsx`
- `Avatar` (h-9 w-9) com `AvatarImage` usando `profiles.avatar_url` e `AvatarFallback` com iniciais do nome/email.
- Busca `name` + `avatar_url` + email via `profiles` select; canal realtime em `profiles` com filtro `id=eq.${user.id}` para refletir mudanças na hora.
- `DropdownMenu` (shadcn) com:
  - Cabeçalho: avatar maior + nome + email.
  - **Trocar foto** → dispara `<input type="file" hidden accept="image/png,image/jpeg,image/webp">`.
    - Valida ≤ 2 MB e extensão.
    - Upload em `avatars/{user_id}/avatar-{timestamp}.{ext}` com `upsert: true`.
    - `getPublicUrl` + `update profiles set avatar_url = ... where id = user.id`.
    - Toasts (sonner) de sucesso/erro.
  - **Remover foto** (se já existe): `update profiles set avatar_url = null` + remoção best-effort do objeto no bucket.
  - Separador.
  - **Meu Perfil** → `/profile`.
  - **Comprar Créditos** → `/comprar-creditos`.
  - **Planos** → `/planos` (oculto se `isPartnerSite`).
  - Separador.
  - **Sair** → `signOut()` + `navigate('/auth')`.

## 3. `src/components/Layout.tsx`
- Header do estado logado: manter esquerda (MobileMenu + SidebarTrigger), adicionar `<UserAvatarMenu />` à direita (desktop + mobile).

## 4. `src/components/AppSidebar.tsx`
- Manter **Planos** no `navItems`.
- Remover `SidebarFooter` inteiro (Comprar Créditos, Perfil, Sair) — o card amarelo de créditos no topo continua sendo o atalho para `/comprar-creditos`.

## 5. `src/components/MobileMenu.tsx`
- Remover entradas **Perfil** e **Sair** (migram para o avatar no header).
- Manter demais itens.

## Arquivos afetados
- Migration (nova).
- `src/components/UserAvatarMenu.tsx` (novo).
- `src/components/Layout.tsx`.
- `src/components/AppSidebar.tsx`.
- `src/components/MobileMenu.tsx`.

## Não alterar
- `src/integrations/supabase/client.ts`, `types.ts` (auto-gerado).
- `src/hooks/useAuth.tsx`.
