

# Plano: Aplicar branding do parceiro na página principal (Index)

## Problema
A página principal (`Index.tsx`) tem "LeadBay" hardcoded em vários lugares: logo no header, textos como "Por que escolher o LeadBay?", "com o LeadBay", e logo/texto no footer. Quando acessada pelo domínio do parceiro, tudo continua mostrando LeadBay.

## Solução
Usar o `usePartner` no `Index.tsx` para substituir dinamicamente:

1. **Logo** (header e footer) → se parceiro, usar `partner.logo_url`; senão, logo LeadBay
2. **Textos com "LeadBay"** → substituir por `partner.name` quando `isPartnerSite`
   - "Por que escolher o **LeadBay**?" → "Por que escolher o **{nome}**?"
   - "com o **LeadBay**" → "com o **{nome}**"
   - "© 2025 **LeadBay**" → "© 2025 **{nome}**"

## Arquivo afetado
- `src/pages/Index.tsx` — importar `usePartner`, substituir logo e textos dinâmicos

## Nenhuma mudança no banco necessária

