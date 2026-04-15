

# Ajustes no Balcão de Parcerias

## Resumo
Tres mudanças: (1) disparar mensagem no grupo WhatsApp quando nova procura for criada, (2) remover botão "Chamar no WhatsApp" do modal de oferta, (3) incluir nome e telefone do corretor na notificação de oferta.

---

## 1. Disparar mensagem no grupo ao criar nova procura

**`src/pages/NewPropertySearch.tsx`** (após o insert, junto com o `notify-alert-match`):
- Chamar uma nova edge function `notify-group-new-search` passando os dados da procura (estado, cidade, operação, tipo, zona, bairro, valor máximo).

**Nova edge function `supabase/functions/notify-group-new-search/index.ts`**:
- Recebe os dados da procura via POST
- Monta a mensagem formatada:
```
Nova Procura Cadastrada! 🚀

Estado: {state}
Cidade: {city}
Operação: {operation}
Tipo: {type}
Zona: {zone}
Bairro/Condomínio: {neighborhood}
Valor Máximo: {valueMax}

Há um parceiro aguardando por imóveis com este perfil. Clique abaixo para ver o contato e enviar oportunidades: https://www.leadbay.com.br/property-searches
```
- Envia via Mega API para o grupo `120363425145687461@g.us` usando o mesmo endpoint de texto (`/rest/sendMessage/megacode-Mj46Nd4U5tP/text`)
- Usa `MEGA_API_TOKEN` (já configurado)

## 2. Remover opção "Chamar no WhatsApp" do modal de oferta

**`src/pages/PropertySearches.tsx`** (linhas 898-916):
- Remover o botão "Chamar no WhatsApp" e o divisor "ou"
- Manter apenas o campo de link + botão "Enviar Link"
- Remover a função `handleWhatsAppOffer` (não será mais usada)

## 3. Incluir nome e telefone do corretor na notificação de oferta WhatsApp

**`supabase/functions/notify-offer-whatsapp/index.ts`**:
- Adicionar `offerUserPhone` ao schema (recebido do frontend)
- Incluir na mensagem enviada ao dono da procura: nome e telefone do corretor que enviou a oferta

**`src/pages/PropertySearches.tsx`** (`handleSendLink`):
- Buscar também o `phone` do perfil do usuário logado
- Enviar `offerUserPhone` junto no body da chamada a `notify-offer-whatsapp`

---

## Arquivos modificados
1. `src/pages/NewPropertySearch.tsx` — chamar edge function de grupo após criar procura
2. `supabase/functions/notify-group-new-search/index.ts` — **novo** — envia mensagem no grupo WhatsApp
3. `src/pages/PropertySearches.tsx` — remover botão WhatsApp do modal, enviar phone do corretor
4. `supabase/functions/notify-offer-whatsapp/index.ts` — incluir nome/telefone do corretor na mensagem

