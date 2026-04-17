

## Ajustes na Calculadora de Emolumentos

### 1. Expandir área do resultado (largura)
Hoje o container do resultado é `max-w-5xl` (1024px), o que faz a tabela com várias colunas de componentes (Tribunal de Justiça, Defensoria, etc.) rolar horizontalmente.

**Mudança:** Ampliar o container apenas na etapa `result` para `max-w-7xl` (1280px), dando ~256px a mais de espaço útil. O scroll horizontal interno (`overflow-x-auto`) continua como fallback de segurança em telas menores. As outras etapas (location, service, form) permanecem no `max-w-5xl` atual para não ficarem com formulário esticado demais.

### 2. Botão "Possui desconto?" → modal com cards de seleção
Hoje o botão abre um collapsible com um `<Input>` livre onde o usuário precisa digitar o código manualmente.

**Mudança:** Trocar o `Collapsible` por um `Dialog` (modal) que mostra 3 cards selecionáveis lado a lado, exatamente no padrão da segunda imagem:

- **Card 1: 1ª Aquisição SFH** — texto longo com botão "mais" para expandir/recolher
- **Card 2: Minha Casa Minha Vida** — texto curto, sem "mais"
- **Card 3: FAR e FDS** — texto curto, sem "mais"

Cada card é clicável: ao clicar, marca como selecionado (borda azul mais grossa + bg sutil), preenche o `desconto` no estado e fecha o modal automaticamente. Um quarto botão "Sem desconto" no rodapé do modal limpa a seleção.

Após selecionar, o botão da tela do formulário muda de **"% Possui Desconto?"** para **"% Desconto: 1ª Aquisição SFH ✕"** (com X para limpar), confirmando visualmente a escolha — igual ao padrão visual da primeira imagem enviada.

### 3. Códigos enviados à API (preciso confirmar com você)
Você mencionou que enviaria "os textos e o código do desconto", mas só recebi os textos. A edge function `calculate-emoluments` envia `desconto` como string livre para a API externa. Antes de implementar preciso saber **qual string exata** corresponde a cada opção, pois é o que a API da calculadora vai interpretar.

### Arquivos a editar
- `src/pages/Calculadora.tsx` — trocar wrapper para `max-w-7xl` na etapa result; substituir `Collapsible` por `Dialog` com 3 cards de desconto; adicionar estado `descontoLabel` para mostrar nome amigável no botão.

### Pergunta antes de implementar

