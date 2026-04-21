
## Incluir logo na geração com IA + remover cor da marca

### O que será feito

**1. Edge function `generate-creative-image/index.ts` — enviar a logo para a IA**

- Buscar `logo_url` da tabela `user_brands` do dono do criativo.
- Se houver logo, baixar e converter para base64 (já existe a função `imageUrlToBase64`).
- Enviar **duas** imagens no `parts` da chamada Gemini:
  1. Imagem principal do imóvel (já enviada hoje).
  2. Logo da marca do usuário (nova).
- Atualizar o prompt final para informar explicitamente:
  - Que a primeira imagem é o imóvel de referência.
  - Que a segunda imagem é a logo da imobiliária/corretor e que ela **deve aparecer no criativo final**, posicionada na `logo_position` do registro principal (canto inferior direito por padrão), em tamanho discreto e legível, sem distorcer a logo.
  - Caso não exista logo, manter o prompt atual sem menção a logo.

**2. Componente `MyBrand.tsx` — remover seleção de cor**

- Remover o bloco "Cor primária da marca" (Label + 2 inputs de cor).
- Remover o `useState` de `primaryColor` e a leitura/escrita de `primary_color` no `load()` e `handleSave()`.
- Salvar apenas `logo_url` no upsert de `user_brands`.
- Manter a coluna `primary_color` no banco (não precisa migration; só deixa de ser editada/usada na UI). Isso evita risco em qualquer outro lugar que ainda leia o campo.

### Detalhes técnicos

- O `logo_position` virá do registro principal em `creatives.mockup_images[0]` não existe — a posição da logo do criativo principal hoje está em `slots[0].position` do wizard mas **não é persistida** para o `main_image_url`. Vou persistir também em uma nova chave do JSON existente, OU simplesmente passar `logo_position` direto na chamada da edge function via `body` do `invoke`. Abordagem escolhida: ler de `slots[0].position` no `GenerateCreative.tsx` e enviar como campo extra ao salvar — adicionar `logo_position` no insert do `creatives` apenas se a coluna existir; se não existir, passamos via `body` do `functions.invoke` e a edge function lê do payload (sem alterar schema).
- Fallback de posição se vier vazio: `bottom-right`.
- Não alterar `MODEL_MAP`, fluxo de status, storage ou autenticação.

### Resultado

- A IA recebe a logo junto com a foto do imóvel e é instruída a inseri-la no criativo final, na posição escolhida.
- A tela "Minha Marca" passa a ter apenas upload/remoção de logo, sem campo de cor.
