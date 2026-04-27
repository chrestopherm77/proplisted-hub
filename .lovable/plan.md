## Objetivo

1. Mudar o fundo do badge "✨ Plano grátis disponível • Sem cartão de crédito" (Hero da Landing Page) do branco/transparente atual para o **verde da logo Conectae**.
2. Adicionar a logo `conectaeblue.png` ao projeto como asset oficial, disponível para uso no `BrandLogo` e configurações white-label.

---

## Mudanças propostas

### 1. Adicionar token de cor "brand-green" ao design system

Em `src/index.css`, adicionar uma variável HSL representando o verde da logo (aproximadamente `145 63% 42%` — verde médio similar ao da curva direita do logo):

```css
--brand-green: 145 63% 42%;
--brand-green-foreground: 0 0% 100%;
```

Em `tailwind.config.ts`, registrar a cor para uso via classes Tailwind:

```ts
"brand-green": {
  DEFAULT: "hsl(var(--brand-green))",
  foreground: "hsl(var(--brand-green-foreground))",
},
```

### 2. Aplicar o verde no badge do Hero

Em `src/pages/Index.tsx` (linhas ~108-114), o `<Badge>` do hero hoje usa `variant="secondary"` com fundo translúcido. Trocar para um estilo sólido verde:

```tsx
<Badge
  className="mb-6 px-4 py-1.5 text-xs font-medium bg-brand-green text-brand-green-foreground border-transparent shadow-lg shadow-brand-green/30 hover:bg-brand-green/90 animate-fade-in-up"
>
  {c.hero.badge_text}
</Badge>
```

Resultado: pílula verde sólida com texto branco, mantendo a posição/animação atuais.

### 3. Adicionar a logo Conectae como asset

- Copiar `user-uploads://conectaeblue.png` para `src/assets/conectae-logo.png`.
- A logo ficará disponível para:
  - Uso futuro no componente `BrandLogo` (substituir o ícone `Building2` pela logo real, se desejado em próxima iteração).
  - Configuração no admin (`HomePageEditor → header.brand_logo_url`) caso o admin queira definir essa logo como padrão da home.

> **Observação**: nesta etapa **não** vou alterar o `BrandLogo.tsx` automaticamente para já trocar o ícone pela imagem — quero confirmar com você se prefere:
> - (a) só salvar o asset agora, ou
> - (b) já substituir o ícone "predinho" do `BrandLogo` pela logo Conectae em todos os lugares (header da LP, sidebar, footer, etc.).
>
> Me diga depois da aprovação qual caminho seguir, ou já implemento só o (a) para ficar conservador.

---

## Arquivos afetados

- `src/index.css` — adicionar variáveis `--brand-green` / `--brand-green-foreground`.
- `tailwind.config.ts` — registrar cor `brand-green`.
- `src/pages/Index.tsx` — atualizar classes do `<Badge>` do hero.
- `src/assets/conectae-logo.png` — novo arquivo (cópia da imagem enviada).
