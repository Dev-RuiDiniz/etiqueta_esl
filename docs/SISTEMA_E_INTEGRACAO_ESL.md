# Sistema e Integração ESL

## 1. Visão geral do sistema

O projeto **etiqueta_esl** é uma plataforma de operação de etiquetas eletrônicas de prateleira (ESL) composta por:

- **Frontend React (Vite + TypeScript):** interface operacional para monitoramento, consulta de etiquetas, atualização de preços, alertas e histórico.
- **Backend BFF Node.js:** camada intermediária entre o frontend e a API ESL do fornecedor (GreenDisplay), centralizando autenticação, assinatura de requests, orquestração e jobs.

A aplicação funciona em dois modos:

- **`mock`**: dados simulados para demonstração e validação visual.
- **`real`**: integração ativa via BFF com API ESL.

---

## 2. Arquitetura fim a fim

```mermaid
flowchart LR
A[Frontend React] -->|/api/esl/*| B[BFF Node.js]
B -->|/api/{i_client_id} + sign| C[API ESL GreenDisplay]
C --> D[Servidor/Cloud ESL]
D --> E[Base Station / AP]
E --> F[ESL Tags]
F --> E --> D --> C --> B --> A
```

### Componentes

1. **Frontend**
- Exibe status de etiquetas.
- Aciona atualização individual/lote.
- Inicia ações operacionais (bind, refresh, LED, consultas).

2. **BFF**
- Evita exposição de credenciais da API ESL no browser.
- Injeta `store_code`, `is_base64`, `sign` e `i_client_id`.
- Mantém trilha de auditoria e mecanismos de retry.

3. **API ESL**
- Recebe comandos de produto/vínculo/refresh.
- Disponibiliza status de etiquetas e templates.

4. **Base Station / AP**
- Faz ponte entre cloud ESL e etiquetas físicas.

5. **Etiquetas ESL**
- Renderizam preço/infos de produto e retornam status/bateria.

---

## 3. Como a integração foi implementada

A integração foi implementada em duas camadas:

- **Frontend:** serviços em `src/services/esl/*` e tipos em `src/types/esl.ts`.
- **BFF:** serviços em `server/esl/*` e rotas internas em `server/esl/routes.js`.

### Fluxo padrão de atualização de preço (modo real)

1. Frontend chama serviço de atualização.
2. Serviço envia `upsert` de produto para o BFF.
3. BFF chama `product/create` no fornecedor.
4. Frontend/BFF dispara `refresh/trigger`.
5. BFF chama `esl/bind_task`.
6. Frontend faz polling em `status/query` para confirmação.

---

## 4. Modo `mock` vs `real`

## `mock`

- `VITE_API_MODE=mock`
- Usa dados de `src/mocks/*`.
- Simulação de latência e falha opcional.

## `real`

- `VITE_API_MODE=real`
- Frontend usa BFF via `/api/esl/*`.
- BFF integra com API GreenDisplay.

### Variáveis principais

- Frontend:
  - `VITE_API_MODE`
  - `VITE_BFF_TARGET`
  - `VITE_FORCE_API_ERROR`
  - `VITE_ENABLE_MOCK_FAILURE`
- BFF:
  - `BFF_PORT`
  - `ESL_HOST`
  - `ESL_CLIENT_ID`
  - `ESL_SIGN`
  - `ESL_STORE_CODE`
  - `ESL_IS_BASE64`
  - `ESL_ENABLE_JOBS`

---

## 5. Mapeamento de módulos backend

## `server/esl`

- `eslApiClient.js`: cliente HTTP assinado para API vendor.
- `signer.js`: injeta assinatura/parâmetros obrigatórios.
- `productSyncService.js`: upsert de produtos e fila de sincronização.
- `bindService.js`: bind/unbind e bind em lote.
- `refreshService.js`: trigger de refresh e update direto.
- `statusService.js`: sync/query/query_status/query_count e cache.
- `templateService.js`: consulta e cache de templates.
- `ledService.js`: busca por LED.
- `eslRetryPolicy.js`: retry com backoff + dead-letter.
- `eslAuditLogService.js`: auditoria de comandos.
- `eslMapper.js`: mapeamento interno/vendor.

## `server/jobs`

- `productSyncJob.js`
- `refreshTriggerJob.js`
- `statusPollingJob.js`
- `reconciliationJob.js`
- `deadLetterJob.js`

## `server/db`

- `eslCommandLogRepo.js`
- `eslBindingRepo.js`
- `eslStatusRepo.js`
- `deadLetterRepo.js`

> Observação: persistência atual é **em memória** (v1).

---

## 6. Mapeamento de módulos frontend

## `src/services/esl`

- `apiClient.ts`: cliente para BFF (`/api/esl/*`).
- `productService.ts`, `bindService.ts`, `refreshService.ts`, `statusService.ts`, `templateService.ts`, `ledService.ts`.
- `mapper.ts`: adapta `EslStatusSnapshot` para `Tag` da UI.

## `src/hooks`

- `useEslStatus.ts`: polling periódico de status/resumo.

## `src/types`

