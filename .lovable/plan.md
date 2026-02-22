

## Limitar cadastros por numero de telefone (maximo 2 contas)

### O que sera feito

Impedir que um mesmo numero de telefone seja usado para criar mais de 2 contas no sistema. A validacao sera feita em duas camadas: no banco de dados (seguranca) e no frontend (experiencia do usuario).

### Alteracoes

| Arquivo / Recurso | O que muda |
|---|---|
| **Banco de dados** (migration) | Criar uma funcao + trigger na tabela `profiles` que verifica, antes de inserir, se ja existem 2 registros com o mesmo telefone. Se sim, bloqueia o INSERT |
| **`src/components/auth/MultiStepSignup.tsx`** | Antes de prosseguir do step 2 (dados gerais), consultar o banco para verificar se o telefone ja tem 2 contas. Mostrar erro caso positivo |

### Detalhes tecnicos

**1. Migration SQL - Trigger de validacao**

Criar uma funcao `check_phone_limit()` que conta quantos perfis existem com o mesmo telefone (ignorando formatacao). Se ja houver 2, lanca uma excecao impedindo o INSERT.

```text
profiles INSERT
  -> trigger BEFORE INSERT
  -> check_phone_limit()
  -> conta registros com mesmo phone
  -> se >= 2, RAISE EXCEPTION
```

**2. Frontend - Validacao antecipada**

No `MultiStepSignup.tsx`, ao validar o step 2, fazer uma consulta RPC (funcao no banco) que retorna a contagem de perfis com aquele telefone. Se ja tiver 2, exibir mensagem de erro no campo telefone: "Este telefone ja esta vinculado ao numero maximo de contas permitidas."

Para isso, sera criada uma funcao RPC `check_phone_availability(p_phone text)` que retorna `true` se ainda pode cadastrar (menos de 2 contas) ou `false` se ja atingiu o limite. Essa funcao sera acessivel sem autenticacao (para funcionar durante o cadastro).

### Fluxo do usuario

1. Usuario preenche dados no step 2 (incluindo telefone)
2. Ao clicar "Avancar", o sistema consulta se o telefone ja tem 2 contas
3. Se sim: mostra erro "Este telefone ja possui o limite maximo de contas cadastradas"
4. Se nao: segue normalmente para o proximo passo
5. Mesmo que alguem burle o frontend, o trigger no banco impede a insercao

