
## Objetivo

Dar destaque à logo da marca do anunciante na página pública do imóvel (a "página de afiliado" que abre quando alguém clica em anunciar/visualizar) e modernizar o design — mantendo o background atual (`/images/portal-bg.jpg`).

Arquivo afetado: `src/pages/PublicPropertyLP.tsx`.

## Mudanças no Layout

### 1. Header com logo grande e em destaque
- Substituir o header compacto atual por um **hero header** com a logo bem maior:
  - Logo: `h-16 md:h-24` (hoje é `h-8`) — em um "card" branco/translúcido com sombra suave e borda arredondada, para a logo se destacar mesmo sobre fundos coloridos.
  - Nome da marca em fonte maior (`text-xl md:text-2xl`) ao lado da logo.
  - Quando não houver logo, mostrar um placeholder elegante com ícone grande + nome.
- Header fica `sticky` com leve `backdrop-blur` e gradiente sutil usando a `primary_color` da marca (quando existir) na borda inferior.

### 2. Faixa hero com logo em destaque (acima da galeria)
- Adicionar uma seção "apresentação da marca" entre o header e a galeria:
  - Logo grande centralizada (`h-20 md:h-28`) sobre um card translúcido.
  - Nome da marca + tagline curta ("Apresenta este imóvel" ou similar).
  - Linha decorativa com a cor primária da marca.
- Isso garante que a logo apareça **duas vezes** (header + hero), reforçando a marca do afiliado.

### 3. Card lateral "Fale com o corretor" reformulado
- Logo no topo do card aumenta de `h-10 w-10` para `h-16 w-auto` em destaque centralizado.
- Avatar/nome do corretor com tipografia maior.
- Botão WhatsApp maior, com ícone proeminente.

### 4. Refino visual geral (mesmo background)
- Manter `bg-fixed bg-cover` com `/images/portal-bg.jpg`.
- Cards com `rounded-2xl`, sombras mais suaves (`shadow-xl`) e `backdrop-blur-md`.
- Título do imóvel em `text-3xl md:text-4xl font-bold`.
- Preço em destaque com `text-3xl md:text-4xl` e badge da operação (Venda/Aluguel) maior.
- Características (quartos, banheiros, vagas) viram **chips/pills** com ícone + número, estilo mais moderno.
- Footer mantém marca do portal mas com a logo do afiliado pequena ao lado.

## Detalhes técnicos

```tsx
// Header com logo destacada
<header className="sticky top-0 z-40 backdrop-blur-md bg-card/80 border-b-2"
        style={primaryColor ? { borderBottomColor: primaryColor } : undefined}>
  <div className="container mx-auto px-4 py-4 max-w-6xl flex items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      {brandLogo ? (
        <div className="bg-white rounded-xl p-2 shadow-md">
          <img src={brandLogo} alt={brandName || 'Logo'}
               className="h-12 md:h-16 w-auto object-contain" />
        </div>
      ) : (
        <div className="h-12 md:h-16 w-12 md:w-16 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-8 w-8" style={primaryColor ? { color: primaryColor } : undefined} />
        </div>
      )}
      <div>
        <p className="font-bold text-lg md:text-2xl leading-tight">{brandName || 'Imóvel'}</p>
        <p className="text-xs text-muted-foreground">Apresenta este imóvel</p>
      </div>
    </div>
    <Badge variant="secondary" className="text-sm">Ref: {property.reference_code}</Badge>
  </div>
</header>

// Hero com logo grande (entre header e galeria)
<section className="container mx-auto px-4 pt-8 pb-4 max-w-6xl">
  <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 text-center">
    {brandLogo && (
      <img src={brandLogo} alt={brandName || 'Logo'}
           className="mx-auto h-20 md:h-28 w-auto object-contain mb-4" />
    )}
    <h2 className="text-xl md:text-2xl font-semibold">{brandName}</h2>
    <div className="h-1 w-16 mx-auto mt-3 rounded-full"
         style={{ backgroundColor: primaryColor || 'hsl(var(--primary))' }} />
  </div>
</section>
```

- Largura do container aumenta de `max-w-5xl` para `max-w-6xl` para acomodar o novo layout.
- Todas as alterações de cor continuam respeitando `primary_color` e `secondary_color` da marca quando definidos.
- 100% PT-BR mantido. Sem mudanças em rotas, banco ou auth.

## Não inclui

- Sem mudanças no banco de dados.
- Sem alterar o background (`portal-bg.jpg` permanece).
- Sem mudar o `LandingPageRenderer.tsx` (este é o page builder customizado, fluxo diferente).
