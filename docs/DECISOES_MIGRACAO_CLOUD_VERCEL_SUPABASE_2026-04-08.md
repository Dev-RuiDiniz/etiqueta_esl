# Decisões: Migração Cloud para Vercel + Supabase

## 1. Objetivo

Migrar a operação real do backend para ambiente cloud, mantendo paridade funcional da API e preservando contratos já consumidos pelo frontend.

## 2. Decisões principais

- Runtime do BFF em `Serverless Function` na Vercel.
- Persistência oficial de produção em Postgres (Supabase), com `DATABASE_URL`.
- SQLite permanece como modo legado para migração de dados e cenários locais.
- Contratos das rotas `/api/esl/*`, `/api/auth/*` e `/api/admin/*` foram preservados.

## 3. Jobs e agendamento

- Intervalos com `setInterval` não rodam no modo serverless.
- Jobs foram movidos para execução via Vercel Cron (`/api/internal/cron/*`).
- Execução manual `/api/esl/jobs/run` permanece ativa para troubleshooting.
- Rotas de cron exigem segredo (`CRON_SECRET`/`BFF_CRON_SECRET`).

## 4. Migração de dados

- Fluxo oficial: aplicar migrações Postgres e executar script SQLite -> Postgres.
- Migração é idempotente por `upsert` em chaves primárias/naturais.
- Relatório por tabela é gerado ao final para auditoria de volume.

## 5. Riscos e mitigação

- **Cold start / stateless**: mitigado com runtime compartilhado por instância e pool Postgres reutilizável.
- **Falta de segredo de cron**: rotas internas retornam `401` quando segredo não confere.
- **Diferença de comportamento entre SQLite e Postgres**: mitigado com testes de contrato no repositório Postgres e teste dedicado de migração.

## 6. Itens fora desta etapa

- Multi-tenant no banco.
- Mudança de contratos de API por razões de arquitetura.
- Remoção definitiva do modo SQLite.
