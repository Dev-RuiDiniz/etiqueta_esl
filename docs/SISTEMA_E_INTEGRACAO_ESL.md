# Sistema e Integração ESL (Visão Técnica)

## 1. Visão geral

O projeto `etiqueta_esl` integra uma aplicação React com o ecossistema ESL GreenDisplay por meio de um BFF Node.js.

Objetivos da integração:

- Orquestrar operações de produto, bind/unbind, refresh e status de etiquetas.
- Isolar credenciais vendor no backend.
- Garantir rastreabilidade operacional (auditoria e dead-letter).
- Operar com persistência local em SQLite no PC do cliente.
- Manter backup local automático e restore manual assistido.

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
- `server/db/repositories/*`: abstração de repositório (`memory` e `sqlite`).
- `server/db/sqlite/*`: schema, paths e manutenção (integridade, backup, replace).
- `server/jobs/*`: sincronização, refresh, polling, reconciliação, dead-letter, retenção e backup.
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

Persistência BFF:

- `sqlite` (padrão): arquivo local com backup local.
- `memory`: uso de desenvolvimento/testes.

## 5. Persistência SQLite local

Implementação por contrato único de repositório:

- `createRepositories(config)` seleciona `sqlite` ou `memory`.
- Serviços consomem interfaces, sem acoplamento ao storage.

Entidades persistidas no SQLite:

- `esl_bindings`
- `esl_status_snapshots`
- `esl_command_log`
- `dead_letters`
- `users`
- `refresh_tokens`

Diretórios locais:

- `<BFF_DATA_DIR>/data/etiqueta_esl.sqlite`
- `<BFF_DATA_DIR>/backups/*.sqlite`

Se `BFF_DATA_DIR` não for definido, usa diretório padrão no perfil do usuário.

## 6. Backup e restore local

Backup automático:

- Job dedicado controlado por `BFF_BACKUP_ENABLED`.
- Intervalo em `BFF_BACKUP_INTERVAL_MS` (padrão: 24h).
- Retenção em `BFF_BACKUP_RETENTION_COUNT` (padrão: 7).
- Processo: checkpoint WAL, cópia atômica, validação de integridade e expurgo de antigos.

Restore manual:

- `npm run bff:restore -- <arquivo.sqlite> [--yes]`
- Fluxo: valida backup, confirmação (ou `--yes`), snapshot pré-restore, replace do banco ativo e validação final.

## 7. Autenticação JWT e RBAC

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

## 8. Observabilidade e operação

Endpoints operacionais:

- `GET /healthz`: processo ativo.
- `GET /readyz`: valida config ESL, readiness de persistência e configuração de auth.
- `GET /metrics`: métricas Prometheus.

Logs e métricas:

- Logs estruturados JSON (`pino`).
- Latência/volume HTTP, erros por categoria, execução de jobs, fila de refresh e dead-letter.

## 9. Fluxos operacionais detalhados

### 9.1 Sincronização de produto

1. Produto é enviado para `products/upsert` ou `products/upsert-bulk`.
2. `productSyncService` mapeia payload e chama vendor (`/product/create` ou `/product/create_multiple`).
3. Em sucesso, atualiza cache interno e agenda refresh das etiquetas vinculadas.
4. Auditoria registra comando e resposta.

### 9.2 Bind/unbind

1. BFF recebe bind (`esl_code`, `product_code`, `template_id`).
2. Chama vendor (`/esl/bind` ou `/esl/bind_multiple`).
3. Persiste vínculo local em repositório.
4. Agenda refresh da etiqueta.

Unbind remove vínculo local e agenda refresh.

### 9.3 Trigger de refresh

1. Fila interna em `refreshService` agrega etiquetas pendentes.
2. Trigger (`/esl/bind_task`) é disparado via rota manual ou job periódico.
3. Em sucesso, fila é limpa.

### 9.4 Consulta de status

1. `query_count` obtém total online/offline.
2. `query` paginado alimenta snapshots.
3. `query_status` consulta lista específica.
4. `sync` força atualização no vendor.

### 9.5 LED search

- `ledService` chama `/esl/search` para localização física de etiquetas.

## 10. Limitações atuais e próximos passos

Limitações atuais:

- Frontend ainda não possui fluxo nativo de login para consumir JWT quando `BFF_AUTH_ENABLED=true`.
- JWT é interno (sem IdP/SSO externo nesta fase).
- Backups locais não são criptografados nesta fase.

Próximos passos recomendados:

1. Integrar autenticação no frontend (login, refresh automático e gerenciamento de sessão).
2. Publicar pipeline CI com execução completa dos testes do BFF.
3. Criar dashboard operacional para métricas e dead-letter.

## 11. Base documental utilizada

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
