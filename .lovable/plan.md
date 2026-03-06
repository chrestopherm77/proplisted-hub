

## Expandir página de Perfil com todos os campos de cadastro

A página de perfil atual (`src/pages/Profile.tsx`) só permite editar nome, telefone e CRECI. Precisa incluir todos os campos que existem no cadastro.

### Alterações

**Arquivo: `src/pages/Profile.tsx`**

Reescrever o componente para carregar e salvar todos os campos da tabela `profiles`, organizados em cards por seção:

1. **Card "Dados Pessoais / Empresa"** (condicional ao `person_type`):
   - PF: Nome, CPF, Profissão (select: Corretor/Arquiteto/Engenheiro)
   - PJ: Razão Social (company_name), CNPJ, Tipo de empresa (company_type)

2. **Card "Localização"**:
   - Reutilizar o componente `LocationSelector` de `src/components/auth/LocationSelector.tsx` (Estado, Cidade via IBGE, Bairro)
   - Campo de endereço (address)

3. **Card "Dados Profissionais"** (condicional à profissão/tipo):
   - PF Corretor: CRECI + UF
   - PF Arquiteto: CAU + UF
   - PF Engenheiro: CREA + UF
   - PJ Imobiliária: CRECI PJ + UF, RT (nome, CPF)
   - PJ Construtora: CREA PJ + UF, RT (nome, CPF, CREA/CAU + UF)

4. **Card "Contato"**:
   - E-mail (disabled)
   - Telefone

5. **Card "Alterar Senha"** (mantém como está)

O state `profile` será expandido para incluir todos os campos (`person_type`, `cpf`, `cnpj`, `company_name`, `company_type`, `address`, `address_uf`, `address_city`, `address_neighborhood`, `profession`, `creci`, `creci_uf`, `cau`, `cau_uf`, `crea`, `crea_uf`, `creci_pj`, `creci_pj_uf`, `crea_pj`, `crea_pj_uf`, `rt_name`, `rt_cpf`, `rt_crea`, `rt_crea_uf`, `rt_cau`, `rt_cau_uf`).

O `handleSave` enviará todos esses campos no `update` (não `upsert`, pois o perfil já existe via trigger).

Não há alterações de banco de dados necessárias, pois a RLS já permite `UPDATE` no próprio perfil (`auth.uid() = id`).

