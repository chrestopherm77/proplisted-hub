
# Página "Primeiros Passos" com vídeo + atalho no menu do avatar

Criar uma página `/primeiros-passos` para todos os usuários autenticados, com vídeo tutorial gerenciável pelo admin (upload MP4 ou URL do YouTube/Vimeo). Adicionar atalho no menu suspenso do avatar e redirecionar automaticamente o usuário para essa página logo após o cadastro.

---

### 1. Banco de dados — tabela `onboarding_video` (single-row config)

```sql
CREATE TABLE public.onboarding_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url text,
  video_type text NOT NULL DEFAULT 'url' CHECK (video_type IN ('url','mp4')),
  title text DEFAULT 'Bem-vindo ao Conecta&Imob!',
  description text DEFAULT 'Assista ao vídeo abaixo e descubra como aproveitar ao máximo a plataforma.',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.onboarding_video ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read onboarding video"
ON public.onboarding_video FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can manage onboarding video"
ON public.onboarding_video FOR ALL TO authenticated
USING (has_role(auth.uid(), 'MASTER_ADMIN'))
WITH CHECK (has_role(auth.uid(), 'MASTER_ADMIN'));

INSERT INTO public.onboarding_video (video_type, video_url) VALUES ('url', NULL);
```

### 2. Storage — bucket público `onboarding-videos` (limite 100MB)

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('onboarding-videos', 'onboarding-videos', true, 104857600,
        ARRAY['video/mp4','video/webm']);

CREATE POLICY "Public read onboarding videos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'onboarding-videos');

CREATE POLICY "Admin upload onboarding videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'onboarding-videos' AND has_role(auth.uid(), 'MASTER_ADMIN'));

CREATE POLICY "Admin delete onboarding videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'onboarding-videos' AND has_role(auth.uid(), 'MASTER_ADMIN'));
```

### 3. Página pública — `src/pages/PrimeirosPassos.tsx`

Renderizada com o `Layout` padrão (sidebar + header).
- Busca o registro de `onboarding_video`.
- Renderiza título e descrição editáveis pelo admin.
- Player responsivo `aspect-video` 16:9:
  - `video_type = 'url'`: detecta YouTube/Vimeo e usa `<iframe>` (`youtube.com/embed/{id}` ou `player.vimeo.com/video/{id}`).
  - `video_type = 'mp4'`: usa `<video controls>` HTML5 com URL pública.
  - Sem vídeo: placeholder "Vídeo em breve".
- Dois CTAs abaixo do vídeo: **"Ir para Meus Leads"** e **"Comprar Créditos"**.

### 4. Rotas — `src/App.tsx`

Inserir antes do catch-all `/:customSlug`:
```tsx
<Route path="/primeiros-passos" element={<PrimeirosPassos />} />
<Route path="/admin/onboarding-video" element={<Admin section="onboarding-video" />} />
```

### 5. Redirect pós-cadastro — `src/components/auth/MultiStepSignup.tsx`

Após `signUp` bem-sucedido (linha ~459), trocar o toast por:
```tsx
toast.success("Cadastro realizado com sucesso! Bem-vindo!");
setTimeout(() => { window.location.href = '/primeiros-passos'; }, 800);
```

O **login normal** em `Auth.tsx` continua indo para `/leads`. Apenas o cadastro vai para Primeiros Passos.

### 6. Atalho no menu do avatar — `src/components/UserAvatarMenu.tsx`

Adicionar item logo abaixo de "Meu Perfil":
```tsx
<DropdownMenuItem onClick={() => navigate('/primeiros-passos')}>
  <PlayCircle className="mr-2 h-4 w-4" />
  <span>Primeiros Passos</span>
</DropdownMenuItem>
```

Ordem: Trocar foto · Remover foto · **Meu Perfil · Primeiros Passos** · Comprar Créditos · Planos · Sair.

### 7. Editor admin — `src/components/admin/OnboardingVideoManagement.tsx`

Nova tela no painel admin:
- Toggle "URL externa (YouTube/Vimeo)" vs "Upload MP4".
- Modo URL: input de texto com validação básica.
- Modo MP4: input `accept="video/mp4,video/webm"`, upload para `onboarding-videos`, salva URL pública.
- Inputs para `title` e `description`.
- Preview ao vivo do player ao lado do formulário.
- Botão "Salvar alterações" → `update` no único row.

### 8. Menu do admin — `AdminLayout.tsx` + `Admin.tsx`

- Em `ADMIN_NAV`, adicionar no grupo **Conteúdo**:
  ```tsx
  { title: 'Primeiros Passos', url: '/admin/onboarding-video', icon: PlayCircle, group: 'Conteúdo' }
  ```
- Em `Admin.tsx`, adicionar `'onboarding-video'` no tipo `Section` e no map `COMPONENTS`.

---

### Arquivos novos
- `src/pages/PrimeirosPassos.tsx`
- `src/components/admin/OnboardingVideoManagement.tsx`
- 1 migração SQL (tabela + bucket + policies + seed)

### Arquivos editados
- `src/App.tsx`
- `src/components/auth/MultiStepSignup.tsx`
- `src/components/UserAvatarMenu.tsx`
- `src/components/admin/AdminLayout.tsx`
- `src/pages/Admin.tsx`

### Comportamento final
- **Recém-cadastrado** → vai automaticamente para `/primeiros-passos`.
- **Qualquer usuário** pode rever clicando na bolinha do avatar → **"Primeiros Passos"**.
- **Admin** gerencia vídeo, título e descrição em `/admin/onboarding-video`, alternando entre URL do YouTube/Vimeo ou upload de MP4 (até 100MB).
