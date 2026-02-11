# Front-End ESL (MVP Visual)

Setup inicial do front-end com React + Vite + TypeScript e Bootstrap 5 para iniciar a FASE 1.

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
```

## Base visual inicial

- Layout com `Container`, header “ESL Dashboard” e área de conteúdo.
- Página inicial `Dashboard` com placeholder.
- Tema neutro em `src/styles/theme.css`.
