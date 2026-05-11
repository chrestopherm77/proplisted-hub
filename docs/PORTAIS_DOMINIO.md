# Domínio próprio para Portais de Corretor (via Vercel)

Este projeto roda em `proplisted-hub.lovable.app`. Para que cada portal de
corretor funcione no domínio do próprio cliente (ex: `imoveisjoao.com.br`),
usamos a Vercel como **proxy** na frente do Lovable.

```
domínio do cliente → Vercel (DNS + SSL + rewrite) → proplisted-hub.lovable.app
```

A Vercel injeta o domínio original na URL através de um rewrite com query
param (`?__portal_host=...`). O helper `src/lib/portalHost.ts` lê esse param
e o componente `BrokerDomainGate` usa esse host para descobrir qual portal
renderizar.

## 1. Setup único na Vercel

Faça uma única vez:

1. Crie um projeto vazio na Vercel chamado `portais-proxy`
   (Add New → Project → Import → "Skip" um repo, ou suba um repo com só o `vercel.json` abaixo).
2. Coloque na raiz do projeto este `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "https://proplisted-hub.lovable.app/$1?__portal_host=:host"
    }
  ]
}
```

> Obs: a sintaxe `:host` é capturada do header `Host` que a Vercel recebe.
> Se a versão da Vercel não interpolar `:host` no destination, use uma
> Edge Function que faça `fetch` repassando o `host` como query.

## 2. Para cada novo cliente

### 2.1 No painel admin do projeto

- Admin → **Portais de Imóveis** → editar portal → aba **Domínio**.
- Preencher `imoveisjoao.com.br` e salvar.
- A aba mostra os DNS records que precisam ser criados, botão de copiar e
  botão de **Verificar DNS** (consulta `dns.google`).

### 2.2 No registrador do cliente (Registro.br, GoDaddy etc.)

```
Tipo    Nome    Valor
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

### 2.3 No projeto `portais-proxy` da Vercel

- Settings → Domains → **Add** → `imoveisjoao.com.br`
- Repetir para `www.imoveisjoao.com.br`
- A Vercel emite SSL automaticamente.

### 2.4 Verificar

- Botão **Verificar DNS** na aba Domínio mostra ✅ quando o A record
  apontar para `76.76.21.21`.
- Acessar `https://imoveisjoao.com.br` deve abrir o portal do cliente.

## 3. Como o app reconhece o domínio

`src/lib/portalHost.ts → getEffectivePortalHost()`:

1. Lê `?__portal_host=...` da URL (vindo do rewrite da Vercel)
2. Persiste em `sessionStorage` (sobrevive à navegação SPA)
3. Cai para `window.location.hostname` se não houver

`useBrokerPortalByDomain()` usa esse host pra buscar o portal cujo
`custom_domain` bate.

## 4. Limites e cuidados

- **Plano Hobby da Vercel**: limite de ~50 domínios por projeto. Para mais,
  precisa Pro.
- **Não esqueça de cadastrar o domínio na Vercel**: só apontar DNS não basta —
  sem o domínio adicionado no projeto, a Vercel devolve 404.
- **SSL**: emitido automaticamente pela Vercel após DNS propagar.
- **Domínio único**: o banco tem índice único em
  `lower(broker_portals.custom_domain)`, impedindo dois portais com o mesmo
  domínio.
