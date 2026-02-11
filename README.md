# Front-End ESL (MVP Visual)

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Lint](https://img.shields.io/badge/lint-eslint-informational)
![Format](https://img.shields.io/badge/format-prettier-ff69b4)

Aplicação front-end para **operação de etiquetas eletrônicas de prateleira (ESL)** em ambiente de varejo.
O sistema simula uma central operacional que permite:

- monitorar indicadores do parque de etiquetas;
- consultar etiquetas com filtros avançados e preview visual;
- enviar atualizações de preço (individual e em lote);
- tratar alertas operacionais;
- auditar histórico de alterações.

> O projeto está em abordagem **mock-first** (dados simulados), focado em validação visual e de fluxos de negócio para MVP.

---

## 1) Tecnologias usadas

### Stack principal

- **React 18**
- **Vite 6**
- **TypeScript 5**
- **Bootstrap 5**
- **React Router DOM 7**

### Qualidade e padronização

- **ESLint 9**
- **Prettier 3**

---

## 2) Estrutura do projeto

Visão geral das pastas principais do front-end:

```text
src/
  components/      # componentes reutilizáveis (tabelas, badges, estados de UI, modais)
  hooks/           # hooks compartilhados (ex.: useAsync)
  layouts/         # layout base da aplicação (sidebar + topbar)
  lib/             # configuração de roteamento
  mocks/           # massa de dados simulada por domínio
  pages/           # telas principais (dashboard, etiquetas, atualizações, alertas, histórico)
  services/        # serviços de acesso a dados mockados/simulação de rede
  styles/          # estilos globais e específicos de componentes
  types/           # contratos TypeScript por domínio
  utils/           # helpers utilitários (formatação, etc.)
```

### Onde estão os elementos-chave

- **Serviços simulados:** `src/services/`
- **Mocks/base fake:** `src/mocks/`
- **Tipos de domínio:** `src/types/`
- **Rotas/telas principais:** `src/lib/router.ts` e `src/pages/`

---

## 3) Instalação do ambiente

### Pré-requisitos

- **Node.js LTS** (recomendado: 20.x+)
- **npm**

### Passo a passo

1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd etiqueta_esl
```

2. Instalar dependências

```bash
npm install
```

3. Rodar ambiente de desenvolvimento

```bash
npm run dev
```

4. Gerar build de produção

```bash
npm run build
```

5. Visualizar build localmente

```bash
npm run preview
```

### Scripts úteis

- `npm run dev` — inicia servidor de desenvolvimento
- `npm run build` — valida TypeScript e gera build
- `npm run preview` — serve build local para validação
- `npm run lint` — checagem de qualidade com ESLint
- `npm run format` — formata código com Prettier
- `npm run format:check` — valida formatação

---

## 4) Funcionalidades e fases implementadas

## FASE 1 — Layout e navegação

**Objetivo:** estabelecer a fundação da aplicação e navegação entre módulos.

**Implementado:**

- roteamento principal com React Router;
- `AppLayout` com **Sidebar + Topbar**;
- páginas base para os módulos: `/dashboard`, `/etiquetas`, `/produtos`, `/atualizacoes`, `/alertas`, `/historico`;
- comportamento responsivo com menu mobile.

**Componentes/features adicionados:**

- `AppLayout`, `Sidebar`, `Topbar`;
- estrutura inicial de páginas para evolução incremental por fase.

### FASE 2 — Dashboard operacional

**Objetivo:** oferecer visão executiva rápida da operação ESL.

**Implementado:**

- KPIs mockados no dashboard;
- card de última atualização do sistema;
- visão resumida por corredor;
- estados de carregamento (skeleton/spinner), erro (retry) e sucesso.

**Componentes/features adicionados:**

- `KpiCard`, `LastSystemUpdate`;
- integração com `dashboardService` (mock).

### FASE 3 — Tela de Etiquetas (core)

**Objetivo:** permitir consulta operacional detalhada das etiquetas.

**Implementado:**

- tela `/etiquetas` com header operacional;
- filtros por status, categoria, corredor e busca textual;
- tabela de etiquetas com badges de status e bateria;
- modal de detalhes da etiqueta;
- tratamento de estados `loading`, `empty` e `error`.

**Componentes/features adicionados:**

- `TagFilters`, `TagTable`, `TagDetailsModal`, `BadgeStatus`, `BatteryBadge`;
- `tagsService` com delay simulado.

### FASE 4 — Preview visual da etiqueta (e-paper)

**Objetivo:** mostrar como a etiqueta final aparece no ponto de venda.

**Implementado:**

- preview visual em estilo e-paper (tons de cinza/preto);
- exibição de nome, preço, unidade, SKU e informações auxiliares;
- suporte a promoção mockada (selo e preço de/por);
- integração do preview dentro do modal da tela de etiquetas.

**Componentes/features adicionados:**

- `PreviewEtiqueta`;
- evolução do modelo de dados de etiquetas com campos de promoção.

### FASE 5 — Atualização de preço (individual e lote)

**Objetivo:** demonstrar fluxo de atualização operacional de preços.

**Implementado:**

- módulo `/atualizacoes` com subrotas:
  - `/atualizacoes/individual`
  - `/atualizacoes/lote`
- formulário individual com validação e feedback de status;
- upload e parsing de CSV para fluxo em lote;
- processamento item a item com status e retry por linha;
- navegação contextual a partir de etiquetas (pré-seleção por `tagId`).

**Componentes/features adicionados:**

- `SingleUpdateForm`, `BulkUpdateUploader`, `BulkUpdateTable`, `UpdateStatusBadge`;
- `updatesService` com confirmação/falha simulada.

### FASE 6 — Alertas operacionais

**Objetivo:** centralizar incidentes e permitir ação rápida da operação.

**Implementado:**

- tela `/alertas` com listagem de incidentes;
- filtros por tipo, prioridade, status e busca;
- ação “Marcar como resolvido” com feedback visual;
- acesso rápido para etiqueta relacionada (`/etiquetas?tagId=...`);
- estados padrão de loading/erro/vazio.

**Componentes/features adicionados:**

- `AlertFiltersBar`, `AlertsTable` e badges de tipo/prioridade/status;
- `alertsService` com base mock realista.

### FASE 7 — Histórico (auditoria)

**Objetivo:** garantir rastreabilidade das alterações e eventos.

**Implementado:**

- tela `/historico` com eventos operacionais;
- filtros por período, SKU, etiqueta e status;
- exibição de origem (manual/lote/sistema);
- formatação pt-BR de data/hora e moeda;
- navegação de contexto para etiqueta.

**Componentes/features adicionados:**

- `HistoryFiltersBar`, `HistoryTable`, badges de status e origem;
- `historyService` com dataset simulado.

### FASE 8 — Organização e realismo (mock-first)

**Objetivo:** padronizar arquitetura de serviços e estados de UI.

**Implementado:**

- camada comum de simulação em `src/services/api.ts`;
- padronização dos services por domínio;
- tipagem centralizada em `src/types/`;
- componentes reutilizáveis de estado (`LoadingState`, `ErrorState`, `EmptyState`);
- hook `useAsync` para fluxo assíncrono uniforme;
- persistência de filtros via querystring;
- deep-link com `tagId` para abrir detalhe automaticamente.

**Componentes/features adicionados:**

- infraestrutura de rede simulada (`simulateNetwork`, `sleep`);
- normalização de comportamento assíncrono nas principais páginas.

### FASE 9 — Polimento para apresentação

**Objetivo:** elevar qualidade visual e narrativa para demonstração com stakeholders.

**Implementado:**

- revisão de textos em pt-BR;
- padronização de formatos em helpers utilitários;
- refinamentos responsivos (desktop/tablet/mobile);
- consistência de dados demonstrativos entre módulos;
- checklist de reunião em `docs/DEMO_CHECKLIST.md`.

**Componentes/features adicionados:**

- ajustes finais em páginas e componentes para experiência de demo.

---

## 5) Como testar e demonstrar

## Subir o sistema

```bash
npm run dev
```

Acesse no navegador a URL exibida no terminal (geralmente `http://localhost:5173`).

### Validação funcional (fluxos positivos)

1. **Navegação geral**
   - Percorra: `/dashboard`, `/etiquetas`, `/atualizacoes`, `/alertas`, `/historico`.

2. **Dashboard**
   - Validar KPIs carregados;
   - Confirmar bloco de última atualização.

3. **Etiquetas**
   - Aplicar filtros (status/categoria/corredor);
   - Buscar por SKU/nome/tag;
   - Abrir detalhes e validar preview da etiqueta.

4. **Atualizações (individual)**
   - Selecionar etiqueta;
   - Informar novo preço;
   - Enviar e acompanhar `Enviado → Confirmado/Falha`.

5. **Atualizações (lote CSV)**
   - Importar CSV (ex.: `sku;price;tagId`);
   - Processar arquivo;
   - Enviar lote e validar status por linha;
   - Executar retry em itens com falha.

6. **Alertas**
   - Filtrar por tipo/prioridade/status;
   - Marcar alerta como resolvido;
   - Usar atalho para etiqueta relacionada.

7. **Histórico**
   - Filtrar por data, SKU, etiqueta e status;
   - Validar registros e origem;
   - Testar limpeza de filtros.

### Validar estados de loading, vazio e erro

#### Loading

- Abrir cada tela e observar componentes de carregamento (spinner/skeleton).

#### Empty state

- Aplique filtros sem correspondência em:
  - `/etiquetas`
  - `/alertas`
  - `/historico`

#### Erro simulado

Execute o app forçando falha de API mock:

```bash
VITE_FORCE_API_ERROR=true npm run dev
```

Com isso, valide:

- mensagens de erro em tela;
- ação de retry nos componentes;
- retorno ao estado normal ao remover a flag.

### Variáveis de ambiente (opcional)

Crie `.env` local:

```bash
VITE_API_MODE=mock
VITE_FORCE_API_ERROR=false
```

---

## 6) Fluxo de demonstração ideal

Sugestão de roteiro sequencial para apresentação ao cliente:

1. **Dashboard geral**
   - visão executiva dos indicadores e última atualização.
2. **Etiquetas**
   - filtros + busca + abertura do preview no detalhe.
3. **Atualizações (individual)**
   - envio de novo preço e leitura de status.
4. **Atualizações em lote (CSV)**
   - importação, processamento e validação por item.
5. **Alertas**
   - filtragem operacional e resolução de incidente.
6. **Histórico**
   - filtros de auditoria e conferência de registros.

> Referência adicional: `docs/DEMO_CHECKLIST.md`.

---

## 7) Rotas principais

- `/dashboard`
- `/etiquetas`
- `/produtos`
- `/atualizacoes/individual`
- `/atualizacoes/lote`
- `/alertas`
- `/historico`

---

## 8) Licença e créditos

### Licença

Este projeto é distribuído sob licença **MIT** (ajuste aqui caso sua organização use outro modelo).

### Créditos

- Equipe de desenvolvimento Front-End ESL (MVP Visual)
- Participantes e revisores técnicos do projeto

### Referências úteis

- React: https://react.dev/
- Vite: https://vite.dev/
- TypeScript: https://www.typescriptlang.org/
- Bootstrap 5: https://getbootstrap.com/
- React Router: https://reactrouter.com/

---

## 9) Resumo executivo

O MVP Visual Front-End ESL entrega uma experiência completa de demonstração operacional, cobrindo monitoramento, consulta, atualização, alerta e auditoria em 9 fases evolutivas, com arquitetura mock-first preparada para integração real em etapas futuras.
