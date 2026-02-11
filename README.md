# Front-End ESL (MVP Visual)

Projeto front-end em React + Vite + TypeScript com foco em operação de etiquetas eletrônicas (ESL), usando Bootstrap 5.

## Requisitos

- Node.js LTS (recomendado: 20.x ou superior)
- npm (normalmente já incluído com Node)

## Como rodar

```bash
npm install
npm run dev
```

## Scripts disponíveis

- `npm run dev`: inicia servidor de desenvolvimento
- `npm run build`: valida TypeScript e gera build de produção
- `npm run preview`: visualiza build localmente
- `npm run lint`: executa ESLint
- `npm run format`: formata o código com Prettier
- `npm run format:check`: valida formatação

## Estrutura de pastas

```text
src/
  components/
  layouts/
  mocks/
  pages/
  services/
  styles/
  utils/
```

## O que já está completo

### ✅ FASE 1 — Estrutura base

- Rotas principais com React Router.
- AppLayout com Sidebar e Topbar.
- Páginas iniciais em placeholder para os módulos.
- Navegação responsiva com menu mobile.

### ✅ FASE 2 — Dashboard operacional (mock)

- KPIs com dados mockados.
- Estados de loading com skeleton.
- Estado de erro com ação de retry.
- Blocos de status por corredor e última atualização.

### ✅ FASE 3 — Tela de Etiquetas (core)

- Página `/etiquetas` com header operacional.
- Barra de filtros por status, categoria, corredor e busca por SKU/Produto/EtiquetaID.
- Tabela responsiva de etiquetas com badges de status e bateria.
- Modal de detalhes com dados completos e placeholder para preview da etiqueta (Fase 4).
- Mock service com Promise + delay para carregar dados e simular comportamento real.
- Estados de loading, erro e vazio tratados para demo.

## Próximas fases

- FASE 4: preview visual real da etiqueta.
- FASE 5: fluxo operacional para atualização de preço.
