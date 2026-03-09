# Etiqueta ESL — Plataforma Operacional e Integração com API ESL

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Lint](https://img.shields.io/badge/lint-eslint-informational)
![Format](https://img.shields.io/badge/format-prettier-ff69b4)

Aplicação para operação de **etiquetas eletrônicas de prateleira (ESL)** em ambiente de varejo, com suporte a modo mock para demonstração e modo real integrado via BFF com a API ESL (GreenDisplay).

---

## 1. O que o sistema faz e para quem

## Público-alvo

- Operadores de loja
- Supervisores de operação
- Equipe técnica de integração/implantação

## Capacidades principais

- Monitoramento operacional de etiquetas (status e bateria)
- Consulta de etiquetas com filtros avançados
- Atualização de preço individual e em lote
- Gestão de alertas operacionais
- Histórico/auditoria de eventos
- Integração real com API ESL via Backend BFF

---

## 2. Arquitetura resumida e fluxo operacional

```mermaid
flowchart LR
A[Frontend React] -->|/api/esl/*| B[BFF Node.js]
B -->|/api/{i_client_id} + sign| C[API ESL GreenDisplay]
C --> D[Cloud ESL]
D --> E[Base Station/AP]
E --> F[Etiquetas ESL]
F --> E --> D --> C --> B --> A
```

### Resumo do fluxo

1. Operador executa ação na UI.
2. Frontend envia comando para o BFF.
3. BFF autentica/assina e chama API ESL.
4. API ESL orquestra atualização nas etiquetas via AP.
5. BFF consulta status e devolve resultado ao frontend.

---

## 3. Funcionalidades por módulo de tela

## Dashboard (`/dashboard`)

- KPIs operacionais
- Visão de status geral
- Apoio a monitoramento diário

## Etiquetas (`/etiquetas`)

- Filtro por status/categoria/corredor
- Busca por etiqueta, SKU e produto
- Modal de detalhes e preview visual

## Atualizações (`/atualizacoes/individual` e `/atualizacoes/lote`)

- Envio individual de atualização de preço
- Processamento de CSV para lote
- Acompanhamento de status e retry

## Alertas (`/alertas`)

- Listagem de incidentes operacionais
- Filtros por tipo/prioridade/status
- Marcação de resolução

## Histórico (`/historico`)

- Rastreabilidade de eventos
- Filtros por período, SKU, etiqueta e status

---

## 4. Como o sistema funciona internamente

## Frontend

- Stack: React 18 + Vite 6 + TypeScript 5 + Bootstrap 5
- Contratos de integração em `src/types/esl.ts`
- Serviços ESL em `src/services/esl/*`
- Hook de monitoramento em `src/hooks/useEslStatus.ts`

## Backend BFF

- Runtime: Node.js (ESM)
- Entrada principal: `server/index.js`
- Rotas: `server/esl/routes.js`
- Serviços: `server/esl/*`
- Jobs: `server/jobs/*`
- Repositórios: `server/db/*`

## Persistência (estado atual)

- V1 em memória para bindings, status, auditoria e dead-letter.
- Não substitui banco persistente em produção de alta escala.

---

## 5. Integração ESL de ponta a ponta

## Modos de operação

- **Mock (`VITE_API_MODE=mock`)**: usa dados simulados.
- **Real (`VITE_API_MODE=real`)**: usa BFF e API vendor.

## Endpoints internos do BFF (`/api/esl/*`)

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/esl/health` | Saúde e configuração da integração |
| GET | `/api/esl/templates` | Consulta templates |
| GET | `/api/esl/status/summary` | Resumo online/offline |
| GET | `/api/esl/status` | Consulta status paginado |
| POST | `/api/esl/status/sync` | Força sincronização de status |
| POST | `/api/esl/status/query` | Consulta status por lista |
| POST | `/api/esl/products/upsert` | Upsert de produto |
| POST | `/api/esl/products/upsert-bulk` | Upsert em lote |
| POST | `/api/esl/bind` | Vincular etiqueta-produto |
| POST | `/api/esl/bind/bulk` | Vincular em lote |
| POST | `/api/esl/unbind` | Desvincular etiqueta |
| POST | `/api/esl/refresh/trigger` | Trigger de refresh |
| POST | `/api/esl/led/search` | Busca física por LED |
| POST | `/api/esl/direct` | Atualização direta |
| GET | `/api/esl/audit` | Auditoria |
| GET | `/api/esl/dead-letters` | Falhas pendentes |
| POST | `/api/esl/jobs/run` | Execução manual de ciclo de jobs |

## Fluxo real de atualização (resumo)

1. `products/upsert`
2. `refresh/trigger`
3. `status/query` para confirmação

---

## 6. Quickstart (mock e real)

## Pré-requisitos

- Node.js LTS (20+ recomendado)
- npm

## Instalação

```bash
git clone <url-do-repositorio>
cd etiqueta_esl
npm install
```

## 6.1 Executar em modo mock

`.env`:

```env
VITE_API_MODE=mock
VITE_FORCE_API_ERROR=false
VITE_ENABLE_MOCK_FAILURE=false
```

Execução:

```bash
npm run dev
```

## 6.2 Executar em modo real

`.env`:

```env
VITE_API_MODE=real
VITE_BFF_TARGET=http://127.0.0.1:8787

BFF_PORT=8787
ESL_ENABLE_JOBS=true
ESL_HOST=https://esl.greendisplay.cn
ESL_CLIENT_ID=seu_app_key
ESL_SIGN=seu_sign
ESL_STORE_CODE=001
ESL_IS_BASE64=0
```

Execução:

```bash
npm run bff
npm run dev
```

Validação de saúde do BFF:

```bash
curl http://127.0.0.1:8787/api/esl/health
```

---

## 7. Variáveis de ambiente

| Variável | Camada | Finalidade | Exemplo |
|---|---|---|---|
| `VITE_API_MODE` | Frontend | Define modo `mock` ou `real` | `mock` |
| `VITE_FORCE_API_ERROR` | Frontend | Força erro simulado | `false` |
| `VITE_ENABLE_MOCK_FAILURE` | Frontend | Falha aleatória mock | `false` |
| `VITE_BFF_TARGET` | Frontend/Vite | Proxy para BFF | `http://127.0.0.1:8787` |
| `BFF_PORT` | BFF | Porta do backend | `8787` |
| `ESL_ENABLE_JOBS` | BFF | Habilita jobs de fundo | `true` |
| `ESL_HOST` | BFF | Host API vendor | `https://esl.greendisplay.cn` |
| `ESL_CLIENT_ID` | BFF | App key no path `/api/{i_client_id}` | `default` |
| `ESL_SIGN` | BFF | Assinatura exigida pela API | `***` |
| `ESL_STORE_CODE` | BFF | Loja/filial padrão | `001` |
| `ESL_IS_BASE64` | BFF | Flag vendor de codificação | `0` |

---

## 8. Scripts e comandos de operação

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia frontend em desenvolvimento |
| `npm run bff` | Inicia Backend BFF da integração ESL |
| `npm run build` | Build de produção (TypeScript + Vite) |
| `npm run preview` | Visualiza build local |
| `npm run lint` | Executa ESLint |
| `npm run format` | Formata com Prettier |
| `npm run format:check` | Verifica formatação |

---

## 9. Troubleshooting comum

## BFF inicia em modo degradado

- Verifique variáveis obrigatórias (`ESL_HOST`, `ESL_CLIENT_ID`, `ESL_SIGN`, `ESL_STORE_CODE`).

## Frontend não carrega dados reais

- Verifique `VITE_API_MODE=real`.
- Verifique BFF ativo em `BFF_PORT`.
- Verifique `VITE_BFF_TARGET`.

## Atualização falha ou não confirma

- Verifique se etiqueta está offline.
- Verifique conectividade AP/Base Station.
- Verifique credenciais e assinatura vendor.

## Erros de payload obrigatório

- Revisar campos enviados para produto/bind/refresh.
- Confirmar `store_code` correto.

---

## 10. Referências e documentação complementar

- Documento técnico completo da integração:
  - `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- Manual do cliente (operação + setup):
  - `docs/MANUAL_EXECUCAO_CLIENTE.md`
- Materiais legados do projeto:
  - `docs/DEMO_CHECKLIST.md`
  - `docs/ESTABILIZACAO_2026-03-04.md`

## Documentação vendor base

- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
