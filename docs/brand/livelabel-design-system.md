# LiveLabel ESL — Design System

> **Etiquetas Digitais Sustentáveis**
> Versão 1.0 · Base para desenvolvimento frontend

---

## 1. Identidade visual

### Conceito central

> _"Natureza encontra tecnologia"_

O sistema visual é construído sobre dois pilares extraídos diretamente do logo:

- **Verde orgânico** → sustentabilidade, folhas, produtos físicos, responsabilidade ambiental
- **Azul tecnológico** → conectividade, dados em tempo real, precisão digital

A identidade deve transmitir **confiança operacional** (ambiente de varejo B2B) sem abrir mão do posicionamento sustentável que diferencia a marca.

---

## 2. Paleta de cores

### 2.1 Cores primárias (âncoras da marca)

| Token | Valor | Uso |
|---|---|---|
| `--color-brand-green` | `#1B7A56` | CTA principal, ícones de confirmação, bordas ativas |
| `--color-brand-blue` | `#1A6FA8` | Links, botões secundários, indicadores de conectividade |
| `--color-brand-green-mid` | `#24A877` | Hover states do verde, highlights |
| `--color-brand-blue-light` | `#3AB8F5` | Accents, gradientes, elementos decorativos |

### 2.2 Ramp verde (Success)

| Token | Valor | Uso |
|---|---|---|
| `--green-50` | `#D4F0E5` | Background de badge "online" |
| `--green-200` | `#87D9BA` | Bordas de status positivo |
| `--green-400` | `#24A877` | Ícones e indicators |
| `--green-600` | `#1B7A56` | Cor primária |
| `--green-800` | `#0F4A36` | Texto em fundo verde claro |
| `--green-900` | `#0A3D2B` | Texto em fundo verde médio |

### 2.3 Ramp azul (Info)

| Token | Valor | Uso |
|---|---|---|
| `--blue-50` | `#D0E8F8` | Background de badge "sincronizando" |
| `--blue-200` | `#7AC2EF` | Bordas de status informativo |
| `--blue-400` | `#3AB8F5` | Accents e highlights |
| `--blue-600` | `#1A6FA8` | Cor secundária |
| `--blue-800` | `#0D4E78` | Texto em fundo azul claro |
| `--blue-900` | `#082E48` | Texto em fundo azul médio |

### 2.4 Semânticas de status ESL

| Token | Valor | Significado |
|---|---|---|
| `--color-status-online` | `#1DB070` | Etiqueta conectada e operacional |
| `--color-status-syncing` | `#DDAA00` | Sincronização em andamento |
| `--color-status-offline` | `#E04040` | Sinal perdido ou erro |
| `--color-status-inactive` | `#7C7C7C` | Etiqueta desativada manualmente |
| `--color-status-low-battery` | `#F5A623` | Bateria abaixo de 20% |

### 2.5 Backgrounds e superfícies

| Token | Valor | Uso |
|---|---|---|
| `--surface-light` | `#F5F7FA` | Fundo de páginas light |
| `--surface-leaf` | `#EAFAF4` | Tint sustentável para seções de destaque |
| `--surface-dark` | `#0F1B29` | Fundo do painel operacional dark |
| `--surface-dark-card` | `#162233` | Cards dentro do painel dark |
| `--surface-dark-hover` | `#1C2D40` | Hover em itens do painel dark |

---

## 3. Tipografia

### 3.1 Fontes

```css
/* Display / Headings */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Body / UI */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Monospace (SKUs, IDs, valores técnicos) */
font-family: 'JetBrains Mono', monospace;
```

**Import Google Fonts:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### 3.2 Escala tipográfica

