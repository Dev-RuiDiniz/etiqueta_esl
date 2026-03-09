# Etiqueta ESL — Plataforma de Operação e Integração GreenDisplay

Sistema para operação de etiquetas eletrônicas de prateleira (ESL), com frontend React e BFF Node.js. O projeto suporta modo `mock` para demonstração e modo `real` com integração completa à API ESL do fornecedor.

## 1. O que o sistema faz

- Monitoramento de etiquetas (`online/offline`, bateria, AP, vínculo de produto).
- Atualização de preço individual e em lote.
- Bind/unbind de etiquetas com produtos e templates.
- Trigger de refresh em fila consolidada.
- Busca física de etiqueta por LED.
- Auditoria operacional e dead-letter para falhas.
- Jobs de sincronização, reconciliação e retenção.

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
- Persistência por repositório: `server/db/repositories/*` (`memory` e `postgres`).
- Migrações: `server/db/postgres/migrations/*`.
- Jobs: `server/jobs/*`.
- Observabilidade: `server/observability/*`.

## 4. Funcionalidades por tela

- `Dashboard`: visão consolidada de operação.
- `Etiquetas`: busca, filtros e status por etiqueta.
- `Atualizações`: fluxo individual e em lote.
- `Alertas`: acompanhamento de incidentes.
- `Histórico`: trilha de eventos operacionais.

## 5. Endpoints do BFF

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

## 6. Segurança (JWT + RBAC)

Quando `BFF_AUTH_ENABLED=true`, rotas `/api/esl/*` exigem bearer token.

Perfis:

- `admin`: acesso total, incluindo `/api/esl/jobs/run` e `/api/esl/dead-letters`.
- `operador`: operações de negócio e monitoramento.
- `viewer`: leitura (`GET`) somente.

Importante:

- Usuário admin padrão é criado no startup (`BFF_DEFAULT_ADMIN_EMAIL` e `BFF_DEFAULT_ADMIN_PASSWORD`).
- Em produção, altere segredos JWT e senha padrão antes do go-live.

## 7. Persistência

Modo configurável por `BFF_PERSISTENCE_MODE`:

- `memory`: desenvolvimento rápido.
- `postgres`: persistência relacional.

Tabelas principais (PostgreSQL):

- `esl_bindings`
- `esl_status_snapshots`
- `esl_command_log`
- `dead_letters`
- `users`
- `refresh_tokens`

Migrações:

- `npm run bff:migrate`
- `npm run bff:migrate:down`

## 8. Observabilidade

- Logs estruturados JSON com `pino`.
- Métricas Prometheus com `prom-client`:
  - latência e volume HTTP do BFF
  - latência/erros de chamadas vendor
  - execuções de jobs
  - tamanho de fila de refresh e dead-letter
- Health checks:
  - `/healthz`
  - `/readyz`
  - `/metrics`

## 9. Quickstart

### Pré-requisitos

- Node.js 20+
- npm
- PostgreSQL (opcional, quando usar `postgres`)

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

### Modo real com BFF + memória

`.env` mínimo:

```env
VITE_API_MODE=real
VITE_BFF_TARGET=http://127.0.0.1:8787

BFF_PORT=8787
BFF_PERSISTENCE_MODE=memory
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

### Modo real com PostgreSQL

`.env` adicional:

```env
BFF_PERSISTENCE_MODE=postgres
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/etiqueta_esl
```

Aplicar migrações e iniciar:

```bash
npm run bff:migrate
npm run bff
npm run dev
```

## 10. Variáveis de ambiente

| Variável | Finalidade | Exemplo |
|---|---|---|
| `VITE_API_MODE` | `mock` ou `real` no frontend | `real` |
| `VITE_BFF_TARGET` | Proxy do Vite para o BFF | `http://127.0.0.1:8787` |
| `VITE_FORCE_API_ERROR` | Força erro no mock | `false` |
| `VITE_ENABLE_MOCK_FAILURE` | Falhas aleatórias no mock | `false` |
| `BFF_PORT` | Porta HTTP do BFF | `8787` |
| `LOG_LEVEL` | Nível de log do BFF | `info` |
| `ESL_ENABLE_JOBS` | Habilita jobs periódicos | `true` |
| `ESL_RETENTION_INTERVAL_MS` | Intervalo do job de retenção | `43200000` |
| `ESL_HOST` | Host da API vendor | `https://esl.greendisplay.cn` |
| `ESL_CLIENT_ID` | `i_client_id` da API | `default` |
| `ESL_SIGN` | Assinatura exigida pelo vendor | `***` |
| `ESL_STORE_CODE` | Código da loja | `001` |
| `ESL_IS_BASE64` | Flag vendor | `0` |
| `BFF_PERSISTENCE_MODE` | `memory` ou `postgres` | `postgres` |
| `DATABASE_URL` | Conexão PostgreSQL | `postgres://...` |
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

## 11. Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Frontend em desenvolvimento |
| `npm run bff` | Inicia o BFF |
| `npm run bff:migrate` | Aplica migrações PostgreSQL |
| `npm run bff:migrate:down` | Rollback da última migração |
| `npm run test:bff` | Testes Vitest/Supertest do BFF |
| `npm run lint` | Lint do projeto |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run format` | Formatação automática |
| `npm run format:check` | Validação de formatação |

## 12. Testes

Cobertura atual de automação do BFF:

- Contrato de resposta e comportamento base.
- Login/refresh/logout com JWT.
- RBAC por rota e perfil.
- Persistência PostgreSQL (executa quando `DATABASE_URL` estiver disponível).

Execução:

```bash
npm run test:bff
```

## 13. Troubleshooting

- `readyz` em `503`: verificar `ESL_*`, `DATABASE_URL` (modo postgres), segredos JWT (quando auth ativo).
- `401` em `/api/esl/*`: token ausente/inválido com `BFF_AUTH_ENABLED=true`.
- `403` em `/api/esl/*`: perfil sem permissão para a rota.
- Falha de refresh/status: revisar conectividade AP/Base Station e disponibilidade vendor.

## 14. Documentação complementar

- Documento técnico detalhado: `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- Manual operacional do cliente: `docs/MANUAL_EXECUCAO_CLIENTE.md`
- Checklist de demo: `docs/DEMO_CHECKLIST.md`
- Estabilização histórica: `docs/ESTABILIZACAO_2026-03-04.md`

Base vendor utilizada:

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
