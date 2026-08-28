# Portal Conectaê — vitrine geral de imóveis com captação de interesse

Um portal público da Conectaê, com o mesmo visual do modelo Agnus Premium (template 1), reunindo **todos os imóveis ativos de todos os corretores**, sem nenhuma identificação do corretor.

## O que o visitante vê

- Endereço: `conectaeimob.com.br/portal-conectae`
- Home escura elegante (mesmo estilo Agnus), com logo e identidade Conectaê, busca e filtros (cidade, tipo, operação, faixa de preço, quartos).
- Grade de imóveis de toda a base ativa da plataforma.
- Página do imóvel: fotos, preço, ficha técnica, descrição, localização/mapa e imóveis similares.
- **Sem** nome do corretor, telefone, WhatsApp, CRECI, botão flutuante de WhatsApp, formulário de contato direto ou qualquer dado de contato. O rodapé é da Conectaê.

## Botão "Tenho interesse neste imóvel"

- Destacado na página do imóvel: fixo no rodapé da tela no mobile e em bloco fixo lateral no desktop, sempre visível.
- Ao clicar, abre um modal curto: **Nome** e **WhatsApp** (validados), com aviso claro de que o contato será repassado ao parceiro responsável pelo imóvel.
- Após enviar, aparece o modal de agradecimento: "Que bom que você gostou deste imóvel! Você pode continuar explorando outros imóveis do portal — selecione os que gostar e nossos parceiros entram em contato com você."
- O mesmo visitante pode se candidatar a vários imóveis (nome/telefone ficam guardados no navegador para o próximo envio ser em um clique). Envio repetido para o mesmo imóvel com o mesmo telefone é bloqueado com aviso amigável.

## Admin — "Leads do Portal"

Nova aba no painel admin listando cada interesse: data, nome, telefone, imóvel (ref/título/cidade), corretor dono do imóvel (nome/e-mail/telefone), status do envio ao webhook e botão de reenvio. Busca por nome/telefone/ref e filtro por status.

## Envio ao corretor (webhook)

Como ainda não há URL de webhook, todo o caminho fica pronto e inerte:
- Ao registrar o interesse, o sistema chama a rota de disparo; se o webhook não estiver configurado, o lead é salvo com status "pendente" e fica na fila para reenvio.
- Quando você informar a URL, basta cadastrá-la no segredo e todos os disparos (inclusive os pendentes, via botão reenviar) passam a sair automaticamente.
- Conteúdo enviado: nome e telefone do interessado, dados do imóvel (id, referência, título, cidade, preço, link) e dados do corretor dono (id, nome, telefone, e-mail).

## Detalhes técnicos

**Banco**
- Tabela `portal_property_leads`: `property_id`, `broker_user_id`, `name`, `phone` (normalizado 12 dígitos), `source` (`PORTAL_CONECTAE`), `webhook_status` (`PENDING`/`SENT`/`FAILED`), `webhook_last_error`, `webhook_sent_at`, `created_at`, `updated_at`, com trigger de `updated_at`.
- GRANTs + RLS: `INSERT` liberado para `anon` e `authenticated` (formulário público, sem leitura), `SELECT`/`UPDATE` apenas para `MASTER_ADMIN` via `has_role`, `ALL` para `service_role`.
- Índice único parcial em (`property_id`, `phone`) para evitar duplicidade.
- RPC `create_portal_property_lead(p_property_id, p_name, p_phone)` (security definer) que resolve o `broker_user_id` a partir de `properties.user_id`, valida o imóvel ativo e insere o registro — o cliente nunca envia o dono.

**Frontend**
- `src/pages/PortalConectae.tsx` + `src/components/portal-conectae/` (Header, Hero, PropertyCard, PropertyDetail, Footer, InterestDialog, ThanksDialog), clonados de `templates/template1/` e limpos de tudo que exibe corretor (`WhatsAppFab`, bloco de contato/CRECI, formulário WhatsApp em `PropertyDetail`).
- Branding fixo Conectaê (logo `src/assets/conectae-logo.png`, paleta escura + dourado já usada no template), sem depender de `broker_portals`.
- Dados via consulta pública a `properties` (`is_active = true`), sem campos de contato do corretor no select.
- Rota `/portal-conectae` em `src/App.tsx` (fora do gate de domínio), com título/meta e H1 próprios para SEO.

**Backend**
- Edge function `portal-lead-webhook`: recebe `lead_id`, monta o payload e faz POST na URL do segredo `PORTAL_LEAD_WEBHOOK_URL` (se ausente, marca `PENDING` e retorna ok), atualizando o status.
- Chamada disparada logo após o insert, e também pelo botão de reenvio no admin.

**Admin**
- `src/components/admin/PortalLeadsManagement.tsx` + nova aba em `src/pages/Admin.tsx`, seguindo o padrão de `LeadsManagement.tsx`.
