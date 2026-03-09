# Checklist de Demonstração — Sistema ESL (Frontend + BFF)

## 1. Preparação antes da reunião

1. Validar `.env` do cenário (`mock` ou `real`).
2. Subir BFF (`npm run bff`) e frontend (`npm run dev`).
3. Confirmar saúde do backend:
   - `GET /healthz`
   - `GET /readyz`
4. Se demo em `postgres`, aplicar migração antes: `npm run bff:migrate`.
5. Se auth estiver ativa, obter token por `POST /api/auth/login`.

## 2. Roteiro de apresentação

1. Dashboard
   - Mostrar visão operacional e contexto de saúde.
2. Etiquetas
   - Demonstrar filtros, busca e detalhe.
3. Atualizações
   - Individual: alterar preço e acompanhar retorno.
   - Lote: importar arquivo e processar envio.
4. Alertas
   - Filtrar e resolver um item.
5. Histórico
   - Demonstrar rastreabilidade por período/SKU.
6. Integração técnica
   - Mostrar endpoint `/api/esl/health`.
   - Mostrar auditoria em `/api/esl/audit`.

## 3. Pontos de fala recomendados

- O frontend não acessa vendor diretamente; toda integração passa pelo BFF.
- O BFF assina chamadas com `sign` e inclui `store_code` no padrão do fornecedor.
- Há retry com dead-letter para falhas operacionais.
- O backend expõe métricas técnicas em `/metrics` para monitoramento.

## 4. Encerramento da demo

1. Recapitular fluxo ponta a ponta (produto -> bind -> refresh -> status).
2. Apresentar limitações conhecidas e próximos passos.
3. Registrar dúvidas do cliente para backlog.
