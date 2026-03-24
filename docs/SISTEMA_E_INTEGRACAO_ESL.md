# Sistema e Integração ESL (Visão Técnica Consolidada)

## 1. Resumo executivo

O projeto `etiqueta_esl` é uma plataforma operacional para etiquetas eletrônicas de prateleira (ESL) com:

- frontend React/Vite para operação diária
- BFF Node.js para autenticação, regras de negócio e integração com o fornecedor
- persistência local em SQLite no PC do cliente
- integração com a API cloud da GreenDisplay
- jobs de sincronização, refresh, reconciliação, retenção e backup

O sistema não se conecta diretamente por código à base station. A integração implementada no repositório valida e consome a camada cloud/vendor; a base station aparece como parte da topologia operacional do fabricante.

## 2. Arquitetura fim a fim

```mermaid
flowchart LR
A[Frontend React] -->|/api/esl/* e /api/auth/*| B[BFF Node.js]
B -->|/api/{i_client_id} + sign| C[API ESL GreenDisplay]
C --> D[Cloud ESL]
D --> E[Base Station/AP]
E --> F[Etiquetas ESL]
F --> E --> D --> C --> B --> A
```

Componentes:

1. Frontend: dashboard, etiquetas, produtos, atualizações, alertas, histórico e login.
2. BFF: autenticação JWT, RBAC, assinatura vendor, retry, jobs, métricas e persistência.
3. API ESL GreenDisplay: superfície remota usada para produto, bind, refresh, status e templates.
4. Base Station/AP: ponte física entre cloud do fornecedor e etiquetas.
5. Etiquetas ESL: dispositivo final de exibição.

## 3. Estrutura do repositório

### Backend

- `server/index.js`: bootstrap do runtime, readiness, metrics, auth, rotas ESL e shutdown.
- `server/esl/*`: serviços de domínio (`status`, `bind`, `refresh`, `catalog`, `product sync`, `template`, `LED`).
- `server/auth/*`: JWT, hash de senha, guardas e RBAC.
- `server/db/repositories/*`: abstração de persistência (`sqlite` e `memory`).
- `server/db/sqlite/*`: schema, paths, manutenção, backup e restore.
- `server/jobs/*`: jobs periódicos de sincronização e manutenção.
- `server/observability/*`: logger estruturado e métricas Prometheus.

### Frontend

- `src/App.tsx`: roteamento principal e separação entre shell operacional e tela de login.
- `src/pages/*`: páginas de operação.
- `src/services/esl/*`: cliente do BFF e serviços de domínio no navegador.
- `src/services/authService.ts`: login/logout contra `/api/auth/*`.
- `src/lib/auth.ts`: armazenamento local de tokens e redirecionamento para `/login`.
- `src/hooks/useEslStatus.ts`: polling operacional.

## 4. Fluxos principais

### 4.1 Login e sessão

1. Operador acessa `/login`.
2. Frontend chama `POST /api/auth/login`.
3. BFF valida usuário local, emite `access_token` e `refresh_token`.
4. Tokens ficam em `localStorage`.
5. Chamadas a `/api/esl/*` incluem `Bearer token`.
6. Em `401`, o frontend tenta `POST /api/auth/refresh`.
7. Se o refresh falhar, os tokens são limpos e o usuário é redirecionado para `/login`.

Observação:

- Quando `BFF_AUTH_ENABLED=false`, a aplicação continua operando sem exigir login.
- A rota `/login` existe para compatibilidade com ambientes protegidos e para tratar expiração de sessão.

### 4.2 Sincronização de produto

1. Produto entra por `upsert` unitário ou em lote.
2. `productSyncService` transforma o payload para o formato do fornecedor.
3. O BFF chama `/product/create` ou `/product/create_multiple`.
4. Em sucesso, persiste o produto localmente.
5. O serviço localiza ESLs vinculadas ao produto e agenda refresh.
6. Tudo fica registrado em auditoria; falhas vão para dead-letter quando aplicável.

### 4.3 Bind/unbind

1. Operador escolhe etiqueta e produto.
2. O catálogo local valida se ambos existem.
3. `bindingService` chama o fornecedor.
4. Em sucesso, persiste o vínculo local.
5. A ESL é colocada na fila de refresh.

### 4.4 Refresh

1. Operações de bind/unbind/produto alimentam uma fila em memória.
2. `refreshService` deduplica ESLs para evitar excesso de `bind_task`.
3. O job periódico ou a rota manual dispara `POST /esl/bind_task`.
4. Em falha, a fila do snapshot atual é restaurada para tentativa posterior.

### 4.5 Status e descoberta

1. `query_count` define o universo de etiquetas.
2. `query` paginado traz snapshots.
3. Snapshots atualizam `esl_status_snapshots`.
4. O catálogo local é enriquecido com ESLs descobertas via vendor/cloud.

### 4.6 Busca física por LED

