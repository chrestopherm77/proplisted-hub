

# Disparar mensagem no grupo WhatsApp quando lead confirmar WhatsApp

## Resumo
Adicionar no `mega-webhook` (que já processa a confirmação do lead) um disparo de mensagem para o grupo WhatsApp com os dados do lead, no mesmo momento em que o email é enviado (após confirmação).

## Arquivo modificado

**`supabase/functions/mega-webhook/index.ts`** (após a chamada ao `notify-new-lead`, ~linha 116):

Adicionar uma chamada direta à Mega API (mesmo padrão usado no `notify-group-new-search`) para enviar mensagem ao grupo `120363425145687461@g.us`.

A mensagem será montada extraindo do `form_data`:
- **Interesse**: intention (Comprar/Vender/Alugar/Construir)
- **Dados relevantes**: cidade, UF, tipo de imóvel, finalidade, valor, quartos, etc. — sem nome nem telefone do lead

Formato:
```
🚀 Novo lead na sua região!

Interesse: Comprar um imóvel

São Paulo - SP
Residencial - Apartamento
3 quarto(s)
Moradia

Seja rápido! Leads recentes têm maior taxa de conversão.

Clique abaixo para entrar em contato agora:

👉 https://www.leadbay.com.br/leads
```

Os campos XXXXX serão preenchidos com: cidade/UF, tipo de imóvel, subtipo, quartos, finalidade, valor — o que estiver disponível no `form_data`. Campos ausentes são omitidos.

## Detalhes técnicos

- Usa `MEGA_API_TOKEN` (já configurado) e o mesmo endpoint de texto da Mega API
- Fire-and-forget (não bloqueia a resposta do webhook)
- Mapa de labels para traduzir intention: `BUY→Comprar`, `SELL→Vender`, `RENT→Alugar`, `BUILD→Construir`
- Extrai dados do flow correspondente (`formData.buy`, `.sell`, `.rent`, `.build`)
- Redeploy da function após edição