| Token | Tamanho | Peso | Line-height | Uso |
|---|---|---|---|---|
| `--text-hero` | 48px | 700 | 1.0 | Hero de landing page |
| `--text-h1` | 32px | 700 | 1.1 | Título de página |
| `--text-h2` | 24px | 600 | 1.2 | Seção, modal header |
| `--text-h3` | 18px | 600 | 1.3 | Card title, sidebar section |
| `--text-h4` | 16px | 500 | 1.4 | Subsections |
| `--text-body` | 14px | 400 | 1.7 | Texto corrido |
| `--text-small` | 13px | 400 | 1.5 | Labels, helper text |
| `--text-caption` | 11px | 400 | 1.4 | Metadados, timestamps |
| `--text-tag` | 11px | 500 | 1.0 | Badges, pills |
| `--text-mono` | 13px | 400 | 1.4 | SKUs, IDs, valores técnicos |

### 3.3 Gradiente de marca em texto

```css
.text-brand-gradient {
  background: linear-gradient(90deg, #1B7A56, #1A6FA8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Uso: headings de marca, títulos de seção em marketing. **Nunca** usar em texto funcional ou labels de UI.

---

## 4. Espaçamento

Escala baseada em múltiplos de 4px:

| Token | Valor | Uso |
|---|---|---|
| `--space-1` | `4px` | Gap mínimo entre elementos inline |
| `--space-2` | `8px` | Padding interno de badges |
| `--space-3` | `12px` | Gap entre itens de lista |
| `--space-4` | `16px` | Padding de cards compactos |
| `--space-5` | `20px` | Gap padrão entre componentes |
| `--space-6` | `24px` | Padding de cards padrão |
| `--space-8` | `32px` | Espaço entre seções |
| `--space-12` | `48px` | Margin de seções grandes |
| `--space-16` | `64px` | Padding de hero sections |

---

## 5. Border radius

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | `6px` | Inputs, small tags |
| `--radius-md` | `8px` | Botões, badges |
| `--radius-lg` | `10px` | Cards de etiqueta, tooltips |
| `--radius-xl` | `14px` | Cards principais, modais |
| `--radius-2xl` | `20px` | Pills de status, chips |
| `--radius-full` | `9999px` | Avatares, indicadores circulares |

---

## 6. Sombras e elevação

```css
/* Nível 0 — apenas borda */
--shadow-none: none;
border: 0.5px solid rgba(0,0,0,0.08);

/* Nível 1 — card em repouso */
--shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04);

/* Nível 2 — card hover / dropdown */
--shadow-md: 0 4px 16px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.06);

/* Nível 3 — modal / popover */
--shadow-lg: 0 12px 40px rgba(0,0,0,0.14), 0 0 1px rgba(0,0,0,0.08);

/* Especial — glow de marca (verde) */
--shadow-brand-green: 0 0 0 3px rgba(27,122,86,0.22);

/* Especial — glow de marca (azul) */
--shadow-brand-blue: 0 0 0 3px rgba(26,111,168,0.22);
```

---

## 7. Efeitos visuais

### 7.1 Glow ativo

Usado em: elementos com foco, etiqueta selecionada, inputs ativos.

```css
.active-glow-green {
  box-shadow: 0 0 0 3px rgba(27,122,86,0.22);
  border-color: #1B7A56;
}

