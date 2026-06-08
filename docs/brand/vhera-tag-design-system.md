# Vhera Tag - Design System

## Visão Geral

Vhera Tag é uma plataforma de etiquetas digitais sustentáveis com identidade visual industrial, técnica e operacional. A marca transmite confiança, tecnologia e eficiência logística.

## Nome Público

**Vhera Tag**

## Paleta de Cores

### Cores Primárias

```css
--brand-primary: #ffb000;          /* Amarelo/Laranja da marca - principal */
--brand-primary-strong: #f59e00;   /* Amarelo/Laranja mais forte - hover/focus */
--brand-dark: #111111;            /* Preto - contraste e força visual */
--brand-surface-dark: #2f2f2f;     /* Cinza escuro - base neutra para sidebar/topbar */
```

### Cores de Superfície

```css
--brand-surface: #f7f3e8;          /* Bege claro - fundo de conteúdo */
--brand-border: #d79400;           /* Dourado escuro - bordas */
```

### Cores de Texto

```css
--brand-text: #111111;            /* Preto - texto principal */
--brand-text-inverse: #ffffff;     /* Branco - texto sobre fundo escuro */
```

### Cores Operacionais (Preservadas)

```css
--status-online: #22c55e;          /* Verde - online/sucesso */
--status-offline: #6b7280;        /* Cinza - offline */
--status-low-battery: #f97316;    /* Laranja forte - bateria baixa */
--status-error: #ef4444;          /* Vermelho - erro/falha */
--status-warning: #eab308;         /* Amarelo claro - warning (distinto da marca) */
--status-pending: #eab308;         /* Amarelo claro - pendente */
```

**Regra Crítica:** O amarelo da marca (`#ffb000`) NÃO deve ser usado para alertas operacionais. Use `--status-warning` (`#eab308`) para warnings, que é um tom mais claro e distinto.

## Logo

### Descrição Visual

- **Elemento gráfico:** Etiqueta amarela com bordas pretas e cantos arredondados
- **Detalhes:** Retângulos pretos internos, um com padrão de código de barras
- **Tipografia:** "VHERA TAG" em fonte bold, preto com contorno dourado
- **Layout:** Logo à esquerda, texto empilhado à direita
- **Fundo:** Cinza escuro (para contraste)

### Arquivos de Logo

- **Logo principal:** `src/assets/brand/vhera-tag-logo.png` (512x512px)
- **Ícone compacto:** `src/assets/brand/vhera-tag-icon.png` (64x64px)
- **Favicon:** `public/vhera-tag-favicon.png` (32x32px)

### Uso Correto

- **Fundo claro:** Use logo com fundo transparente
- **Fundo escuro:** Use variante com contorno ou fundo claro
- **Tamanho mínimo:** 64px de altura para legibilidade
- **Espaçamento:** Mantenha espaço ao redor (padding mínimo 8px)

### Uso Incorreto

- Não esticar ou distorcer o logo
- Não alterar cores do logo
- Não usar sobre fundos com baixo contraste
- Não remover elementos do logo (código de barras, bordas)
- Não usar o logo em tamanho muito pequeno (< 32px)

### Variações

- **Logo principal:** Versão completa com elemento gráfico + texto
- **Ícone compacto:** Apenas o elemento gráfico da etiqueta (para sidebar, favicon)
- **Assinatura compacta:** Ícone + texto em linha (para topbar mobile)

## Favicon

- **Base:** Elemento gráfico da etiqueta (ícone compacto)
- **Formato:** PNG
- **Tamanho:** 32x32px
- **Fundo:** Amarelo da marca com bordas pretas
- **Arquivo:** `public/vhera-tag-favicon.png`

## Tipografia

### Fonte Sugerida

- **Principal:** Plus Jakarta Sans (moderna, técnica, B2B)
- **Monospace:** JetBrains Mono (para código, IDs técnicos)

### Estilos

