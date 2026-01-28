

## Plano: Correção de 5 Erros de Segurança

### Resumo

O sistema detectou 5 vulnerabilidades de segurança que precisam ser corrigidas:

1. **Políticas RLS muito permissivas** nas tabelas de verificação (SELECT e UPDATE com `USING (true)`)
2. **Proteção contra senhas vazadas desabilitada**
3. **Sintaxe incorreta no search_path** da função `handle_new_user()`

---

## Problemas Identificados

| # | Problema | Severidade | Tabela/Função |
|---|----------|------------|---------------|
| 1 | SELECT público permite ler todos os códigos de verificação | Alto | whatsapp_verification_codes |
| 2 | UPDATE público permite marcar qualquer código como verificado | Alto | whatsapp_verification_codes |
| 3 | SELECT público expõe códigos de email | Alto | email_verification_codes |
| 4 | UPDATE público permite bypass de verificação de email | Alto | email_verification_codes |
| 5 | Proteção contra senhas vazadas desabilitada | Médio | Auth settings |

---

## Análise das Políticas Atuais

```text
whatsapp_verification_codes:
├── INSERT → WITH CHECK (true) ✓ (necessário para enviar código)
├── SELECT → USING (true) ✗ (PERIGO: qualquer um lê tudo)
├── UPDATE → USING (true) ✗ (PERIGO: qualquer um marca como verificado)
└── DELETE → has_role('MASTER_ADMIN') ✓

email_verification_codes:
├── INSERT → WITH CHECK (true) ✓ (necessário para enviar código)
├── SELECT → USING (true) ✗ (PERIGO: qualquer um lê tudo)
├── UPDATE → USING (true) ✗ (PERIGO: qualquer um marca como verificado)
└── DELETE → has_role('MASTER_ADMIN') ✓
```

---

## Solução

### Por que podemos remover SELECT e UPDATE públicos?

A verificação de código **já acontece via Edge Function** usando a `SERVICE_ROLE_KEY`, que **bypassa completamente o RLS**. Isso significa:

1. **send-whatsapp-code** → Usa service role para INSERT (funciona)
2. **verify-whatsapp-code** → Usa service role para SELECT/UPDATE (funciona)
3. **send-email-code** → Usa service role para INSERT (funciona)
4. **verify-email-code** → Usa service role para SELECT/UPDATE (funciona)

**Conclusão**: O cliente nunca precisa fazer SELECT ou UPDATE direto nas tabelas de verificação. Podemos remover essas políticas sem quebrar nada!

---

## Alterações a Realizar

### 1. Migração SQL - Remover Políticas Perigosas

```sql
-- =====================================================
-- Correção de Segurança: Remover políticas RLS perigosas
-- =====================================================

-- WHATSAPP VERIFICATION CODES
-- Remover SELECT público (dados sensíveis expostos)
DROP POLICY IF EXISTS "Allow public select" ON whatsapp_verification_codes;

-- Remover UPDATE público (permite bypass de verificação)
DROP POLICY IF EXISTS "Allow public update" ON whatsapp_verification_codes;

-- EMAIL VERIFICATION CODES
-- Remover SELECT público (dados sensíveis expostos)
DROP POLICY IF EXISTS "Allow public select for email verification" ON email_verification_codes;

-- Remover UPDATE público (permite bypass de verificação)
DROP POLICY IF EXISTS "Allow public update for email verification" ON email_verification_codes;

-- =====================================================
-- Correção: search_path da função handle_new_user
-- =====================================================

-- Recriar função com sintaxe correta (= ao invés de TO)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    name, 
    phone, 
    creci_number, 
    accepted_terms,
    person_type,
    cpf,
    address,
    company_name,
    cnpj,
    company_type,
    creci_pj,
    creci_pj_uf,
    crea_pj,
    crea_pj_uf,
    rt_name,
    rt_cpf,
    rt_crea,
    rt_crea_uf,
    rt_cau,
    rt_cau_uf,
    profession,
    creci,
    creci_uf,
    cau,
    cau_uf,
    crea,
    crea_uf
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'company_name'),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'creci_number',
    COALESCE((NEW.raw_user_meta_data->>'accepted_terms')::BOOLEAN, false),
    NEW.raw_user_meta_data->>'person_type',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'cnpj',
    NEW.raw_user_meta_data->>'company_type',
    NEW.raw_user_meta_data->>'creci_pj',
    NEW.raw_user_meta_data->>'creci_pj_uf',
    NEW.raw_user_meta_data->>'crea_pj',
    NEW.raw_user_meta_data->>'crea_pj_uf',
    NEW.raw_user_meta_data->>'rt_name',
    NEW.raw_user_meta_data->>'rt_cpf',
    NEW.raw_user_meta_data->>'rt_crea',
    NEW.raw_user_meta_data->>'rt_crea_uf',
    NEW.raw_user_meta_data->>'rt_cau',
    NEW.raw_user_meta_data->>'rt_cau_uf',
    NEW.raw_user_meta_data->>'profession',
    NEW.raw_user_meta_data->>'creci',
    NEW.raw_user_meta_data->>'creci_uf',
    NEW.raw_user_meta_data->>'cau',
    NEW.raw_user_meta_data->>'cau_uf',
    NEW.raw_user_meta_data->>'crea',
    NEW.raw_user_meta_data->>'crea_uf'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'USER');
  
  RETURN NEW;
END;
$function$;
```

---

### 2. Habilitar Proteção contra Senhas Vazadas

Usar a ferramenta de configuração de autenticação para habilitar:
- `leaked_password_protection: enabled`

---

### 3. Atualizar Findings de Segurança

Após aplicar as correções:
- Deletar findings corrigidos
- Marcar como ignorado o finding sobre `dangerouslySetInnerHTML` (já seguro)
- Atualizar finding sobre admin client-side (risco baixo, RLS protege os dados)

---

## Impacto nas Funcionalidades

| Funcionalidade | Afetada? | Motivo |
|----------------|----------|--------|
| Verificação WhatsApp no /lp | Não | Edge function usa service role |
| Verificação Email no cadastro | Não | Edge function usa service role |
| Cadastro de usuário | Não | Apenas corrige sintaxe |
| Login/Senha | Melhorado | Proteção contra senhas vazadas |

---

## Resumo das Ações

| Tipo | Ação |
|------|------|
| Migração SQL | Remover 4 políticas RLS perigosas + corrigir função |
| Configuração Auth | Habilitar leaked password protection |
| Findings | Atualizar status após correções |

---

## Segurança Após Correções

```text
whatsapp_verification_codes:
├── INSERT → WITH CHECK (true) ✓
├── SELECT → [REMOVIDO] (via service role apenas)
├── UPDATE → [REMOVIDO] (via service role apenas)
└── DELETE → has_role('MASTER_ADMIN') ✓

email_verification_codes:
├── INSERT → WITH CHECK (true) ✓
├── SELECT → [REMOVIDO] (via service role apenas)
├── UPDATE → [REMOVIDO] (via service role apenas)
└── DELETE → has_role('MASTER_ADMIN') ✓
```

