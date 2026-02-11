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
  lib/
  mocks/
  pages/
  services/
  styles/
  types/
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
- Modal de detalhes com dados completos e preview da etiqueta.
- Mock service com Promise + delay para carregar dados e simular comportamento real.
- Estados de loading, erro e vazio tratados para demo.

### ✅ FASE 4 — Preview visual da etiqueta (e-paper)

- Componente reutilizável `PreviewEtiqueta` para simular etiqueta ESL em tons de cinza/preto.
- Exibição de nome do produto (máx. 2 linhas), preço em destaque, unidade, SKU e infos adicionais.
- Suporte a promoção mockada com selo (ex.: `OFERTA`) e texto “De R$ X por R$ Y”.
- Integração no modal de detalhes em `/etiquetas`, com layout responsivo.
- Novos campos no mock de tags: `unitLabel` e `promotion`.

### ✅ FASE 5 — Atualização de preço (fluxo demonstrativo)

- Hub de atualização em `/atualizacoes` com abas internas e subrotas:
  - `/atualizacoes/individual`
  - `/atualizacoes/lote`
- Formulário de atualização individual com validação Bootstrap, envio fake e retorno visual de status (`Enviado`, `Confirmado`, `Falha`) com spinner e opção de reenviar.
- Upload CSV fake para atualização em lote, com preview das primeiras linhas e processamento item a item.
- Tabela de itens processados no lote com status por item e ação de retry para falhas.
- Serviço `updatesService` simulando envio/ACK com delays realistas e probabilidade configurada (70% confirmado rápido, 20% confirmado lento, 10% falha).
- Integração opcional da tela de etiquetas: botão “Atualizar preço” no modal navega para `/atualizacoes/individual?tagId=...` com pré-seleção automática.

## Como testar a FASE 5

- Acesse `/atualizacoes/individual`:
  - selecione uma etiqueta,
  - informe novo preço,
  - envie e acompanhe a transição `Enviado → Confirmado/Falha`;
  - em caso de falha, use “Reenviar”.
- Acesse `/atualizacoes/lote`:
  - selecione um CSV (ex.: `sku;price;tagId` ou `tagId;price`),
  - clique em “Processar arquivo” para ver a prévia,
  - clique em “Enviar atualizações” e acompanhe o status de cada item,
  - use “Retry” para itens com falha.

> Observação: fluxo é simulado; integração real com API ficará para FASE 8.



### ✅ FASE 6 — Alertas operacionais (mock)

- Página `/alertas` com tabela responsiva de incidentes (bateria baixa, etiqueta offline e falha de atualização).
- Barra de filtros front-only por tipo, prioridade, status e busca por EtiquetaID/SKU/Produto.
- Badges visuais de prioridade e status para leitura rápida da operação.
- Ação “Marcar como resolvido” com atualização otimista no estado local e feedback visual de sucesso/erro.
- Estado de loading com spinner, estado de erro com retry e estado vazio com mensagem orientativa.
- Serviço fake `alertsService` (Promise + delay) e base de 36 alertas mockados realistas.
- Integração com FASE 3: botão “Ver etiqueta” em alertas abre `/etiquetas?tagId=...` para busca pré-preenchida.

## Como testar a FASE 6

- Acesse `/alertas`:
  - valide o carregamento inicial dos alertas;
  - use os filtros Tipo/Prioridade/Status e o campo de busca;
  - clique em “Marcar como resolvido” em um alerta aberto e confirme a troca do badge para “Resolvido”;
  - clique em “Ver etiqueta” para navegar para `/etiquetas` com querystring de `tagId` aplicada;
  - use “Limpar filtros” e confira o retorno ao estado padrão (Abertos).

> Observação: persistência real e integração backend ficam para FASE 8+.

### ✅ FASE 7 — Histórico (auditoria e rastreabilidade)

- Página `/historico` com tabela responsiva de eventos: alteração de preço, envio de atualização, confirmação e falha.
- Filtros front-only por período (data inicial/final), SKU, EtiquetaID e status.
- Estados visuais de loading (spinner), erro com retry e vazio (“Nenhum registro encontrado”).
- Badges padronizados para status (`Enviado`, `Confirmado`, `Falha`) e origem (`Manual`, `Lote`, `Sistema (mock)`).
- Serviço fake `historyService` com Promise + delay e base de histórico mockada com dezenas de eventos distribuídos nos últimos 30 dias.
- Formatação pt-BR para data/hora e moeda (R$).
- Integração com FASE 3: ação “Ver etiqueta” navega para `/etiquetas?tagId=...`.

## Como testar a FASE 7

- Acesse `/historico`:
  - confira o carregamento inicial e a tabela de registros;
  - aplique filtros por data e SKU;
  - filtre por status e EtiquetaID;
  - teste a validação com data inicial maior que data final;
  - use “Limpar” para resetar os filtros;
  - clique em “Ver etiqueta” para abrir `/etiquetas` com querystring de `tagId`.

> Observação: dados são simulados; integração real fica para FASE 8+.