- `esl.ts`: contratos públicos da integração (`EslCommandResult`, `EslProductUpsertInput`, `EslBindingInput`, etc.).

---

## 7. Fluxos operacionais detalhados

## 7.1 Sincronização de produto

1. Evento interno de produto/preço.
2. Enfileira/upsert no `productSyncService`.
3. Chama `product/create` ou `product/create_multiple`.
4. Atualiza auditoria e agenda refresh de etiquetas impactadas.

## 7.2 Bind/Unbind

- **Bind**: associação `esl_code` ↔ `product_code` com template opcional.
- **Bind em lote**: múltiplas associações em uma chamada.
- **Unbind**: remoção de vínculo e trigger de atualização.

## 7.3 Trigger de refresh

- Etiquetas são enfileiradas em memória.
- Job/ação manual aciona `bind_task` consolidado.

## 7.4 Consulta de status

- `query_count` para visão geral.
- `query` paginado para snapshots completos.
- `query_status` para etiquetas específicas.
- `sync` para sincronização ativa de estado.

## 7.5 Busca por LED

- Operação de localização física por código de etiqueta.
- BFF chama endpoint `esl/search`.

## 7.6 Atualização direta

- Envia produto/template/led no mesmo comando.
- Usado para cenários urgentes.

---

## 8. Endpoints: BFF interno e API vendor

## 8.1 Endpoints internos do BFF (`/api/esl/*`)

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/esl/health` | Saúde/configuração da integração |
| GET | `/api/esl/templates` | Consulta templates |
| GET | `/api/esl/status/summary` | Resumo online/offline |
| GET | `/api/esl/status` | Status paginado |
| POST | `/api/esl/status/sync` | Sincroniza status no fornecedor |
| POST | `/api/esl/status/query` | Consulta status por lista de códigos |
| POST | `/api/esl/products/upsert` | Upsert de um produto |
| POST | `/api/esl/products/upsert-bulk` | Upsert em lote |
| POST | `/api/esl/bind` | Bind de etiqueta |
| POST | `/api/esl/bind/bulk` | Bind em lote |
| POST | `/api/esl/unbind` | Unbind |
| POST | `/api/esl/refresh/trigger` | Trigger de refresh |
| POST | `/api/esl/led/search` | Busca por LED |
| POST | `/api/esl/direct` | Atualização direta |
| GET | `/api/esl/audit` | Auditoria |
| GET | `/api/esl/dead-letters` | Dead-letter queue |
| POST | `/api/esl/jobs/run` | Execução manual de ciclo de jobs |

## 8.2 Mapeamento para API vendor (resumo)

| BFF | Vendor |
|---|---|
| `/products/upsert` | `POST /product/create` |
| `/products/upsert-bulk` | `POST /product/create_multiple` |
| `/bind` | `POST /esl/bind` |
| `/bind/bulk` | `POST /esl/bind_multiple` |
| `/unbind` | `POST /esl/unbind` |
| `/refresh/trigger` | `POST /esl/bind_task` |
| `/status` | `GET /esl/query` |
| `/status/summary` | `GET /esl/query_count` (ou cache local) |
| `/status/query` | `POST /esl/query_status` |
| `/status/sync` | `POST /esl/sync` |
| `/led/search` | `POST /esl/search` |
| `/direct` | `POST /esl/direct` |
| `/templates` | `GET /template/query` |

---

## 9. Mapeamento de dados (interno ↔ ESL)

| Interno | ESL API |
|---|---|
| `product_code` / `sku` | `pc` / `product_code` |
| `product_name` | `pn` |
| `price` | `pp` |
| `quantity` | `qty` |
| `esl_code` | `f1` (bind/unbind/search) / `esl_code` (direct) |
| `template_id` | `f3` (bind) / `template_id` (direct) |
| `store_code` | `store_code` |
| `online` | `online` |
| `battery` | `esl_battery` (normalizado para %) |

---

## 10. Retry, dead-letter, auditoria e reconciliação

- **Retry automático** com backoff exponencial em operações críticas.
- **Dead-letter queue** para falhas após limite de tentativas.
- **Auditoria** de request/response com metadados operacionais.
- **Reconciliação periódica** para corrigir divergência entre vínculo interno e estado remoto.

---

## 11. Limitações atuais e próximos passos

### Limitações atuais (v1)

- Repositórios em memória (sem banco persistente).
- Sem autenticação/autorização dedicada no BFF.
- Sem painel administrativo dedicado para observabilidade do BFF.

### Próximos passos recomendados

1. Persistir `esl_bindings`, `esl_status_snapshots`, `esl_command_log` e `dead_letters` em banco relacional.
2. Adicionar autenticação JWT no BFF e controle por perfil.
3. Instrumentar métricas (latência, taxa de erro, tamanho de fila).
4. Implementar testes automatizados de contrato BFF e integração.

---

## 12. Base documental da integração

A integração foi especificada e validada com base nos seguintes documentos presentes no repositório:

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`

Esses materiais definem fluxo operacional, provisionamento da base station/AP, e contratos de API vendor utilizados no BFF.
