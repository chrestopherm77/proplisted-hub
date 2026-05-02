Plano rápido e direto para resolver o erro da imagem (`redirect_uri is not allowed`):

1. Remover a gambiarra do broker externo
   - Parar de usar `https://oauth.lovable.app/initiate` com `project_id` manual.
   - Isso está causando o erro atual porque o domínio do Vercel não está liberado no broker gerenciado.

2. Implementar Google OAuth direto pelo backend do projeto
   - Alterar `GoogleAuthButton.tsx` para usar o cliente de autenticação do projeto com `signInWithOAuth({ provider: 'google' })`.
   - Usar `redirectTo: window.location.origin + '/cadastro-realizado'`, para voltar exatamente para a página de cadastro concluído após o Google.
   - Manter `prompt: 'select_account'` para o usuário escolher a conta Google.

3. Configurar a rota de retorno no app
   - Garantir que `/cadastro-realizado` trate o retorno do OAuth corretamente.
   - Se o Google voltar com sessão válida, segue para a experiência normal; se ainda estiver carregando a sessão, aguarda.

4. Se necessário, usar suas credenciais Google próprias
   - Você deverá configurar no painel de autenticação do backend do projeto:
     - Google Client ID
     - Google Client Secret
   - No Google Cloud Console, liberar:
     - Domínio autorizado: seu domínio na Vercel/domínio próprio
     - Redirect URL/callback exibida nas configurações de autenticação do backend
   - Eu não vou colocar Client Secret no frontend, porque isso seria inseguro.

5. Limpeza técnica
   - Remover ou deixar de usar `src/integrations/lovable/external-auth.ts`, pois ele foi uma tentativa anterior incorreta para Vercel.
   - Manter o botão Google tanto no cadastro quanto no login.

Resultado esperado:
- Ao clicar em “Entrar/Cadastrar com Google”, abre o Google.
- Depois do login, volta para `/cadastro-realizado`.
- Usuário do Google entra no sistema e continua recebendo o aviso para completar cadastro, conforme regra que você pediu.