## Roleta de copies na confirmação WhatsApp

Hoje a função `send-lead-confirmation` envia sempre a **mesma copy** (interactive list message com botão "LIBERAR MEU ACESSO") para todo lead novo. Vamos adicionar **mais 2 versões** e fazer um revezamento aleatório a cada disparo.

### Como vai funcionar

A cada novo lead, o sistema sorteia 1 das 3 copies (distribuição uniforme) e envia. O botão e a estrutura interativa permanecem — muda apenas o texto, o título do botão e o título da linha selecionável.

### As 3 versões

**Versão 1 (atual — mantém)**
- Texto: "{Nome}, suas preferências foram recebidas..."
- Botão: `LIBERAR MEU ACESSO`
- Row title: `Liberar meu acesso`

**Versão 2 (nova)**
- Texto: "{Nome}, suas preferências foram enviadas para nossa rede! Centenas de profissionais da região acabam de ser notificados..."
- Botão: `LIBERAR MEU ACESSO`
- Row title: `Liberar meu acesso`

**Versão 3 (nova)**
- Texto: "Tudo pronto, {Nome}! Neste momento, diversos profissionais estão avaliando sua busca..."
- Botão: `ATIVAR MINHA BUSCA`
- Row title: `Ativar minha busca`

### Detalhes técnicos

Arquivo único alterado: `supabase/functions/send-lead-confirmation/index.ts`

1. Criar um array `MESSAGE_VARIANTS` com 3 objetos: `{ interactiveText, buttonText, rowTitle, rowDescription, fallbackText }`. Cada uma é uma função `(firstName) => string` para interpolar o nome.
2. Sortear uma variante via `Math.floor(Math.random() * MESSAGE_VARIANTS.length)`.
3. Passar a variante escolhida para `trySendListMessage` (que hoje tem texto/botão hardcoded) e para o fallback `trySendTextMessage`.
4. Logar qual variante foi enviada (`variant_index`) para conseguirmos auditar a distribuição depois nos logs.

Sem mudanças em frontend, banco, ou demais funções. O fluxo de `isOnWhatsApp` → list → fallback texto continua igual; só o conteúdo é parametrizado.
