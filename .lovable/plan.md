

# Plano: Renomear Marketplace, Abrir Lançamentos para Construtoras, Ajustar Cadastro

## 1. Renomear "Marketplace" para "Leads Disponíveis"

Trocar o texto em todos os lugares onde aparece:
- `src/components/Layout.tsx` linha 117: "Marketplace" -> "Leads Disponíveis"
- `src/components/MobileMenu.tsx` linha ~63: "Marketplace" -> "Leads Disponíveis"
- `src/pages/Leads.tsx`: verificar se tem título na página e renomear

## 2. Lançamentos: permitir acesso a Construtoras (PJ + CONSTRUTORA) e Admins

Atualmente, Lançamentos é restrito a `isAdmin`. Precisa expandir para incluir usuários PJ com `company_type = 'CONSTRUTORA'`.

**Mudanças no hook `useAuth`:**
- Adicionar campo `isConstrutora` que consulta `profiles.company_type` quando `person_type = 'PJ'`

**Mudanças nas páginas:**
- `src/pages/Launches.tsx`: trocar `isAdmin === false` por `!isAdmin && !isConstrutora`
- `src/pages/NewLaunch.tsx`: mesma lógica
- `src/pages/LaunchDetail.tsx`: verificar e ajustar se necessário
- `src/components/Layout.tsx`: mostrar link "Lançamentos" para admins OU construtoras
- `src/components/MobileMenu.tsx`: mesma lógica no menu mobile

## 3. Ajustar cadastro para incluir "Construtora" corretamente

O cadastro PJ já tem a opção CONSTRUTORA no step `PJCompanyTypeStep.tsx`. Verificar se:
- O valor `company_type = 'CONSTRUTORA'` está sendo salvo corretamente no perfil (sim, já está no `handleSubmit` do `MultiStepSignup`)
- A visualização está adequada (cards com ícones para Imobiliária e Construtora já existem)

Nenhuma mudança estrutural necessária no cadastro - o fluxo PJ já suporta Construtora. Apenas garantir que a visualização dos cards está ok.

## Detalhes técnicos

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useAuth.tsx` | Adicionar `isConstrutora: boolean` consultando `profiles` |
| `src/components/Layout.tsx` | Renomear "Marketplace", mostrar Lançamentos para construtoras |
| `src/components/MobileMenu.tsx` | Renomear "Marketplace", mostrar Lançamentos para construtoras |
| `src/pages/Launches.tsx` | Permitir acesso a construtoras |
| `src/pages/NewLaunch.tsx` | Permitir acesso a construtoras |
| `src/pages/LaunchDetail.tsx` | Verificar e ajustar guarda de rota |
| `src/pages/Leads.tsx` | Renomear título se aplicável |

