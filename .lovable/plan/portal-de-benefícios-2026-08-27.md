# Portal de Benefícios

Novo módulo onde parceiros (lojas, empresas) publicam benefícios/descontos para os corretores da plataforma, o corretor gera um voucher pessoal e o parceiro valida esse voucher no painel dele.

## Como vai funcionar

### 1. Parceiro (loja/empresa)
- Página pública `/parceiro-beneficios` com cadastro simples: nome do responsável, telefone, empresa, e-mail e senha.
- Após cadastro, a conta fica **pendente de aprovação**. Enquanto pendente, ele entra no painel mas vê apenas o aviso "Cadastro em análise".
- Aprovado, o parceiro tem um painel exclusivo (não vê o resto da plataforma) com:
  - **Meus benefícios**: criar/editar benefício (logo, banner, título, descrição, percentual de desconto, regras, cidade/UF, link/endereço). Cada benefício criado ou editado volta para status "pendente" até o admin aprovar.
  - **Validar voucher**: campo para digitar o código apresentado pelo corretor → mostra nome do corretor, benefício e desconto → botão "Validar". Registra o uso.
  - **Histórico**: lista de vouchers validados com data e corretor.

### 2. Corretor
- Nova página `/beneficios` no menu, no mesmo estilo visual do portal de Eventos: cards com logo do parceiro, nome, desconto em destaque e descrição, com filtro por UF/cidade.
- Ao abrir o benefício, botão **"Gerar meu voucher"** (disponível para qualquer usuário logado).
- O voucher aparece em destaque com o código, validade (fim do mês) e as regras. Ele pode reabrir e ver o mesmo código.
- Regra de uso: **1 validação por corretor, por benefício, por mês**. Se já usou no mês, mostra "Você já utilizou este benefício este mês — disponível novamente em [mês seguinte]".

### 3. Administrador
- Nova seção no admin: **Portal de Benefícios**, com duas abas:
  - **Parceiros**: aprovar/reprovar/desativar contas de parceiros.
  - **Benefícios**: aprovar/reprovar benefícios enviados, editar e destacar.
  - Relatório de vouchers gerados x validados.

### Código do voucher
Formato: 3 primeiras letras do nome do corretor + 4 dígitos do CPF/CNPJ + 2 caracteres aleatórios. Ex.: `CHR8421K3`. Se o perfil não tiver CPF/CNPJ, usa dígitos aleatórios no lugar. Código único no banco.

## Detalhes técnicos

**Banco (novas tabelas):**
- `benefit_partners` — user_id, empresa, nome do contato, telefone, e-mail, logo_url, status (PENDING/APPROVED/REJECTED/DISABLED).
- `benefits` — partner_id, título, descrição, regras, discount_percent, discount_label, banner_url, UF/cidade, link, status (PENDING/APPROVED/REJECTED), is_active, sort_order.
- `benefit_vouchers` — benefit_id, user_id, code (único), created_at. Único por (benefit_id, user_id).
- `benefit_redemptions` — voucher_id, benefit_id, user_id, partner_id, redeemed_at, reference_month (date). Índice único (benefit_id, user_id, reference_month) garantindo 1 uso/mês.
- Novo valor no enum `app_role`: `BENEFIT_PARTNER`, atribuído via `user_roles` na aprovação (nunca em profiles).
- Funções `security definer`:
  - `generate_benefit_voucher(p_benefit_id)` — cria/retorna o voucher do usuário logado com o código no formato acima.
  - `lookup_benefit_voucher(p_code)` — parceiro consulta o voucher (só dos próprios benefícios); retorna nome do corretor, benefício e se já foi usado no mês.
  - `redeem_benefit_voucher(p_code)` — valida com lock, grava a redenção e bloqueia repetição no mesmo mês.
- RLS: benefícios aprovados visíveis a autenticados; parceiro só enxerga/edita os próprios registros; admin acesso total; GRANTs para `authenticated` e `service_role` em todas as tabelas.

**Frontend:**
- `src/pages/Beneficios.tsx` (portal do corretor) + `BenefitVoucherDialog`.
- `src/pages/ParceiroBeneficios.tsx` — login/cadastro do parceiro; `src/pages/PainelParceiro.tsx` + componentes (Meus benefícios, Validar voucher, Histórico), com guarda de rota por role.
- `src/components/admin/BenefitPartnersManagement.tsx` e `BenefitsManagement.tsx`, registrados em `src/pages/Admin.tsx` e no menu do admin.
- Rotas em `App.tsx`, item "Benefícios" no `AppSidebar`, e novos slugs adicionados a `reservedSlugs.ts` (`beneficios`, `parceiro-beneficios`, `painel-parceiro`).
- Upload de logo/banner via storage (bucket público de benefícios), reutilizando o padrão de upload dos eventos.
- Interface 100% em português.

## Ordem de implementação
1. Migração do banco (tabelas, enum, RLS, funções, bucket).
2. Portal do corretor `/beneficios` + geração de voucher.
3. Cadastro/login e painel do parceiro (benefícios + validação).
4. Gestão no admin (aprovações e relatório).