- `ledService` chama `/esl/search` para localizar uma etiqueta fisicamente.
- Esse fluxo continua sendo um comando vendor/cloud; não há integração local direta com a base station.

## 5. Persistência local e operação

Persistência suportada:

- `sqlite`: modo padrão para cliente final
- `memory`: desenvolvimento e testes

Entidades persistidas:

- `esl_bindings`
- `esl_status_snapshots`
- `esl_command_log`
- `dead_letters`
- `users`
- `refresh_tokens`
- `products`

Backup e restore:

- backup automático local com retenção configurável
- restore manual por `npm run bff:restore -- <arquivo.sqlite>`
- validação de integridade antes e depois do replace do banco

## 6. Endpoints principais

### Operação ESL

- `GET /api/esl/health`
- `GET /api/esl/templates`
- `GET /api/esl/catalog`
- `POST /api/esl/catalog/import`
- `GET /api/esl/status`
- `GET /api/esl/status/summary`
- `GET /api/esl/status/dashboard`
- `POST /api/esl/status/sync`
- `GET /api/esl/products`
- `POST /api/esl/products/upsert`
- `POST /api/esl/products/upsert-bulk`
- `GET /api/esl/bindings`
- `POST /api/esl/bind`
- `POST /api/esl/bind/bulk`
- `POST /api/esl/unbind`
- `POST /api/esl/refresh/trigger`
- `POST /api/esl/led/search`
- `POST /api/esl/direct`
- `GET /api/esl/audit`
- `GET /api/esl/audit/history`
- `GET /api/esl/alerts`
- `GET /api/esl/dead-letters`
- `POST /api/esl/jobs/run`

### Operação BFF

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /healthz`
- `GET /readyz`
- `GET /metrics`

## 7. Segurança e autenticação

Quando `BFF_AUTH_ENABLED=true`:

- `/api/esl/*` exige bearer token
- `viewer` tem leitura
- `operador` tem leitura e escrita
- `admin` tem acesso total, incluindo endpoints administrativos

Proteções adicionais:

- rate limit no login
- payload JSON limitado
- CORS configurável
- refresh token com revogação
- usuário admin padrão criado no bootstrap

## 8. Auditoria técnica realizada

Achados corrigidos nesta rodada:

1. O Vite só fazia proxy de `/api/esl/*`, enquanto o frontend também chamava `/api/auth/*`.
2. O frontend redirecionava para `/login`, mas a rota não existia.
3. O `.env.example` continha valores reais/sensíveis de `ESL_CLIENT_ID`, `ESL_SIGN` e `ESL_STORE_CODE`.
4. A documentação afirmava corretamente a existência do backend de auth, mas o frontend ainda não fechava o fluxo ponta a ponta.

Correções aplicadas:

- proxy de `/api/auth/*` adicionado ao `vite.config.ts`
- tela `/login` implementada no frontend
- login/logout integrados ao BFF
- redirecionamento por sessão expirada ajustado para preservar a rota de retorno
- `.env.example` sanitizado com placeholders seguros
- comentários técnicos ampliados em módulos centrais do frontend e backend

## 9. Limitações atuais

- A autenticação continua sendo local ao BFF; não há IdP externo ou SSO.
- A validação implementada confirma apenas a camada vendor/cloud, não o estado físico da base station.
- Backups locais não são criptografados nesta fase.
- Não há suíte dedicada de testes frontend.

## 10. Smoke test de conectividade

Escopo adotado:

- reachability da API GreenDisplay
- `query_count`
- endpoints operacionais do BFF em modo seguro
- nenhuma operação destrutiva em etiquetas

Resultado observado nesta auditoria:

- `GET https://esl.greendisplay.cn/api/20254235/esl/query_count?...` respondeu `200`
- payload retornado: `{"online_count":0,"offline_count":0}`

Interpretação:

- há conectividade básica até o fornecedor
- as credenciais usadas no teste responderam corretamente
- o resultado não prova operação física da base station nem presença de etiquetas ativas
- a aplicação deve tratar esse teste como smoke test de infraestrutura, não como homologação de campo

## 11. Como executar

Instalação:

```bash
npm install
```

Frontend:

```bash
npm run dev
```

BFF:

```bash
npm run bff
```

Validação local:

```bash
curl http://127.0.0.1:8787/healthz
curl http://127.0.0.1:8787/readyz
curl http://127.0.0.1:8787/api/esl/health
```

## 12. Evolução recomendada

1. Adicionar testes frontend para login, expiração de sessão e navegação crítica.
2. Integrar observabilidade externa para métricas e dead-letter.
3. Criar procedimento homologado de validação física com base station e etiquetas em loja.
4. Externalizar autenticação se houver exigência corporativa de SSO.

## 13. Base documental

- `README.md`
- `docs/MANUAL_EXECUCAO_CLIENTE.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/API_ESL_INTEGRACAO_REFERENCIA_PT.md`
- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
