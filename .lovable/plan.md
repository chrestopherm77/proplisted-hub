Identifiquei a causa provável do 404: o código atual usa o broker OAuth no caminho relativo `'/~oauth/initiate'`. Esse caminho só é interceptado pela infraestrutura do Lovable. Em deploy externo pela Vercel/GitHub, a Vercel tenta resolver `https://seu-dominio/~oauth/initiate` como rota do próprio site e cai no 404.

Também confirmei que o broker OAuth externo exige o `project_id` do projeto Lovable. Sem isso, a chamada para `https://oauth.lovable.app/initiate` retorna erro de autorização.

Plano de correção:

1. Ajustar a integração Google para deploy externo
   - Atualizar a criação do `createLovableAuth` para usar o broker absoluto `https://oauth.lovable.app/initiate`, em vez de `'/~oauth/initiate'`.
   - Incluir automaticamente o `project_id` correto nos parâmetros enviados ao broker.
   - Manter o uso do fluxo gerenciado do Lovable Cloud, sem trocar para `supabase.auth.signInWithOAuth`.

2. Corrigir o botão de Google
   - Remover o bloqueio antigo para preview `*.lovableproject.com`, porque ele não resolve o caso real do seu deploy na Vercel.
   - Enviar `redirect_uri: window.location.origin`, para o usuário voltar para o domínio atual depois do Google.
   - Adicionar `prompt: 'select_account'` para permitir escolha da conta Google.
   - Em caso de erro, mostrar uma mensagem mais clara em português, em vez de deixar o usuário cair em 404 sem explicação.

3. Garantir o redirecionamento pós-login/cadastro
   - Depois do retorno do Google e da sessão ser criada, redirecionar para `/cadastro-realizado`, mantendo a regra que depois leva para os primeiros passos.
   - O mesmo botão continuará funcionando tanto na página de cadastro quanto na página de login.

4. Observação importante sobre ambiente externo
   - Essa correção resolve o 404 causado pela Vercel não conhecer `'/~oauth/initiate'`.
   - Se depois disso o Google retornar erro de domínio/redirect não autorizado, aí será necessário conferir se o domínio usado na Vercel está permitido/configurado nas configurações de autenticação do Lovable Cloud. Mas o primeiro problema claro no código é o caminho relativo `'/~oauth/initiate'`.