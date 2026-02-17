

## Plano: Substituir Ícone + Texto "LeadBay" pela Logo

### Resumo

Copiar a imagem da logo enviada para o projeto e substituir todas as ocorrências do ícone `Package` + texto "LeadBay" pela imagem da logo.

---

### Passo 1: Copiar a logo para o projeto

Salvar `user-uploads://white.png` em `src/assets/leadbay-logo.png` para uso via import nos componentes React.

---

### Passo 2: Substituir logo em todos os arquivos

| Arquivo | O que mudar |
|---------|-------------|
| `src/components/Layout.tsx` | Header: trocar `<Package>` + `<span>LeadBay</span>` por `<img>` da logo (~h-8 no desktop) |
| `src/components/MobileMenu.tsx` | Sheet title: trocar ícone + texto pela logo (~h-6) |
| `src/pages/Index.tsx` | Hero header, footer: trocar ícone + texto pela logo |
| `src/pages/Auth.tsx` | Topo e card de login: trocar ícone + texto pela logo |
| `src/pages/LeadForm.tsx` | Header do formulário: trocar `<h1>LeadBay</h1>` pela logo |

### Detalhes Técnicos

Em cada componente, a substituição segue o padrão:

**Antes:**
```tsx
<Package className="h-6 w-6 text-primary" />
<span className="text-lg font-bold text-primary">LeadBay</span>
```

**Depois:**
```tsx
import leadbayLogo from "@/assets/leadbay-logo.png";
// ...
<img src={leadbayLogo} alt="LeadBay" className="h-8" />
```

O tamanho (`h-6`, `h-8`, `h-10`, `h-12`) será ajustado conforme o contexto de cada local. Textos como "Por que escolher o LeadBay?" e "© 2025 LeadBay" permanecem como texto puro pois fazem parte do conteúdo, nao do logo.