- **Títulos:** Caixa alta (uppercase), bold
- **Subtítulos:** Caixa alta ou title case, semibold
- **Corpo:** Title case ou sentence case, regular
- **Código:** Monospace, lowercase

## Componentes Impactados

### Componentes Globais

- `BrandSignature` - Assinatura da marca
- `Sidebar` - Navegação lateral
- `Topbar` - Barra superior

### Páginas

- `Login` - Tela de autenticação
- `Dashboard` - KPIs e métricas
- `Etiquetas` - Listagem e detalhes de etiquetas
- `Produtos` - Catálogo e upload CSV
- `Atualizacoes` - Histórico de atualizações
- `Historico` - Auditoria operacional
- `Alertas` - Dead-letter e alertas derivados
- `AdminDashboard` - Painel administrativo
- `AdminUsers` - Gestão de usuários

### Componentes Operacionais

- `KpiCard` - Cards de KPI
- `BadgeStatus` - Badges de status (online/offline)
- `BatteryBadge` - Indicador de bateria
- `UpdateStatusBadge` - Status de atualização
- `TagTable` - Tabela de etiquetas
- `TagFilters` - Filtros de busca
- `PreviewEtiqueta` - Preview visual de etiqueta
- `TagDetailsModal` - Modal de detalhes

## Critérios de Contraste

### Combinações Mínimas (WCAG AA)

- **Preto sobre amarelo:** 4.5:1 (botões primários, CTAs)
- **Branco sobre cinza escuro:** 7:1 (sidebar, topbar)
- **Preto sobre bege claro:** 12:1 (conteúdo principal)
- **Texto sobre status:** 4.5:1 (badges, alertas)

### Estados Interativos

- **Normal:** Contraste mínimo 4.5:1
- **Hover:** Aumentar contraste ou adicionar borda
- **Focus:** Indicador visível (outline ou box-shadow)
- **Disabled:** Reduzir opacidade, manter legibilidade

## Boas Práticas

### Cores

- Use variáveis CSS (`--brand-*`) sempre que possível
- Não codifique cores hex diretamente nos componentes
- Preserve cores operacionais (online/offline/low_battery)
- Diferencie marca de alertas por ícone + texto + cor

### Layout

- Mantenha hierarquia visual clara
- Use espaçamento consistente (múltiplos de 4px ou 8px)
- Preserve responsividade em todas as telas
- Teste em desktop e mobile

### Acessibilidade

- Use `alt` descritivo em imagens
- Use labels em campos de formulário
- Mantenha foco de teclado visível
- Não dependa exclusivamente de cor para transmitir informação

## Restrições

### Não Faça

- Não misture cores da marca com cores operacionais de forma confusa
- Não use amarelo da marca para alertas/warnings
- Não remova ícones/textos de badges (dependência de cor)
- Não quebre fluxos existentes por causa de visual
- Não ignore responsividade ou acessibilidade

### Deve Fazer

- Centralize estilos em variáveis CSS
- Preserve funcionalidade de todos os componentes
- Valide contraste manualmente
- Teste todos os fluxos após mudanças
- Documente qualquer desvio do design system

## Roadmap Futuro

### Curto Prazo

- [ ] Adicionar versão SVG do logo para melhor qualidade
- [ ] Criar variações por tamanho (small, medium, large)
- [ ] Implementar testes visuais automatizados (snapshot testing)

### Médio Prazo

- [ ] Criar Storybook para documentação de componentes
- [ ] Adicionar modo dark mode completo
- [ ] Implementar animações consistentes

### Longo Prazo

- [ ] Criar design tokens em formato JSON para uso multi-plataforma
- [ ] Expandir design system para mobile app
- [ ] Adicionar suporte a temas customizáveis

## Referências

- Logo original: [arquivo de imagem fornecido]
- Roadmap de implementação: `roadmap-vhera-tag-sdd-tdd.md`
- Design system anterior: `docs/brand/livelabel-design-system.md`
