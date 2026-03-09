# Estabilização do Sistema ESL (2026-03-09)

## Objetivo

Consolidar a evolução do BFF para uma base mais robusta de operação: persistência relacional, autenticação/autorização, observabilidade e testes automatizados.

## Entregas consolidadas

- Persistência com `BFF_PERSISTENCE_MODE=memory|postgres`.
- Migrações SQL versionadas para entidades operacionais.
- Autenticação JWT interna com RBAC (`admin`, `operador`, `viewer`).
- Logs estruturados (`pino`) e métricas (`prom-client`).
- Endpoints de operação: `/healthz`, `/readyz`, `/metrics`.
- Testes de contrato e auth com Vitest/Supertest.

## Arquivos-chave atualizados

- `server/index.js`
- `server/config.js`
- `server/auth/*`
- `server/db/postgres/*`
- `server/db/repositories/*`
- `server/observability/*`
- `server/tests/*`
- `README.md`
- `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- `docs/MANUAL_EXECUCAO_CLIENTE.md`

## Validação executada

- `npm run test:bff` (ok, com teste postgres condicional por `DATABASE_URL`)
- `npm run lint` (ok)
- `npm run build` (ok)

## Observações operacionais

- Em produção, trocar segredos JWT e senha padrão do admin.
- Em modo `postgres`, rodar `npm run bff:migrate` antes de iniciar o BFF.
- Se `BFF_AUTH_ENABLED=true`, rotas `/api/esl/*` exigem bearer token.
