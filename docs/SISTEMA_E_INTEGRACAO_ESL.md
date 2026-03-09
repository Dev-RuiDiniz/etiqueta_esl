# Sistema e Integração ESL (Visão Técnica)

## 1. Visão geral

O projeto `etiqueta_esl` integra uma aplicação React com o ecossistema ESL GreenDisplay por meio de um BFF Node.js. A arquitetura foi evoluída para suportar persistência relacional, autenticação JWT com RBAC, observabilidade e testes automatizados.

Objetivos da integração:

- Orquestrar operações de produto, bind/unbind, refresh e status de etiquetas.
- Isolar credenciais vendor no backend.
- Garantir rastreabilidade operacional (auditoria e dead-letter).
- Permitir operação em modo local (`memory`) e produção (`postgres`).

## 2. Arquitetura fim a fim

```mermaid
flowchart LR
A[Frontend React] -->|/api/esl/*| B[BFF Node.js]
B -->|/api/{i_client_id} + sign| C[API ESL GreenDisplay]
C --> D[Cloud ESL]
D --> E[Base Station/AP]
E --> F[Etiquetas ESL]
F --> E --> D --> C --> B --> A
```

Componentes:

1. Frontend: interface operacional (dashboard, etiquetas, atualizações, alertas, histórico).
2. BFF: autenticação, autorização, assinatura vendor, retry, jobs, persistência e observabilidade.
3. API ESL: endpoints de produto, vínculo, refresh, status e templates.
4. Base Station/AP: ponte física entre cloud e etiquetas.
5. Etiquetas: dispositivo final de exibição.

## 3. Implementação da integração no repositório

### Backend

- `server/index.js`: bootstrap, health/readiness, metrics, auth routes, roteamento ESL, tratamento de erro.
- `server/esl/*`: serviços de domínio (produto, bind, refresh, status, template, LED, retry, auditoria, mapper).
- `server/auth/*`: autenticação local JWT e regras de RBAC.
- `server/db/repositories/*`: abstração de repositório (`memory` e `postgres`).
- `server/db/postgres/*`: pool e migrações SQL.
- `server/jobs/*`: sincronização, refresh, polling, reconciliação, dead-letter, retenção.
- `server/observability/*`: logger e métricas.

### Frontend

- `src/services/esl/*`: cliente e serviços para endpoints do BFF.
- `src/hooks/useEslStatus.ts`: atualização periódica de estado.
- `src/types/esl.ts`: contratos públicos da integração.
- `src/services/tagsService.ts` e `src/services/updatesService.ts`: comutação de fluxo `mock` x `real`.

## 4. Modos de operação

### Modo `mock`

- `VITE_API_MODE=mock`
- Dados simulados para demonstração.
- Sem dependência de API vendor.

### Modo `real`

- `VITE_API_MODE=real`
- Frontend chama BFF (`/api/esl/*`).
- BFF chama vendor com `/{i_client_id}`, `store_code`, `is_base64` e `sign`.

Comutação:

- Frontend: `VITE_API_MODE`, `VITE_BFF_TARGET`.
- BFF: variáveis `ESL_*`, persistência, auth e métricas.

## 5. Persistência relacional e repositórios

Implementação por contrato único de repositório:

- `createRepositories(config)` seleciona `memory` ou `postgres`.
- Serviços consomem interfaces, sem acoplamento ao storage.

Entidades persistidas em PostgreSQL:

- `esl_bindings`
- `esl_status_snapshots`
- `esl_command_log`
- `dead_letters`
- `users`
- `refresh_tokens`

Migração inicial:

- `server/db/postgres/migrations/001_init.up.sql`
- `server/db/postgres/migrations/001_init.down.sql`

Executor:

- `npm run bff:migrate`
- `npm run bff:migrate:down`

## 6. Autenticação JWT e RBAC

Rotas públicas de auth:

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Comportamento:

- `BFF_AUTH_ENABLED=false`: rotas `/api/esl/*` abertas (compatibilidade).
- `BFF_AUTH_ENABLED=true`: `Bearer <access_token>` obrigatório em `/api/esl/*`.

Perfis:

- `admin`: total, incluindo rotas administrativas.
- `operador`: operação e monitoramento.
- `viewer`: leitura.

Bootstrap:

- Usuário admin padrão criado automaticamente no startup, conforme variáveis de ambiente.

## 7. Observabilidade e operação

### Endpoints operacionais

- `GET /healthz`: processo ativo.
- `GET /readyz`: valida config ESL, readiness do repositório/DB e configuração de auth.
- `GET /metrics`: métricas Prometheus.

### Logs e correlação

- Logs estruturados JSON (`pino`).
- Correlação por `request_id` no ciclo HTTP do BFF.

### Métricas principais

