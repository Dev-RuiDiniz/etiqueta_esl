# Manual de Execução do Sistema (Cliente)

## 1. Objetivo

Este manual orienta instalação, configuração, inicialização e operação diária do sistema ESL.

Perfil recomendado:

- Operador de loja
- Supervisor operacional
- Técnico de implantação/suporte

## 2. Pré-requisitos

- Node.js 20+.
- npm.
- Acesso ao repositório.
- Para modo real: credenciais vendor (`ESL_HOST`, `ESL_CLIENT_ID`, `ESL_SIGN`, `ESL_STORE_CODE`).
- Para PostgreSQL: instância de banco disponível e `DATABASE_URL` válido.

## 3. Instalação

```bash
git clone <url-do-repositorio>
cd etiqueta_esl
npm install
```

Criar `.env`:

```bash
copy .env.example .env
```

No Linux/macOS:

```bash
cp .env.example .env
```

## 4. Configuração do ambiente

### 4.1 Modo mock (demonstração)

```env
VITE_API_MODE=mock
VITE_FORCE_API_ERROR=false
VITE_ENABLE_MOCK_FAILURE=false
```

### 4.2 Modo real com BFF (memória)

```env
VITE_API_MODE=real
VITE_BFF_TARGET=http://127.0.0.1:8787

BFF_PORT=8787
BFF_PERSISTENCE_MODE=memory
BFF_AUTH_ENABLED=false
LOG_LEVEL=info
METRICS_ENABLED=true

ESL_HOST=https://esl.greendisplay.cn
ESL_CLIENT_ID=seu_client_id
ESL_SIGN=seu_sign
ESL_STORE_CODE=001
ESL_IS_BASE64=0
ESL_ENABLE_JOBS=true
```

### 4.3 Modo real com PostgreSQL

Adicionar:

```env
BFF_PERSISTENCE_MODE=postgres
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/etiqueta_esl
```

Aplicar migração:

```bash
npm run bff:migrate
```

### 4.4 Ativando autenticação JWT (opcional)

```env
BFF_AUTH_ENABLED=true
JWT_ACCESS_SECRET=troque_este_valor
JWT_REFRESH_SECRET=troque_este_valor
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
BFF_DEFAULT_ADMIN_EMAIL=admin@etiqueta.local
BFF_DEFAULT_ADMIN_PASSWORD=TroqueEstaSenha!
```

Importante:

- Com auth ativa, rotas `/api/esl/*` passam a exigir token bearer.

## 5. Inicialização dos serviços

Terminal 1 (BFF):

```bash
npm run bff
```

Terminal 2 (frontend):

```bash
npm run dev
```

## 6. Validação inicial

Com BFF ativo:

```bash
curl http://127.0.0.1:8787/healthz
curl http://127.0.0.1:8787/readyz
curl http://127.0.0.1:8787/metrics
```

Validação UI:

- Abrir URL do Vite (normalmente `http://127.0.0.1:5173`).
- Conferir carregamento das telas principais.

## 7. Guia de uso por tela

### Dashboard

- Acompanhar visão geral de operação.
- Verificar sinais de degradação.

### Etiquetas

- Buscar por etiqueta, SKU e produto.
- Filtrar por status.
- Abrir detalhe para diagnóstico.

### Atualizações

- Individual: atualização de preço pontual.
- Lote: processamento de múltiplas atualizações via arquivo.

### Alertas

- Acompanhar incidentes.
- Priorizar e marcar resolução.

### Histórico

- Rastrear eventos por período, SKU, etiqueta e status.

## 8. Procedimentos operacionais principais

### 8.1 Atualização individual de preço

1. Entrar em `Atualizações > Individual`.
2. Selecionar etiqueta/produto.
3. Informar preço.
4. Confirmar envio.
5. Validar status final.

### 8.2 Atualização em lote

1. Entrar em `Atualizações > Lote`.
2. Importar arquivo.
3. Validar dados.
4. Executar envio.
5. Reprocessar falhas.

### 8.3 Consulta de status ESL

1. Ir em `Etiquetas`.
2. Aplicar filtro `ONLINE`/`OFFLINE`.
3. Verificar bateria e vínculo.

### 8.4 Busca física por LED

1. Selecionar etiqueta alvo.
2. Disparar ação de LED.
3. Confirmar identificação em loja.

### 8.5 Recuperação básica

1. Validar `/readyz`.
2. Conferir dead-letter no endpoint `/api/esl/dead-letters`.
3. Executar ciclo manual de jobs em `/api/esl/jobs/run` (perfil admin).
4. Validar reconciliação de vínculo.

## 9. Uso de autenticação via API (quando habilitado)

Login:

```bash
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@etiqueta.local","password":"TroqueEstaSenha!"}'
```

Usar token:

```bash
curl http://127.0.0.1:8787/api/esl/health \
  -H "Authorization: Bearer <access_token>"
```

Refresh:

```bash
curl -X POST http://127.0.0.1:8787/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<refresh_token>"}'
```

## 10. Erros comuns e solução

- `readyz = 503`:
  - revisar variáveis `ESL_*`
  - revisar `DATABASE_URL` no modo postgres
  - revisar segredos JWT se auth estiver ativa
- `401 Unauthorized`:
  - token ausente/expirado/inválido
- `403 Forbidden`:
  - perfil sem permissão para a rota
- Falhas recorrentes de atualização:
  - verificar conectividade AP/Base Station
  - verificar disponibilidade da API vendor
  - analisar dead-letter e auditoria

## 11. Checklist diário de operação

1. Subir BFF e frontend.
2. Validar `/healthz` e `/readyz`.
3. Verificar alertas e etiquetas offline.
4. Executar atualizações programadas.
5. Revisar falhas em dead-letter.
6. Confirmar histórico de operações críticas.

## 12. Checklist para demonstração

1. Definir cenário (`mock` ou `real`).
2. Validar dados de demonstração e filtros.
3. Demonstrar atualização individual e lote.
4. Demonstrar consulta de status e LED search.
5. Mostrar auditoria e endpoint de saúde.

## 13. Referências

- `README.md`
- `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/ESTABILIZACAO_2026-03-04.md`
- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
