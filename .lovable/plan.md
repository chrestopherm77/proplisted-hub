

# Plano: Ajustar Edge Function create-news-post

## Problemas identificados

1. **Limite de 500 caracteres no título** - precisa ser removido/aumentado
2. **Publicações separadas** - pela screenshot, o n8n está enviando 3 requisições separadas (título, imagem, notícia). A edge function já insere tudo junto quando recebe no mesmo POST. O problema é provavelmente no n8n, mas vou ajustar a function para ser mais flexível.

## Correções

### 1. Remover limite de 500 chars no título (linha 59-64)
Remover a validação que rejeita títulos com mais de 500 caracteres.

### 2. Tornar campos mais flexíveis
- Tornar `titulo` opcional (só `noticia` obrigatório), para que mesmo que o n8n envie parcialmente, não dê erro
- Aumentar limite da notícia para 50000 caracteres

## Arquivo afetado

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/create-news-post/index.ts` | Remover limite título, flexibilizar campos |

## Nota importante

O fato de título, imagem e conteúdo aparecerem como posts separados indica que o **n8n está fazendo 3 chamadas HTTP separadas** em vez de uma só. A edge function já insere tudo junto. Você precisa configurar o n8n para enviar **um único POST** com os 3 campos no mesmo JSON:

```json
{
  "titulo": "Título aqui",
  "imagem": "https://url-da-imagem.jpg",
  "noticia": "Conteúdo da notícia aqui"
}
```