- Latência/volume HTTP por rota.
- Erros por categoria (`auth`, `validation`, `upstream_vendor`, `database`, `job_runtime`, `runtime`).
- Latência e erro de chamadas vendor.
- Execução de jobs (`success`/`failed`).
- Tamanho de fila de refresh e dead-letter.

## 8. Fluxos operacionais detalhados

### 8.1 Sincronização de produto

1. Produto é enviado para `products/upsert` ou `products/upsert-bulk`.
2. `productSyncService` mapeia payload e chama vendor (`/product/create` ou `/product/create_multiple`).
3. Em sucesso, atualiza cache interno e agenda refresh das etiquetas vinculadas.
4. Auditoria registra comando e resposta.

### 8.2 Bind/unbind

1. BFF recebe bind (`esl_code`, `product_code`, `template_id`).
2. Chama vendor (`/esl/bind` ou `/esl/bind_multiple`).
3. Persiste vínculo local em repositório.
4. Agenda refresh da etiqueta.

Unbind remove vínculo local e agenda refresh.

### 8.3 Trigger de refresh

1. Fila interna em `refreshService` agrega etiquetas pendentes.
2. Trigger (`/esl/bind_task`) é disparado via rota manual ou job periódico.
3. Em sucesso, fila é limpa.

### 8.4 Consulta de status

1. `query_count` obtém total online/offline.
2. `query` paginado alimenta snapshots.
3. `query_status` consulta lista específica.
4. `sync` força atualização no vendor.

### 8.5 LED search

- `ledService` chama `/esl/search` para localização física de etiquetas.

### 8.6 Atualização direta

- `refreshService.directUpdate` chama `/esl/direct` para atualização urgente em uma operação.

## 9. Mapeamento de endpoints (BFF x Vendor)

| BFF | Vendor | Uso |
|---|---|---|
| `POST /api/esl/products/upsert` | `POST /product/create` | Upsert unitário |
| `POST /api/esl/products/upsert-bulk` | `POST /product/create_multiple` | Upsert em lote |
| `POST /api/esl/bind` | `POST /esl/bind` | Vínculo unitário |
| `POST /api/esl/bind/bulk` | `POST /esl/bind_multiple` | Vínculo em lote |
| `POST /api/esl/unbind` | `POST /esl/unbind` | Desvínculo |
| `POST /api/esl/refresh/trigger` | `POST /esl/bind_task` | Trigger de atualização |
| `GET /api/esl/status` | `GET /esl/query` | Consulta paginada |
| `POST /api/esl/status/query` | `POST /esl/query_status` | Consulta específica |
| `POST /api/esl/status/sync` | `POST /esl/sync` | Forçar sincronização |
| `GET /api/esl/templates` | `GET /template/query` | Templates |
| `POST /api/esl/led/search` | `POST /esl/search` | LED search |
| `POST /api/esl/direct` | `POST /esl/direct` | Atualização direta |

## 10. Mapeamento de dados (modelo interno x ESL)

| Campo interno | Campo ESL |
|---|---|
| `product_code` / `sku` | `pc` / `product_code` |
| `product_name` | `pn` |
| `price` | `pp` |
| `quantity` | `qty` |
| `esl_code` (`tagId`) | `f1` ou `esl_code` |
| `template_id` | `f3` ou `template_id` |
| `store_code` | `store_code` |
| `online` | `online` |
| `battery` | `esl_battery` |

## 11. Retry, dead-letter, auditoria e reconciliação

- Retry com backoff exponencial em falhas transitórias.
- Exaustão de tentativas gera item na `dead_letters`.
- Job de replay tenta reprocessar operações conhecidas.
- `esl_command_log` mantém trilha de execução.
- Job de reconciliação corrige divergência de vínculo entre estado local e remoto.
- Job de retenção aplica expurgo por tempo em log e dead-letter.

## 12. Limitações atuais e próximos passos

### Limitações atuais

- Frontend ainda não possui fluxo nativo de login para consumir JWT quando `BFF_AUTH_ENABLED=true`.
- Teste de integração PostgreSQL depende de `DATABASE_URL` no ambiente local/CI.
- Não há painel administrativo dedicado para observabilidade (métricas expostas por endpoint técnico).
- JWT é interno (sem IdP/SSO externo nesta fase).

### Próximos passos recomendados

1. Integrar autenticação no frontend (login, refresh automático e gerenciamento de sessão).
2. Publicar pipeline CI com PostgreSQL de teste para remover `skip` condicional.
3. Criar dashboard operacional para métricas e dead-letter.
4. Evoluir autorização para escopo por loja (`store_code`) e trilha de auditoria por usuário.

## 13. Base documental utilizada

A integração foi estruturada com base nos documentos vendor presentes na raiz:

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