.active-glow-blue {
  box-shadow: 0 0 0 3px rgba(26,111,168,0.22);
  border-color: #1A6FA8;
}
```

### 7.2 Glass morphism

Usado em: overlays flutuantes, painéis sobre mapa de loja, tooltips ricos.

```css
.glass {
  background: rgba(27,122,86,0.10);
  border: 1px solid rgba(27,122,86,0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

### 7.3 Stripe / padrão sustentável

Usado em: banners de promoção, headers de seção de destaque.

```css
.stripe-brand {
  background: repeating-linear-gradient(
    135deg,
    #1B7A56,
    #1B7A56 4px,
    #15644A 4px,
    #15644A 8px
  );
}
```

### 7.4 Gradiente de fundo (hero)

```css
.hero-gradient {
  background: linear-gradient(
    135deg,
    #EAFAF4 0%,
    #D0E8F8 50%,
    #F5F7FA 100%
  );
}
```

---

## 8. Animações e motion

### 8.1 Tokens de duração

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | `150ms` | Hover, feedback imediato |
| `--duration-base` | `200ms` | Transições de UI padrão |
| `--duration-slow` | `300ms` | Modais, painéis deslizantes |
| `--duration-sync` | `1400ms` | Animações de loop (sync, blink) |

### 8.2 Easing

```css
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);   /* entradas */
--ease-in:  cubic-bezier(0.4, 0.0, 1.0, 1);   /* saídas */
--ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1); /* transições */
```

### 8.3 Keyframes essenciais

```css
/* Indicador de conexão ao vivo */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

/* Botão / badge de notificação */
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(26,111,168,0.4); }
  50%       { box-shadow: 0 0 0 7px rgba(26,111,168,0); }
}

/* Entrada de card */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Spinner de sincronização */
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 8.4 Regra de acessibilidade

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 9. Componentes — especificação

### 9.1 Botões

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding: 8px 18px;
  border-radius: var(--radius-md);  /* 8px */
  border: none;
  cursor: pointer;
  transition: opacity var(--duration-fast), transform var(--duration-fast);
}

.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: 2px solid var(--color-brand-green); outline-offset: 2px; }

/* Variantes */
.btn-primary   { background: #1B7A56; color: #fff; }
.btn-secondary { background: #1A6FA8; color: #fff; }
.btn-ghost     { background: transparent; border: 1.5px solid #1B7A56; color: #1B7A56; }
.btn-danger    { background: #E04040; color: #fff; }

/* Hover */
.btn-primary:hover   { background: #24A877; }
.btn-secondary:hover { background: #2280BC; }
.btn-ghost:hover     { background: #D4F0E5; }
```

### 9.2 Badges de status

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: var(--radius-2xl);  /* 20px */
}

.badge-online   { background: #D4F0E5; color: #0F6040; }
.badge-syncing  { background: #D0E8F8; color: #0E4F80; }
.badge-warning  { background: #FEF3CC; color: #7A5000; }
.badge-offline  { background: #FDDEDE; color: #8C1C1C; }
.badge-inactive { background: #F0F0EE; color: #4A4A48; }

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
```

### 9.3 Card de etiqueta ESL

Componente que representa visualmente uma ESL física na UI:

```css
.esl-card {
  background: #fff;
  border: 1.5px solid var(--color-brand-blue);
  border-radius: var(--radius-xl);  /* 14px */
  padding: 12px 14px;
  max-width: 180px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--duration-base), transform var(--duration-base);
}

.esl-card:hover {
  box-shadow: var(--shadow-brand-blue);
  transform: translateY(-2px);
}

.esl-card.selected {
  border-color: var(--color-brand-green);
  box-shadow: var(--shadow-brand-green);
}

.esl-card .price {
  font-size: 26px;
  font-weight: 800;
  color: var(--color-brand-green);
  line-height: 1;
}

.esl-card .sync-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  color: #1DB070;
  font-weight: 500;
  margin-top: 8px;
}

.esl-card .sync-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1DB070;
  animation: blink 1.4s ease-in-out infinite;
}
```

### 9.4 Painel operacional (tema dark)

```css
.dashboard-dark {
  background: #0F1B29;
  color: #fff;
  border-radius: var(--radius-xl);
  padding: 16px;
}

.dashboard-dark .metric-card {
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius-lg);
  padding: 10px;
}

.dashboard-dark .metric-value {
  font-size: 22px;
  font-weight: 700;
}

.dashboard-dark .metric-green { color: #5DE8A8; }
.dashboard-dark .metric-blue  { color: #63C8F5; }
.dashboard-dark .metric-amber { color: #F5B942; }

.dashboard-dark .list-item {
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-lg);
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background var(--duration-fast);
}

.dashboard-dark .list-item:hover {
  background: rgba(255,255,255,0.09);
}
```

---

## 10. Temas

### 10.1 Light — páginas públicas e marketing

```css
:root[data-theme="light"] {
  --bg-page: #F5F7FA;
  --bg-surface: #FFFFFF;
  --bg-tint: #EAFAF4;
  --text-primary: #0F1B29;
  --text-secondary: #4A5568;
  --text-tertiary: #8899A6;
  --border-default: rgba(0,0,0,0.08);
}
```

### 10.2 Dark — painel operacional

```css
:root[data-theme="dark"] {
  --bg-page: #0A1520;
  --bg-surface: #0F1B29;
  --bg-card: #162233;
  --bg-hover: #1C2D40;
  --text-primary: #E8EFF5;
  --text-secondary: #9BB0C0;
  --text-tertiary: #5A7080;
  --border-default: rgba(255,255,255,0.08);
}
```

---

## 11. Telas e contextos de uso

| Tela | Tema | Cor dominante | Efeito principal |
|---|---|---|---|
| Landing page / marketing | Light + leaf tint | Verde | Fade-up de entrada, gradiente hero |
| Dashboard operador | Dark | Verde accent | Pulse em alertas, dot animado |
| Mapa de loja (grid de ESLs) | Dark | Azul info | Hover glow, seleção com glow verde |
| Edição de preço / modal | Light overlay | Verde CTA | Glow no campo ativo, animação save |
| Relatórios e analytics | Light neutro | Ambos | Charts suaves, sem distração |
| Login / onboarding | Light + gradiente | Ambos | Motion de entrada staggered |
| Alertas / notificações | Sem tema fixo | Status semântico | Pulse no badge |

---

## 12. Princípios de UI

1. **Clareza operacional primeiro** — o operador de loja precisa de informação rápida; não sacrifique legibilidade por estética.
2. **Status sempre visível** — toda etiqueta deve ter seu estado (online/sync/offline/bateria) acessível em no máximo 1 clique.
3. **Verde = ação positiva, azul = informação, âmbar = atenção, vermelho = erro** — nunca inverter esse mapeamento.
4. **Animações com propósito** — nenhum elemento animado sem razão funcional; animação de sync comunica que algo está acontecendo, não é decoração.
5. **Escala mobile-first** — operadores usam tablets e celulares na loja; componentes com touch targets mínimos de 44×44px.
6. **Densidade adaptável** — painel dark pode ser mais denso (mais dados por cm²); páginas de marketing precisam de espaço negativo generoso.

---

## 13. Variáveis CSS — arquivo base

```css
/* livelabel-tokens.css */
:root {
  /* Brand */
  --color-brand-green: #1B7A56;
  --color-brand-blue:  #1A6FA8;
  --color-brand-green-mid: #24A877;
  --color-brand-blue-light: #3AB8F5;

  /* Status */
  --color-status-online:      #1DB070;
  --color-status-syncing:     #DDAA00;
  --color-status-offline:     #E04040;
  --color-status-inactive:    #7C7C7C;
  --color-status-low-battery: #F5A623;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-5: 20px; --space-6: 24px;
  --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;  --radius-md: 8px;  --radius-lg: 10px;
  --radius-xl: 14px; --radius-2xl: 20px; --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 40px rgba(0,0,0,0.14), 0 0 1px rgba(0,0,0,0.08);
  --shadow-brand-green: 0 0 0 3px rgba(27,122,86,0.22);
  --shadow-brand-blue:  0 0 0 3px rgba(26,111,168,0.22);

  /* Duration */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --duration-sync: 1400ms;

  /* Easing */
  --ease-out:   cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-in:    cubic-bezier(0.4, 0.0, 1.0, 1);
  --ease-inout: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

*LiveLabel Design System v1.0 — gerado com base no logo oficial*
*Atualizar este documento a cada decisão de design aprovada pelo time*
