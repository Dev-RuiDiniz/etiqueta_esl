# Manual de Execução do Sistema (Cliente)

## 1. Objetivo

Este manual orienta instalação, configuração, inicialização e operação diária do sistema ESL em modo local, com banco SQLite e backup local no PC do cliente.

Perfil recomendado:

- Operador de loja
- Supervisor operacional
- Técnico de implantação/suporte

## 2. Pré-requisitos

- Node.js 20+
- npm
- Acesso ao repositório
- Credenciais vendor (`ESL_HOST`, `ESL_CLIENT_ID`, `ESL_SIGN`, `ESL_STORE_CODE`) para modo real

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

### 4.2 Modo real com BFF + SQLite local (padrão)

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
LOG_LEVEL=info
METRICS_ENABLED=true

ESL_HOST=https://esl.greendisplay.cn
ESL_CLIENT_ID=seu_client_id
ESL_SIGN=seu_sign
ESL_STORE_CODE=001
ESL_IS_BASE64=0
ESL_ENABLE_JOBS=true
```

### 4.3 Modo memória (apenas dev/testes)

```env
BFF_PERSISTENCE_MODE=memory
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

- Com auth ativa, rotas `/api/esl/*` exigem token bearer.
- O frontend possui rota `/login` e usa `/api/auth/*` via proxy do Vite quando executado em desenvolvimento.

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

- Abrir URL do Vite (normalmente `http://127.0.0.1:5173`)
- Conferir carregamento das telas principais
- Se `BFF_AUTH_ENABLED=true`, autenticar em `/login` com o usuário admin configurado no `.env`

## 7. Operação de backup e restore local

### 7.1 Backup automático

- O backup local roda automaticamente quando `BFF_BACKUP_ENABLED=true`.
- Intervalo padrão: 24h (`BFF_BACKUP_INTERVAL_MS=86400000`).
- Retenção padrão: 7 arquivos (`BFF_BACKUP_RETENTION_COUNT=7`).
- Arquivos ficam em `backups/` dentro de `BFF_DATA_DIR` (ou diretório padrão do usuário).

### 7.2 Restore manual assistido

Com BFF parado, executar:

```bash
npm run bff:restore -- <caminho-do-backup.sqlite>
```

Para execução sem prompt interativo:

```bash
npm run bff:restore -- <caminho-do-backup.sqlite> --yes
```

Comportamento:

- Valida integridade do backup informado.
- Cria snapshot de segurança pré-restore (`pre-restore-*.sqlite`).
- Substitui o banco ativo e valida integridade final.

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

## 9. Erros comuns e solução

- `readyz = 503`:
  - revisar variáveis `ESL_*`
  - revisar modo de persistência e caminho `BFF_DATA_DIR`
  - revisar segredos JWT se auth estiver ativa
- `401 Unauthorized`:
  - token ausente/expirado/inválido
- Contagem zerada no `query_count`:
  - indica conectividade com vendor, mas não confirma etiquetas ativas ou operação física da base station
- `403 Forbidden`:
  - perfil sem permissão para a rota
- Falha de restore:
  - validar arquivo `.sqlite`
  - garantir que o BFF esteja parado durante a restauração

## 10. Checklist diário de operação

1. Subir BFF e frontend.
2. Validar `/healthz` e `/readyz`.
3. Verificar alertas e etiquetas offline.
4. Executar atualizações programadas.
5. Revisar falhas em dead-letter.
6. Confirmar existência de backups recentes locais.

## 11. Referências

- `README.md`
- `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/ESTABILIZACAO_2026-03-04.md`
- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
