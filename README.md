# Etiqueta ESL — Plataforma de Operação e Integração GreenDisplay

Sistema para operação de etiquetas eletrônicas de prateleira (ESL), com frontend React e BFF Node.js. O projeto suporta modo `mock` para demonstração e modo `real` com integração completa à API ESL do fornecedor.

## 1. O que o sistema faz

- Monitoramento de etiquetas (`online/offline`, bateria, AP, vínculo de produto).
- Atualização de preço individual e em lote.
- Bind/unbind de etiquetas com produtos e templates.
- Trigger de refresh em fila consolidada.
- Busca física de etiqueta por LED.
- Auditoria operacional e dead-letter para falhas.
- Jobs de sincronização, reconciliação, retenção e backup local.

## 2. Arquitetura resumida

```mermaid
flowchart LR
A[Frontend React] -->|/api/esl/*| B[BFF Node.js]
B -->|/api/{i_client_id} + sign| C[API ESL GreenDisplay]
C --> D[Cloud ESL]
D --> E[Base Station/AP]
E --> F[ESL Tags]
F --> E --> D --> C --> B --> A
```

## 3. Como o sistema funciona

### Frontend

- Stack: React 18 + Vite 6 + TypeScript.
- Camada ESL em `src/services/esl/*`.
- Tipos de contrato em `src/types/esl.ts`.
- Polling operacional em `src/hooks/useEslStatus.ts`.

### BFF

- Entrada: `server/index.js`.
- Rotas de negócio: `server/esl/routes.js`.
- Serviços ESL: `server/esl/*`.
- Auth JWT/RBAC: `server/auth/*`.
- Persistência por repositório: `server/db/repositories/*` (`memory` e `sqlite`).
- Infra de banco local: `server/db/sqlite/*`.
- Jobs: `server/jobs/*`.
- Observabilidade: `server/observability/*`.

## 4. Endpoints do BFF

