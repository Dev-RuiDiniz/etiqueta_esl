# Decisões: RBAC e Painel Administrativo

Data: 2026-04-08

## Objetivo

Substituir o modelo antigo de perfis por um RBAC mais alinhado à operação atual do sistema e introduzir uma central administrativa moderna para acompanhamento de usuários, base stations e templates.

## Decisões tomadas

### 1. Novo modelo oficial de perfis

Os papéis antigos `viewer`, `operador` e `admin` foram substituídos por:

- `usuario`: operação diária e acompanhamento
- `administrador`: operação + gestão administrativa de usuários
- `desenvolvedor`: super administrador com acesso total

### 2. Convenção de permissões

- `usuario`
  - pode acessar leitura e mutações operacionais em `/api/esl/*`
  - não pode usar `/api/admin/*`
  - não pode acessar dead-letters, auditoria completa ou jobs manuais sensíveis
- `administrador`
  - pode acessar `/api/admin/dashboard`
  - pode listar, criar, editar, redefinir senha e revogar sessão de usuários comuns
  - não pode criar nem promover contas para `desenvolvedor`
  - não pode acessar rotas sensíveis exclusivas de manutenção
- `desenvolvedor`
  - acesso total a superfícies operacionais e administrativas
  - pode executar ações sensíveis como jobs manuais e inspeção de dead-letters

### 3. Seed inicial do sistema

O usuário padrão criado no bootstrap do BFF agora nasce com papel `desenvolvedor`, mantendo as variáveis existentes:

- `BFF_DEFAULT_ADMIN_EMAIL`
- `BFF_DEFAULT_ADMIN_PASSWORD`

Os nomes das variáveis foram preservados para evitar quebra de setup existente.

### 4. Escopo da v1 do painel administrativo

Entrou nesta versão:

- dashboard administrativo agregado
- acompanhamento de usuários
- acompanhamento de base stations
- acompanhamento de templates
- gestão de usuários
- navegação condicional por perfil

Ficou fora desta versão:

- CRUD de base stations
- CRUD de templates
- trilha de auditoria específica para ações administrativas de usuário
- feature flags ou capacidades mais granulares além do papel principal

### 5. Contrato administrativo novo

Foram adicionados os endpoints:

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/reset-password`
- `POST /api/admin/users/:id/revoke-sessions`

Todos seguem o envelope padrão do BFF.

### 6. Decisão de resiliência do painel admin

O dashboard administrativo não deve falhar por completo quando a consulta de templates ao vendor estiver indisponível. Nesses casos:

- a seção de templates degrada para estado vazio
- a central continua exibindo usuários, status ESL e stations locais

### 7. Navegação e frontend

- `/admin`: central administrativa
- `/admin/usuarios`: gestão de contas

A UI esconde módulos administrativos para perfis sem acesso, mas a proteção final continua no backend.

## Observações operacionais

- redefinição de senha revoga as sessões ativas do usuário-alvo
- troca de papel também revoga sessões ativas do usuário-alvo
- em ambientes sem autenticação habilitada, o frontend mantém acesso amplo para não bloquear o uso local do sistema
