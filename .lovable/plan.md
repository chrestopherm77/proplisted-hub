

## Diagnóstico: erro 400 da Calculadora externa por estado

### Causa raiz
A API externa da Calculadora **rejeita os códigos de desconto dependendo do estado**. Logs de hoje (16:45):

```
status 400 — "Desconto MCMV não está disponível para o estado PR"
status 400 — "Desconto SFH não está disponível para o estado PR"
```

Ou seja: os códigos `SFH`, `MCMV` e `FAR` que estamos enviando estão **corretos e aceitos pela API**, mas cada estado define quais descontos aceita. O Paraná não aceita SFH nem MCMV — e provavelmente nem FAR.

### Bugs que isso revelou no nosso código

1. **Mensagem de erro genérica esconde o motivo real.** Hoje, quando a API retorna 400, mostramos *"A Calculadora externa não conseguiu processar a requisição."* — o usuário não tem ideia que o problema é desconto x estado. A edge function nem trata o status 400 (só trata 500/401/403/422/404), então cai no fallback genérico.

2. **Não tratamos status 400.** Adicionar tratamento que extrai `errorMessage` do body upstream e devolve para o usuário.

3. **UX do desconto é cega ao estado.** O usuário escolhe município de PR, depois seleciona "Minha Casa Minha Vida", calcula → erro genérico. Ele não sabe que precisa escolher outra opção (ou nenhuma).

### Plano de correção

#### A. Edge function `calculate-emoluments` — propagar mensagem de erro real
Tratar status `400` extraindo `errorMessage` do body da API e devolvendo essa string ao front. Assim o usuário vê *"Desconto MCMV não está disponível para o estado PR"* em vez da genérica.

#### B. Front (`src/pages/Calculadora.tsx`) — exibir o erro vindo do servidor
O toast já mostra `data.error`. Vou garantir que ele use a mensagem real (que agora virá específica) e não apenas o fallback genérico. Também limpar o desconto automaticamente após erro 400 relacionado a desconto, para o usuário não ficar preso.

#### C. Avisos visuais no modal de desconto (opcional, recomendado)
Adicionar um aviso pequeno no rodapé do modal de seleção de desconto:
> *"⚠️ Nem todos os descontos estão disponíveis em todos os estados. Se o cálculo falhar, tente sem desconto ou outra opção."*

Isso evita frustração antes do erro acontecer.

### O que NÃO vou fazer
- **Não vou criar lista hardcoded de "estado x desconto permitido"** — a API externa pode mudar regras a qualquer momento. Melhor confiar na resposta dela e mostrar a mensagem real.
- **Não vou alterar os códigos enviados** (`SFH`, `MCMV`, `FAR`) — eles estão corretos. Os logs confirmam que a API reconhece os códigos, ela só recusa por estado.

### Arquivos a editar
- `supabase/functions/calculate-emoluments/index.ts` — tratar 400 com `errorMessage` do upstream
- `src/pages/Calculadora.tsx` — aviso no modal de desconto + garantir que mensagem detalhada apareça

