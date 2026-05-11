## Ajustes no template Agnus (template1) — página de detalhe do imóvel

Arquivo: `src/components/broker-portal/templates/template1/PropertyDetail.tsx`

### 1. Remover opção de e-mail no card de contato lateral
No card lateral (lado esquerdo do detalhe do imóvel) hoje existem dois botões: "WhatsApp" e "E-mail", além de um input de e-mail e exibição do e-mail copiável da imobiliária. A pessoa só deve ter o botão de WhatsApp.

Mudanças:
- Remover o botão "E-mail" e a função `sendEmail`.
- Remover o input "Seu email" do formulário.
- Remover o botão "Copiar e-mail" (`copyEmail`) e a exibição do e-mail logo abaixo do telefone.
- Remover `email` do estado `form` e os imports não utilizados (`Copy`).
- O botão de WhatsApp passa a ocupar a largura inteira (substituindo o `grid grid-cols-2`).

### 2. Descrição do imóvel
O bloco "Descrição do imóvel" hoje já lê de `property.additional_info`, que é o campo gravado no cadastro do imóvel no portal (form "Informações adicionais" em `NewProperty.tsx`). Ou seja, **a descrição já vem do portal** quando preenchida.

Para deixar mais claro e cobrir o caso de imóveis antigos sem `additional_info`, o bloco passa a também usar o `title` do imóvel como fallback:

```
property.additional_info || property.title || 'Sem descrição.'
```

Nenhuma outra mudança em layout, mapa, galeria ou imóveis similares.

### Resumo de arquivos alterados
- `src/components/broker-portal/templates/template1/PropertyDetail.tsx`
