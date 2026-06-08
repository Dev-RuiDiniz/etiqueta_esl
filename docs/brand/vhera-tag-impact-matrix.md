# Matriz de Impacto - Integração Vhera Tag

Este documento mapeia todos os arquivos e componentes do frontend que serão impactados pela integração da identidade visual Vhera Tag.

## Categorização por Prioridade

### Prioridade CRÍTICA (Obrigatório para MVP)

Alterações essenciais para que a nova identidade esteja presente em todos os pontos visuais públicos.

#### Arquivos de Configuração e Metadados

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `index.html` | Substituir título e favicon | Alto (aba do navegador) | Baixo |
| `src/styles/theme.css` | Adicionar tokens CSS Vhera Tag | Alto (tema global) | Médio |
| `src/styles/previewEtiqueta.css` | Revisar cores se necessário | Médio (preview) | Baixo |

#### Componentes Globais de Marca

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/BrandSignature.tsx` | Substituir logo e texto | Alto (assinatura) | Médio |
| `src/components/Sidebar.tsx` | Aplicar tema Vhera Tag | Alto (navegação) | Alto |
| `src/components/Topbar.tsx` | Aplicar tema Vhera Tag | Alto (barra superior) | Médio |

#### Páginas Principais

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/pages/Login.tsx` | Rebrand completo | Alto (ponto de entrada) | Alto |
| `src/pages/Dashboard.tsx` | Validar tema aplicado | Alto (página principal) | Médio |
| `src/pages/Etiquetas.tsx` | Validar tema aplicado | Alto (fluxo principal) | Médio |

#### Assets Públicos

| Diretório/Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|-------------------|------------------|----------------|-------|
| `public/livelabel-logo.jpg` | Substituir por vhera-tag-logo.png | Alto (favicon) | Baixo |
| `src/assets/brand/` | Adicionar vhera-tag-logo.png e vhera-tag-icon.png | Alto (componentes) | Baixo |

---

### Prioridade ALTA (Importante para consistência)

Componentes operacionais que devem refletir o novo tema sem comprometer a semântica de status.

#### Componentes de Status e Badges

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/BadgeStatus.tsx` | Aplicar tema, preservar semântica | Médio (status) | Alto |
| `src/components/BatteryBadge.tsx` | Aplicar tema, preservar semântica | Médio (bateria) | Alto |
| `src/components/UpdateStatusBadge.tsx` | Aplicar tema, preservar semântica | Médio (atualização) | Alto |
| `src/components/alerts/AlertStatusBadge.tsx` | Aplicar tema, preservar semântica | Médio (alertas) | Alto |
| `src/components/alerts/AlertPriorityBadge.tsx` | Aplicar tema, preservar semântica | Médio (prioridade) | Alto |
| `src/components/alerts/AlertTypeBadge.tsx` | Aplicar tema, preservar semântica | Médio (tipo) | Alto |
| `src/components/history/HistoryStatusBadge.tsx` | Aplicar tema, preservar semântica | Médio (histórico) | Alto |
| `src/components/history/HistorySourceBadge.tsx` | Aplicar tema, preservar semântica | Médio (origem) | Alto |

#### Componentes de Cards e KPIs

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/KpiCard.tsx` | Aplicar tema Vhera Tag | Médio (KPIs) | Médio |
| `src/components/LastSystemUpdate.tsx` | Aplicar tema se necessário | Baixo (info) | Baixo |

#### Componentes de Tabelas e Listas

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/TagTable.tsx` | Aplicar tema Vhera Tag | Médio (tabela) | Médio |
| `src/components/TagFilters.tsx` | Aplicar tema Vhera Tag | Médio (filtros) | Médio |
| `src/components/alerts/AlertsTable.tsx` | Aplicar tema Vhera Tag | Médio (tabela) | Médio |
| `src/components/alerts/AlertFiltersBar.tsx` | Aplicar tema Vhera Tag | Médio (filtros) | Médio |
| `src/components/history/HistoryTable.tsx` | Aplicar tema Vhera Tag | Médio (tabela) | Médio |
| `src/components/history/HistoryFiltersBar.tsx` | Aplicar tema Vhera Tag | Médio (filtros) | Médio |

#### Componentes de Estado

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/common/EmptyState.tsx` | Aplicar tema se necessário | Baixo (estado vazio) | Baixo |
| `src/components/common/ErrorState.tsx` | Aplicar tema se necessário | Baixo (erro) | Baixo |
| `src/components/common/LoadingState.tsx` | Aplicar tema se necessário | Baixo (loading) | Baixo |
| `src/components/PagePlaceholder.tsx` | Aplicar tema se necessário | Baixo (placeholder) | Baixo |

