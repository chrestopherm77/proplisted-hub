

## Promover lucasphilbr@gmail.com a MASTER_ADMIN

O usuário `lucasphilbr@gmail.com` foi encontrado com ID `85d779a2-dd8b-4e67-83a6-7ac3e34b1131`. Atualmente possui apenas a role `USER`.

### Alteração necessária

Inserir uma nova entrada na tabela `user_roles` com:
- `user_id`: `85d779a2-dd8b-4e67-83a6-7ac3e34b1131`
- `role`: `MASTER_ADMIN`

Isso será feito via SQL INSERT usando o insert tool. A role `USER` existente será mantida — o usuário terá ambas as roles.

Após a promoção, o usuário terá acesso ao painel administrativo (`/admin`) com todas as permissões de administrador geral.

