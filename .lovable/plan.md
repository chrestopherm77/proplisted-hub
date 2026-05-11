# Domínio próprio por portal via Vercel (proxy)

## Arquitetura

```
domínio do cliente → Vercel (DNS + SSL + rewrite) → proplisted-hub.lovable.app → BrokerDomainGate
```

A Vercel preserva o host original num header (`x-forwarded-host`), e o app usa esse header para identificar qual portal renderizar.

## O que será construído

### 1. Banco — índice único em `custom_domain`

Garantir que dois portais não possam reivindicar o mesmo domínio:

```sql
CREATE UNIQUE INDEX broker_portals_custom_domain_unique
  ON public.broker_portals (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;
```

Sem mudança de colunas — `custom_domain` já existe.

### 2. Detecção de host com suporte a proxy

Em `src/hooks/useBrokerPortal.ts` (`useBrokerPortalByDomain`) e em `BrokerDomainGate`, ler o host na seguinte ordem:

1. `?__host=` da query string (override de teste)
2. Header `x-forwarded-host` repassado via meta tag/headers (não disponível no client puro — ver nota técnica abaixo)
3. `window.location.hostname` (fallback atual)

Como SPA hospedada no Lovable não expõe headers ao client, a forma confiável é:

- Vercel injeta o domínio original na URL através de um **rewrite com query param**:
  ```json
  {
    "rewrites": [
      {
        "source": "/:path*",
        "destination": "https://proplisted-hub.lovable.app/:path*?__portal_host=:host"
      }
    ]
  }
  ```
- O hook lê `new URLSearchParams(location.search).get('__portal_host')` antes do `location.hostname`.
- O valor é guardado em `sessionStorage` para sobreviver à navegação client-side.

### 3. Tela admin: editor de portal com bloco "Domínio próprio"

Novo componente `src/components/admin/BrokerPortalEditor.tsx`, acessível pelo painel admin (lista de `broker_portals` → editar). Conteúdo:

- **Dados básicos do portal**: slug, template, fonte de imóveis, ativo/inativo (edição completa do registro).
- **Card "Domínio próprio"**:
  - Input `custom_domain` + Salvar.
  - Validação: minúsculas, sem `http://`, sem barra, formato de domínio.
  - Bloco de instruções dinâmico em 3 passos:
    1. Apontar DNS do domínio para a Vercel (`A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`) — com botão copiar.
    2. Adicionar o domínio no projeto Vercel `portais-proxy` (link externo + instruções).
    3. Aguardar propagação.
  - Botão **Verificar DNS**: faz `fetch('https://dns.google/resolve?name=...&type=A')` e mostra ✅ / ⚠️ / ❌.
  - Botão **Testar acesso**: abre `https://DOMINIO/?__portal_check=1` em nova aba.
  - Selo de status: `Não configurado` · `DNS aguardando` · `DNS OK` · `Ativo`.

### 4. Lista de portais no admin

Adicionar (ou estender, se já existir) uma tabela em `src/pages/Admin.tsx` com colunas: nome do portal, slug, custom_domain, status, ações (editar / ativar / desativar).

### 5. Documentação interna

Adicionar `docs/PORTAIS_DOMINIO.md` com o passo a passo da configuração da Vercel (criação do projeto `portais-proxy`, `vercel.json`, adição de domínios), para você consultar quando onboardar novos clientes.

## Detalhes técnicos

- `BrokerDomainGate` não muda de lugar — só passa a ler o host via helper novo `getEffectivePortalHost()` em `src/lib/portalHost.ts`.
- `MAIN_HOSTS` continua filtrando os domínios "do sistema" para não tentar buscar portal neles.
- RLS: o editor admin já está coberto por `Admins manage broker portals` (MASTER_ADMIN). Sem nova policy.
- Verificação de DNS é client-side via Google DNS-over-HTTPS — não precisa edge function.
- Preservar a query `__portal_host` ao navegar entre páginas dentro do portal (interceptar no `App.tsx` ou guardar em `sessionStorage` no primeiro mount).

## Fora de escopo

- Cadastro automatizado de domínio na Vercel (precisaria token da Vercel + edge function). Por ora, você adiciona manualmente no painel da Vercel.
- Emissão automática de certificado — Vercel cuida sozinha.
- Suporte a apontamento direto sem Vercel (Lovable Project Settings → Domains) — pode ser adicionado depois reusando o mesmo card de status.
