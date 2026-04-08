# Deploy Real: Vercel + Supabase

## 1. Arquitetura alvo

- Frontend React/Vite servido pela Vercel.
- BFF Node.js executando como Serverless Function (`api/entry.js`) na Vercel, com rewrites em `vercel.json`.
- Persistência em Postgres do Supabase via `DATABASE_URL`.
- Agendamentos de jobs operacionais via `vercel.json` + Vercel Cron.

## 2. Pré-requisitos

- Projeto Supabase criado.
- Banco Postgres ativo com connection string (pooler).
- Projeto Vercel conectado ao repositório GitHub.

## 3. Variáveis obrigatórias na Vercel

```env
BFF_SERVERLESS=true
BFF_PERSISTENCE_MODE=postgres
DATABASE_URL=postgresql://...

BFF_AUTH_ENABLED=true
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
BFF_DEFAULT_ADMIN_EMAIL=admin@livelabel.local
BFF_DEFAULT_ADMIN_PASSWORD=TroqueEstaSenha!

CRON_SECRET=defina_um_segredo_forte
ALLOWED_ORIGINS=https://seu-frontend.vercel.app

ESL_HOST=https://esl.greendisplay.cn
ESL_CLIENT_ID=seu_client_id
ESL_SIGN=seu_sign
ESL_STORE_CODE=001
ESL_IS_BASE64=0
```

Observação importante:
- Sem `DATABASE_URL`, o runtime serverless entra em fallback `memory` para não derrubar a API.
- Para paridade cloud completa, valide em `GET /api/readyz` que `data.checks.persistence_mode` está como `postgres`.

## 4. Migração de schema e dados

Aplicar migrações do schema Postgres:

```bash
npm run bff:migrate:postgres
```

Migrar dados da base SQLite local (idempotente):

```bash
npm run bff:migrate:sqlite-to-postgres
```

Para apontar um arquivo SQLite específico:

```bash
npm run bff:migrate:sqlite-to-postgres -- --sqlite=C:\caminho\etiqueta_esl.sqlite
```

## 5. Cron jobs na Vercel

Agendamento padrão em `vercel.json`:

- `/api/internal/cron/all` (execução consolidada diária)

Rotas manuais disponíveis para diagnóstico/reprocessamento:

- `/api/internal/cron/product-sync`
- `/api/internal/cron/refresh-dispatch`
- `/api/internal/cron/status-poll`
- `/api/internal/cron/reconciliation`
- `/api/internal/cron/dead-letter`
- `/api/internal/cron/retention`

Todas exigem `Authorization: Bearer <CRON_SECRET>`.

## 6. Smoke checklist de go-live

1. `GET /api/healthz` retorna `200`.
2. `GET /api/readyz` retorna `200` com `db_ready=true`.
3. Login funciona em `/api/auth/login`.
4. Dashboard e listagens carregam sem erro.
5. Bind/unbind/refresh funcionam em fluxo real.
6. Rotas admin (`/api/admin/*`) respondem com RBAC correto.
7. Um ciclo de cron executa sem erro (`/api/internal/cron/all` manual com segredo).