### Operação ESL (`/api/esl/*`)

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/esl/health` | Saúde da integração ESL |
| GET | `/api/esl/templates` | Consulta templates |
| GET | `/api/esl/status/summary` | Resumo de status |
| GET | `/api/esl/status` | Consulta paginada |
| POST | `/api/esl/status/sync` | Forçar sync |
| POST | `/api/esl/status/query` | Consulta por lista |
| POST | `/api/esl/products/upsert` | Upsert unitário |
| POST | `/api/esl/products/upsert-bulk` | Upsert em lote |
| POST | `/api/esl/bind` | Bind unitário |
| POST | `/api/esl/bind/bulk` | Bind em lote |
| POST | `/api/esl/unbind` | Unbind |
| POST | `/api/esl/refresh/trigger` | Trigger de refresh |
| POST | `/api/esl/led/search` | LED search |
| POST | `/api/esl/direct` | Atualização direta |
| GET | `/api/esl/audit` | Auditoria |
| GET | `/api/esl/dead-letters` | Dead-letter |
| POST | `/api/esl/jobs/run` | Rodar ciclo de jobs manualmente |

### Autenticação e operação BFF

| Método | Rota | Uso |
|---|---|---|
| POST | `/api/auth/login` | Emite access/refresh token |
| POST | `/api/auth/refresh` | Renova token |
| POST | `/api/auth/logout` | Revoga refresh token |
| GET | `/healthz` | Liveness do processo |
| GET | `/readyz` | Readiness (config + DB + auth) |
| GET | `/metrics` | Métricas Prometheus |

## 5. Persistência local e backup

Modo configurável por `BFF_PERSISTENCE_MODE`:

- `sqlite` (padrão): persistência em arquivo local no PC do cliente.
- `memory`: desenvolvimento/testes sem persistência em disco.

Entidades persistidas no SQLite:

- `esl_bindings`
- `esl_status_snapshots`
- `esl_command_log`
- `dead_letters`
- `users`
- `refresh_tokens`

Estrutura local (por padrão no perfil do usuário):

- `data/etiqueta_esl.sqlite` (banco ativo)
- `backups/*.sqlite` (cópias locais)

Backup automático local:

- Job dedicado com `BFF_BACKUP_ENABLED=true`.
- Intervalo padrão diário (`BFF_BACKUP_INTERVAL_MS=86400000`).
- Retenção padrão de 7 arquivos (`BFF_BACKUP_RETENTION_COUNT=7`).

Restore manual assistido:

```bash
npm run bff:restore -- <caminho-do-backup.sqlite>
```

Com `--yes`, pula confirmação interativa:

```bash
npm run bff:restore -- <caminho-do-backup.sqlite> --yes
```

## 6. Segurança (JWT + RBAC)

Quando `BFF_AUTH_ENABLED=true`, rotas `/api/esl/*` exigem bearer token.

Perfis:

- `admin`: acesso total, incluindo `/api/esl/jobs/run` e `/api/esl/dead-letters`.
- `operador`: operações de negócio e monitoramento.
- `viewer`: leitura (`GET`) somente.

Importante:

- Usuário admin padrão é criado no startup (`BFF_DEFAULT_ADMIN_EMAIL` e `BFF_DEFAULT_ADMIN_PASSWORD`).
- Em produção, altere segredos JWT e senha padrão antes do go-live.

## 7. Quickstart

### Pré-requisitos

- Node.js 20+
- npm

### Instalação

```bash
git clone <url-do-repositorio>
cd etiqueta_esl
npm install
```

### Modo mock (rápido)

`.env`:

```env
VITE_API_MODE=mock
```

Execução:

```bash
npm run dev
```

### Modo real com BFF + SQLite local

`.env` mínimo:

```env
VITE_API_MODE=real
VITE_BFF_TARGET=http://127.0.0.1:8787

BFF_PORT=8787
BFF_PERSISTENCE_MODE=sqlite
BFF_DATA_DIR=
BFF_BACKUP_ENABLED=true
BFF_BACKUP_INTERVAL_MS=86400000
BFF_BACKUP_RETENTION_COUNT=7
BFF_AUTH_ENABLED=false

ESL_HOST=https://esl.greendisplay.cn
ESL_CLIENT_ID=seu_client_id
ESL_SIGN=seu_sign
ESL_STORE_CODE=001
ESL_IS_BASE64=0
```

Execução:

```bash
npm run bff
npm run dev
```

### Modo memória (apenas dev/testes)

`.env`:

```env
BFF_PERSISTENCE_MODE=memory
```

## 8. Variáveis de ambiente

| Variável | Finalidade | Exemplo |
|---|---|---|
| `VITE_API_MODE` | `mock` ou `real` no frontend | `real` |
| `VITE_BFF_TARGET` | Proxy do Vite para o BFF | `http://127.0.0.1:8787` |
| `VITE_FORCE_API_ERROR` | Força erro no mock | `false` |
| `VITE_ENABLE_MOCK_FAILURE` | Falhas aleatórias no mock | `false` |
| `BFF_PORT` | Porta HTTP do BFF | `8787` |
| `LOG_LEVEL` | Nível de log do BFF | `info` |
| `ESL_ENABLE_JOBS` | Habilita jobs periódicos ESL | `true` |
| `ESL_RETENTION_INTERVAL_MS` | Intervalo do job de retenção | `43200000` |
| `ESL_HOST` | Host da API vendor | `https://esl.greendisplay.cn` |
| `ESL_CLIENT_ID` | `i_client_id` da API | `default` |
| `ESL_SIGN` | Assinatura exigida pelo vendor | `***` |
| `ESL_STORE_CODE` | Código da loja | `001` |
| `ESL_IS_BASE64` | Flag vendor | `0` |
| `BFF_PERSISTENCE_MODE` | `sqlite` ou `memory` | `sqlite` |
| `BFF_DATA_DIR` | Diretório base local para banco/backup | `C:\\Users\\...\\AppData\\Local\\etiqueta_esl` |
| `BFF_BACKUP_ENABLED` | Liga job de backup local | `true` |
| `BFF_BACKUP_INTERVAL_MS` | Intervalo do backup automático | `86400000` |
| `BFF_BACKUP_RETENTION_COUNT` | Quantidade de backups mantidos | `7` |
| `BFF_AUTH_ENABLED` | Ativa JWT/RBAC | `true` |
| `JWT_ACCESS_SECRET` | Segredo access token | `***` |
| `JWT_REFRESH_SECRET` | Segredo refresh token | `***` |
| `JWT_ACCESS_TTL` | TTL do access token | `15m` |
| `JWT_REFRESH_TTL` | TTL do refresh token | `7d` |
| `BFF_DEFAULT_ADMIN_EMAIL` | Email admin bootstrap | `admin@etiqueta.local` |
| `BFF_DEFAULT_ADMIN_PASSWORD` | Senha admin bootstrap | `Admin@123` |
| `METRICS_ENABLED` | Liga endpoint e coletores | `true` |
| `ESL_COMMAND_LOG_RETENTION_DAYS` | Retenção de auditoria | `30` |
| `ESL_DEAD_LETTER_RETENTION_DAYS` | Retenção de dead-letter | `30` |

## 9. Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Frontend em desenvolvimento |
| `npm run bff` | Inicia o BFF |
| `npm run bff:restore` | Restaura banco SQLite de um backup local |
| `npm run test:bff` | Testes Vitest/Supertest do BFF |
| `npm run lint` | Lint do projeto |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run format` | Formatação automática |
| `npm run format:check` | Validação de formatação |

## 10. Testes

Cobertura atual de automação do BFF:

- Contrato de resposta e comportamento base.
- Login/refresh/logout com JWT.
- Persistência SQLite (repositórios e runtime).
- Backup local automático (retenção).
- Restore CLI (sucesso e falha controlada).

Execução:

```bash
npm run test:bff
```

## 11. Troubleshooting

- `readyz` em `503`: verificar `ESL_*`, modo de persistência e segredos JWT (quando auth ativo).
- `401` em `/api/esl/*`: token ausente/inválido com `BFF_AUTH_ENABLED=true`.
- `403` em `/api/esl/*`: perfil sem permissão para a rota.
- Falha de restore: confirmar caminho do arquivo e integridade do backup SQLite.

## 12. Documentação complementar

- Documento técnico detalhado: `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- Manual operacional do cliente: `docs/MANUAL_EXECUCAO_CLIENTE.md`
- Checklist de demo: `docs/DEMO_CHECKLIST.md`
- Estabilização histórica: `docs/ESTABILIZACAO_2026-03-04.md`

Base vendor utilizada:

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
