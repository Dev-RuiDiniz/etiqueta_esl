# Manual de Execução do Sistema (Cliente)

## 1. Objetivo do manual

Este manual orienta o cliente na **instalação, configuração e operação diária** do sistema de etiquetas eletrônicas de prateleira (ESL), incluindo uso das telas e ações operacionais principais.

## Público-alvo

- Operadores de loja
- Supervisores de operação
- Equipe técnica de implantação/suporte

---

## 2. Pré-requisitos

- Computador com Windows, macOS ou Linux.
- Node.js LTS (recomendado 20+).
- NPM instalado.
- Acesso ao repositório do sistema.
- (Modo real) Credenciais da API ESL:
  - `ESL_HOST`
  - `ESL_CLIENT_ID`
  - `ESL_SIGN`
  - `ESL_STORE_CODE`

---

## 3. Instalação e configuração do ambiente

1. Clonar repositório:

```bash
git clone <url-do-repositorio>
cd etiqueta_esl
```

2. Instalar dependências:

```bash
npm install
```

3. Criar arquivo de ambiente local com base no exemplo:

```bash
copy .env.example .env
```

> Em Linux/macOS:

```bash
cp .env.example .env
```

---

## 4. Configuração do `.env` (mock e real)

## 4.1 Modo demonstração (mock)

Use quando quiser validar interface e fluxo sem integração real.

```env
VITE_API_MODE=mock
VITE_FORCE_API_ERROR=false
VITE_ENABLE_MOCK_FAILURE=false
```

## 4.2 Modo integração real

Use quando for integrar com API ESL do fornecedor.

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

---

## 5. Inicialização dos serviços e validação inicial

## 5.1 Subir backend BFF

```bash
npm run bff
```

Validação rápida de saúde do BFF (opcional):

```bash
curl http://127.0.0.1:8787/api/esl/health
```

## 5.2 Subir frontend

Em outro terminal:

```bash
npm run dev
```

Acessar URL exibida no terminal (normalmente `http://127.0.0.1:5173`).

## 5.3 Verificar qualidade (opcional)

```bash
npm run lint
npm run build
```

---

## 6. Guia de uso por tela

## 6.1 Dashboard

- Exibe indicadores gerais da operação.
- Use para visão rápida de saúde do parque de etiquetas.

## 6.2 Etiquetas

- Pesquise por etiqueta, SKU ou produto.
- Aplique filtros por status/categoria/corredor.
- Abra detalhes para revisar dados e preview da etiqueta.

## 6.3 Atualizações

### Atualização individual

- Escolha uma etiqueta.
- Informe novo preço.
- Envie atualização.
- Acompanhe status (`SENT`, `CONFIRMED`, `FAILED`).

### Atualização em lote

- Faça upload do CSV.
- Processe as linhas.
- Execute envio em lote.
- Reenvie linhas com falha quando necessário.

## 6.4 Alertas

- Filtre alertas por tipo, prioridade e status.
- Marque alertas como resolvidos após ação operacional.

## 6.5 Histórico

- Consulte trilha de eventos por período, SKU e etiqueta.
- Use para auditoria de alterações operacionais.

---

## 7. Procedimentos operacionais principais

## 7.1 Atualização individual de preço

1. Ir em `Atualizações > Individual`.
2. Selecionar etiqueta.
3. Informar novo preço.
4. Enviar.
5. Confirmar status final.

## 7.2 Atualização em lote

1. Ir em `Atualizações > Lote`.
2. Importar CSV no layout esperado.
3. Processar lote.
4. Enviar.
5. Executar retry nas linhas com erro.

## 7.3 Consulta de status ESL

1. Ir em `Etiquetas`.
2. Filtrar por `ONLINE`/`OFFLINE`.
3. Verificar bateria e localização.

## 7.4 Ações básicas de recuperação

- Reenviar atualização com falha.
- Revisar se etiqueta está offline.
- Verificar se Base Station/AP está ativa e em bridge com Wi-Fi da loja.
- Confirmar credenciais e variáveis `.env` no modo real.

---

## 8. Erros comuns e resolução

## 8.1 BFF não inicia

- Verifique se Node.js está instalado.
- Verifique porta `BFF_PORT` já em uso.
- Confirme variáveis obrigatórias (`ESL_HOST`, `ESL_CLIENT_ID`, `ESL_SIGN`, `ESL_STORE_CODE`).

## 8.2 Frontend não carrega dados reais

- Confirme `VITE_API_MODE=real`.
- Confirme BFF rodando.
- Confirme `VITE_BFF_TARGET`.

## 8.3 Atualização fica com falha

- Verifique status da etiqueta (offline).
- Verifique conectividade de AP/Base Station.
- Verifique assinatura/credenciais da API vendor.

## 8.4 API responde erro de campo obrigatório

- Revisar payload enviado (produto, bind, refresh).
- Revisar `store_code` configurado.

---

## 9. Checklist de operação diária

1. BFF e frontend iniciados.
2. Health do BFF OK.
3. Dashboard sem erros críticos.
4. Verificação de etiquetas offline.
5. Execução das atualizações do dia.
6. Tratamento de alertas.
7. Conferência de histórico.

---

## 10. Checklist de abertura para demonstração/cliente

1. Configurar modo `mock` (demo) ou `real` (integração).
2. Subir `npm run bff` e `npm run dev`.
3. Validar telas principais:
- Dashboard
- Etiquetas
- Atualizações (individual/lote)
- Alertas
- Histórico
4. Preparar cenário com filtros e atualização de preço.
5. Conferir estabilidade visual e mensagens de erro.

---

## Referências

- `docs/SISTEMA_E_INTEGRACAO_ESL.md`
- `docs/DEMO_CHECKLIST.md`
- `docs/ESTABILIZACAO_2026-03-04.md`
- `ESL manual.pdf`
- `Base Station WIFI Configuration.pdf`
- `API Reference_20231118.pdf`
