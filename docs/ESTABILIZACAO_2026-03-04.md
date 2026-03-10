# Estabilização do Sistema ESL (2026-03-10)

## Objetivo

Consolidar a evolução do BFF para uma base local robusta de operação: persistência SQLite no PC do cliente, backup local automático, restore manual assistido, autenticação/autorização, observabilidade e testes automatizados.

## Entregas consolidadas

- Persistência com `BFF_PERSISTENCE_MODE=sqlite|memory`.
- Banco local SQLite com bootstrap automático de schema.
- Backup local automático com retenção configurável.
- Restore manual assistido por CLI (`npm run bff:restore`).
- Autenticação JWT interna com RBAC (`admin`, `operador`, `viewer`).
- Logs estruturados (`pino`) e métricas (`prom-client`).
- Endpoints de operação: `/healthz`, `/readyz`, `/metrics`.
- Testes de contrato, auth, repositório SQLite, backup e restore.

## Arquivos-chave atualizados

- `server/index.js`
- `server/config.js`
- `server/auth/*`
- `server/db/sqlite/*`
- `server/db/repositories/*`
- `server/jobs/*`
- `server/scripts/restore.js`
- `server/tests/*`
- `README.md`
- `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- `docs/MANUAL_EXECUCAO_CLIENTE.md`

## Validação executada

- `npm run test:bff`
- `npm run lint`
- `npm run build`

## Observações operacionais

- Em produção, trocar segredos JWT e senha padrão do admin.
- Se `BFF_AUTH_ENABLED=true`, rotas `/api/esl/*` exigem bearer token.
- Para restore, parar o BFF antes da execução do comando.