---

### Prioridade MÉDIA (Consistência adicional)

Páginas e componentes que devem estar consistentes com o novo tema.

#### Páginas Secundárias

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/pages/Produtos.tsx` | Validar tema aplicado | Médio (catálogo) | Médio |
| `src/pages/Atualizacoes.tsx` | Validar tema aplicado | Médio (atualizações) | Médio |
| `src/pages/Historico.tsx` | Validar tema aplicado | Médio (auditoria) | Médio |
| `src/pages/Alertas.tsx` | Validar tema aplicado | Médio (alertas) | Médio |
| `src/pages/AdminDashboard.tsx` | Validar tema aplicado | Médio (admin) | Médio |
| `src/pages/AdminUsers.tsx` | Validar tema aplicado | Médio (usuários) | Médio |

#### Componentes de Forms e Modais

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| `src/components/SingleUpdateForm.tsx` | Aplicar tema se necessário | Baixo (form) | Baixo |
| `src/components/BulkUpdateUploader.tsx` | Aplicar tema se necessário | Baixo (upload) | Baixo |
| `src/components/BulkUpdateTable.tsx` | Aplicar tema se necessário | Baixo (tabela) | Baixo |
| `src/components/TagDetailsModal.tsx` | Aplicar tema se necessário | Baixo (modal) | Baixo |
| `src/components/PreviewEtiqueta.tsx` | Aplicar tema se necessário | Baixo (preview) | Baixo |

---

### Prioridade BAIXA (Melhorias futuras)

Componentes que podem ser ajustados em iterações posteriores se necessário.

| Arquivo | Tipo de Alteração | Impacto Visual | Risco |
|--------|------------------|----------------|-------|
| Componentes internos não listados | Ajustes finos de tema | Baixo | Baixo |
| Animações e transições | Adicionar animações consistentes | Baixo | Baixo |
| Componentes reutilizáveis genéricos | Padronizar com design system | Baixo | Baixo |

---

## Resumo por Categoria

### Total de Arquivos por Prioridade

- **CRÍTICA:** 11 arquivos
- **ALTA:** 23 arquivos
- **MÉDIA:** 11 arquivos
- **BAIXA:** 3+ arquivos (variável)

### Total de Arquivos por Tipo

- **Configuração/Metadados:** 3 arquivos
- **Componentes Globais:** 3 arquivos
- **Páginas:** 9 arquivos
- **Componentes de Status/Badges:** 8 arquivos
- **Componentes de Cards/KPIs:** 2 arquivos
- **Componentes de Tabelas/Listas:** 6 arquivos
- **Componentes de Estado:** 4 arquivos
- **Componentes de Forms/Modais:** 5 arquivos
- **Assets:** 1 diretório + 2 arquivos

---

## Riscos Específicos por Arquivo

### Alto Risco

1. **`src/components/Sidebar.tsx`**
   - Risco: Quebra de navegação ou responsividade
   - Mitigação: Testar todos os links e permissões

2. **`src/pages/Login.tsx`**
   - Risco: Quebra de autenticação
   - Mitigação: Testar login válido/inválido/loading

3. **`src/components/BadgeStatus.tsx`**
   - Risco: Confusão entre cor de marca e status operacional
   - Mitigação: Preservar semântica, não depender só de cor

4. **`src/components/BatteryBadge.tsx`**
   - Risco: Confusão entre cor de marca e bateria baixa
   - Mitigação: Usar ícone + texto, cor distinta da marca

5. **`src/components/UpdateStatusBadge.tsx`**
   - Risco: Perda de clareza de status de atualização
   - Mitigação: Preservar ícones e semântica

6. **`src/components/alerts/AlertStatusBadge.tsx`**
   - Risco: Alertas confundidos com cor de marca
   - Mitigação: Usar cores operacionais preservadas

### Médio Risco

1. **`src/styles/theme.css`**
   - Risco: Quebra de componentes que dependem de variáveis
   - Mitigação: Build e lint após mudança

2. **`src/components/BrandSignature.tsx`**
   - Risco: Layout quebrado em sidebar compacta
   - Mitigação: Testar responsividade

3. **`src/components/Topbar.tsx`**
   - Risco: Quebra de layout ou logout
   - Mitigação: Testar logout e responsividade

4. **`src/pages/Dashboard.tsx`**
   - Risco: KPIs ilegíveis ou informação perdida
   - Mitigação: Validar todos os cards

5. **`src/components/KpiCard.tsx`**
   - Risco: Hierarquia visual perdida
   - Mitigação: Validar contraste e layout

---

## Ordem Sugerida de Execução

### Fase 1 - Fundação (Crítica)
1. `index.html` - Título e favicon
2. `src/styles/theme.css` - Tokens CSS
3. `src/assets/brand/` - Adicionar assets
4. `public/` - Substituir favicon

### Fase 2 - Componentes Globais (Crítica)
5. `src/components/BrandSignature.tsx`
6. `src/components/Sidebar.tsx`
7. `src/components/Topbar.tsx`

### Fase 3 - Páginas Principais (Crítica)
8. `src/pages/Login.tsx`
9. `src/pages/Dashboard.tsx`
10. `src/pages/Etiquetas.tsx`

### Fase 4 - Componentes Operacionais (Alta)
11. `src/components/BadgeStatus.tsx`
12. `src/components/BatteryBadge.tsx`
13. `src/components/UpdateStatusBadge.tsx`
14. `src/components/KpiCard.tsx`
15. Badges de alertas e histórico

### Fase 5 - Tabelas e Filtros (Alta)
16. `src/components/TagTable.tsx`
17. `src/components/TagFilters.tsx`
18. Tabelas e filtros de alertas/histórico

### Fase 6 - Páginas Secundárias (Média)
19. `src/pages/Produtos.tsx`
20. `src/pages/Atualizacoes.tsx`
21. `src/pages/Historico.tsx`
22. `src/pages/Alertas.tsx`
23. `src/pages/AdminDashboard.tsx`
24. `src/pages/AdminUsers.tsx`

### Fase 7 - Componentes Restantes (Baixa)
25. Forms, modais, estados
26. Ajustes finos e polimento

---

## Validação por Fase

### Após Fase 1
- [ ] Build passa (`npm run build`)
- [ ] Título da aba exibe "Vhera Tag"
- [ ] Favicon carrega corretamente

### Após Fase 2
- [ ] Build passa
- [ ] Lint passa
- [ ] Sidebar exibe logo Vhera Tag
- [ ] Topbar exibe marca Vhera Tag
- [ ] Navegação funcional
- [ ] Logout funcional

### Após Fase 3
- [ ] Login funcional
- [ ] Dashboard exibe KPIs corretamente
- [ ] Etiquetas exibem status legíveis
- [ ] Responsividade preservada

### Após Fase 4
- [ ] Status operacionais distinguíveis
- [ ] Não há confusão com cor de marca
- [ ] Ícones e textos presentes em badges

### Após Fase 5
- [ ] Tabelas legíveis
- [ ] Filtros funcionais
- [ ] Estados vazios preservados

### Após Fase 6
- [ ] Todas as páginas consistentes
- [ ] RBAC visual preservado
- [ ] Fluxos administrativos funcionais

### Após Fase 7
- [ ] Build final passa
- [ ] Lint final passa
- [ ] Testes backend passam
- [ ] Validação manual completa

---

## Notas Importantes

1. **Preservação de Funcionalidade:** Nenhuma mudança deve quebrar fluxos existentes
2. **Semântica de Status:** Cores operacionais (online/offline/low_battery) não devem ser confundidas com a marca
3. **Contraste:** Validar contraste manualmente em todas as mudanças
4. **Responsividade:** Testar em desktop e mobile após cada fase
5. **Acessibilidade:** Manter labels, alt text e foco de teclado
6. **Build Contínuo:** Rodar `npm run build` após cada mudança significativa

---

## Referências

- Especificação Visual: `docs/brand/vhera-tag-design-system.md`
- Roadmap de Implementação: `roadmap-vhera-tag-sdd-tdd.md`
- Plano SDD: `.windsurf/plans/plano-sdd-integracao-vhera-tag-11b35e.md`
