# Roadmap — Integração da Identidade Visual Vhera Tag no Frontend

## 1. Contexto

Este roadmap descreve a integração da identidade visual **Vhera Tag** ao frontend do projeto `Dev-RuiDiniz/etiqueta_esl`, aplicando práticas de **SDD (Specification-Driven Development)** e **TDD (Test-Driven Development)** em cada etapa.

A identidade visual de referência apresenta uma linguagem industrial, técnica e operacional, com predominância de:

- Amarelo/laranja como cor de marca.
- Preto como cor de contraste e força visual.
- Cinza escuro como base neutra.
- Ícone de etiqueta com código de barras.
- Tipografia forte, em caixa alta, com presença visual B2B/logística.

## 2. Objetivo do Roadmap

Integrar a identidade **Vhera Tag** ao frontend de forma consistente, segura e validável, garantindo que a nova marca esteja presente em:

- Assets de marca.
- Favicon.
- Título público da aplicação.
- Tema global.
- Sidebar.
- Topbar.
- Tela de login.
- Componentes visuais reutilizáveis.
- Páginas principais.
- Documentação técnica e guia visual.

A entrega deve preservar os fluxos existentes, responsividade, acessibilidade básica, feedback visual e clareza dos estados operacionais.

## 3. Princípios de Implementação

### 3.1 SDD — Specification-Driven Development

Antes de implementar cada tarefa, deve existir uma especificação mínima contendo:

- Objetivo da alteração.
- Comportamento esperado.
- Arquivos impactados.
- Estados visuais esperados.
- Critérios de aceite.
- Riscos.
- Estratégia de validação.

A especificação deve guiar a implementação e servir como base para revisão.

### 3.2 TDD — Test-Driven Development

Para cada alteração testável, seguir o ciclo:

1. Escrever ou ajustar teste que descreve o comportamento esperado.
2. Ver o teste falhar quando aplicável.
3. Implementar a menor alteração necessária.
4. Rodar os testes.
5. Refatorar mantendo os testes passando.

Nem toda mudança visual será perfeitamente validável por teste automatizado, mas as regras abaixo devem ser aplicadas:

- Componentes com lógica devem ter testes.
- Renderização de marca, textos, links e estados deve ser coberta quando viável.
- Fluxos críticos devem ter testes de integração.
- Mudanças puramente visuais devem ter checklist manual e, idealmente, snapshot/visual test no futuro.

## 4. Branch e Versionamento

Branch sugerida:

```bash
feature/integra-identidade-vhera-tag
```

Commits sugeridos:

```bash
feat(brand): adiciona assets da identidade vhera tag
style(theme): aplica paleta visual vhera tag
style(layout): atualiza sidebar topbar e assinatura da marca
style(login): integra nova identidade na tela de autenticação
test(frontend): cobre renderização da marca e fluxos visuais críticos
docs(brand): documenta guia visual vhera tag
```

## 5. Roadmap por Fases

---

# Fase 0 — Especificação Inicial da Identidade

## Objetivo

Formalizar a identidade visual Vhera Tag antes de alterar código.

## Entregáveis

- Documento de especificação visual.
- Paleta preliminar.
- Regras de uso do logo.
- Critérios de contraste.
- Lista de componentes impactados.

## Arquivos prováveis

```text
docs/brand/vhera-tag-design-system.md
docs/brand/vhera-tag-roadmap.md
```

## Tasks com SDD e TDD

### Task 0.1 — Criar especificação visual da marca

#### SDD

Especificar:

- Nome público: `Vhera Tag`.
- Cores principais.
- Cores de apoio.
- Uso correto do logo.
- Uso incorreto do logo.
- Regras para fundos claros e escuros.
- Critérios mínimos de contraste.
- Diferença entre cor de marca e cor de alerta operacional.

#### TDD

Não se aplica teste automatizado direto nesta task.

#### Validação

- Revisão manual do documento.
- Confirmação de que a especificação é suficiente para orientar implementação.

#### Critérios de aceite

- Documento criado em Markdown.
- Paleta definida.
- Riscos visuais documentados.
- Regras de uso da marca documentadas.

---

### Task 0.2 — Definir matriz de impacto no frontend

#### SDD

Mapear os arquivos e componentes impactados:

- `src/styles/theme.css`
- `src/components/BrandSignature.tsx`
- `src/components/Sidebar.tsx`
- `src/components/Topbar.tsx`
- `src/pages/Login.tsx`
- `src/components/KpiCard.tsx`
- `src/components/BadgeStatus.tsx`
- `src/components/BatteryBadge.tsx`
- `src/components/UpdateStatusBadge.tsx`
- `src/components/PagePlaceholder.tsx`
- `index.html`
- `public/`

#### TDD

Não se aplica teste automatizado direto nesta task.

#### Validação

- Conferir se todos os pontos visuais públicos foram mapeados.

#### Critérios de aceite

- Lista de arquivos impactados documentada.
- Separação entre alteração obrigatória e melhoria futura.

---

# Fase 1 — Assets da Marca

## Objetivo

Adicionar os assets da identidade Vhera Tag ao projeto de forma organizada e reutilizável.

## Entregáveis

- Logo principal.
- Ícone compacto.
- Favicon.
- Referência do asset original.
- Nomes padronizados.

## Arquivos prováveis

```text
src/assets/brand/vhera-tag-logo.png
src/assets/brand/vhera-tag-icon.png
public/vhera-tag-favicon.png
public/vhera-tag-logo.png
```

## Tasks com SDD e TDD

### Task 1.1 — Adicionar assets base da marca

#### SDD

Especificar:

- Caminhos finais dos assets.
- Formatos aceitos.
- Tamanhos mínimos.
- Nomeação dos arquivos.
- Política para substituir assets antigos sem apagar histórico indevido.

#### TDD

Teste automatizado sugerido:

- Verificar se o componente de assinatura importa o novo asset corretamente.
- Verificar se o texto alternativo da imagem existe.

Exemplo de comportamento esperado:

```text
Dado que o componente BrandSignature é renderizado
Quando a marca é exibida
Então o logo Vhera Tag deve estar presente
E deve possuir texto alternativo acessível
```

#### Validação

```bash
npm run build
```

#### Critérios de aceite

- Assets adicionados em diretórios corretos.
- Build não quebra por import inválido.
- Logo possui `alt` descritivo quando renderizado.

---

### Task 1.2 — Atualizar favicon e metadados públicos

#### SDD

Especificar:

- Novo título da aplicação.
- Novo favicon.
- Texto público exibido na aba do navegador.
- Compatibilidade com Vercel.

#### TDD

Teste automatizado sugerido:

- Se houver teste de DOM/HTML, validar que `index.html` contém título esperado.
- Caso não exista infraestrutura, validar por checklist manual.

Comportamento esperado:

```text
Dado que a aplicação é aberta no navegador
Quando a página carrega
Então o título da aba deve exibir Vhera Tag
E o favicon deve apontar para o asset da nova marca
```

#### Validação

```bash
npm run build
npm run dev
```

#### Critérios de aceite

- `index.html` atualizado.
- Favicon atualizado.
- Título da aba atualizado.
- Build concluído com sucesso.

---

# Fase 2 — Tema Global e Design Tokens

## Objetivo

Aplicar a paleta Vhera Tag de forma centralizada, evitando estilos espalhados e reduzindo risco de inconsistência visual.

## Entregáveis

- Tokens CSS atualizados.
- Paleta documentada.
- Contraste básico validado.
- Cores operacionais preservadas.

## Arquivos prováveis

```text
src/styles/theme.css
src/styles/global.css
docs/brand/vhera-tag-design-system.md
```

## Paleta inicial sugerida

```css
:root {
  --brand-primary: #ffb000;
  --brand-primary-strong: #f59e00;
  --brand-dark: #111111;
  --brand-surface-dark: #2f2f2f;
  --brand-surface: #f7f3e8;
  --brand-border: #d79400;
  --brand-text: #111111;
  --brand-text-inverse: #ffffff;
}
```

## Tasks com SDD e TDD

### Task 2.1 — Criar tokens visuais Vhera Tag

#### SDD

Especificar:

- Cores principais.
- Cores de fundo.
- Cores de texto.
- Cores de borda.
- Cores de hover/focus.
- Cores operacionais que não devem ser confundidas com a marca.

#### TDD

Teste automatizado sugerido:

- Validar que componentes principais continuam renderizando sem erro após mudança de tema.
- Criar teste de regressão para classes/tokens usados em componentes críticos, se aplicável.

Comportamento esperado:

```text
Dado que o tema global é carregado
Quando os componentes principais são renderizados
Então nenhum componente deve falhar por variável ou classe inexistente
```

#### Validação

```bash
npm run build
npm run lint
```

#### Critérios de aceite

- Tokens centralizados.
- Nenhum estilo crítico quebrado.
- Cores de status operacional preservadas.
- Estados hover/focus mantidos.

---

### Task 2.2 — Validar contraste visual

#### SDD

Especificar combinações mínimas:

- Preto sobre amarelo.
- Branco sobre cinza escuro.
- Texto principal sobre superfície clara.
- Botão primário em estados normal, hover, focus e disabled.
- Badges de status.

#### TDD

Teste automatizado opcional:

- Adicionar utilitário de teste para verificar contraste de combinações críticas, se o projeto aceitar dependência/utilitário próprio.
- Caso contrário, checklist manual.

Comportamento esperado:

```text
Dado que um botão primário é exibido
Quando está nos estados normal, hover, focus e disabled
Então o texto deve permanecer legível
```

#### Validação

- Checklist manual de contraste.
- Teste em desktop e mobile.
- Inspeção visual em telas críticas.

#### Critérios de aceite

- Botões legíveis.
- Sidebar legível.
- Topbar legível.
- Alertas não confundidos com marca.
- Foco de teclado visível.

---

# Fase 3 — Componentes Globais de Marca

## Objetivo

Atualizar os componentes globais para exibir a identidade Vhera Tag de forma consistente.

## Entregáveis

- Assinatura de marca atualizada.
- Sidebar atualizada.
- Topbar atualizada.
- Estados ativos e hover adaptados.
- Layout responsivo preservado.

## Arquivos prováveis

```text
src/components/BrandSignature.tsx
src/components/Sidebar.tsx
src/components/Topbar.tsx
src/layouts/
```

## Tasks com SDD e TDD

### Task 3.1 — Atualizar BrandSignature

#### SDD

Especificar:

- Como o logo será exibido.
- Texto alternativo.
- Variante compacta.
- Variante para fundo escuro.
- Comportamento em telas menores.

#### TDD

Teste automatizado:

```text
Dado que BrandSignature é renderizado
Quando a aplicação carrega
Então deve exibir a marca Vhera Tag
E deve conter imagem com alt acessível
```

#### Validação

```bash
npm run test -- BrandSignature
npm run build
```

Caso não exista script específico de teste frontend:

```bash
npm run build
```

#### Critérios de aceite

- Logo renderiza corretamente.
- Texto alternativo presente.
- Não há referência visual pública à marca anterior neste componente.
- Layout não quebra em sidebar compacta.

---

### Task 3.2 — Atualizar Sidebar

#### SDD

Especificar:

- Fundo da sidebar.
- Cor do item ativo.
- Cor do hover.
- Cor dos ícones/textos.
- Comportamento responsivo.
- Preservação de links e permissões.

#### TDD

Testes sugeridos:

```text
Dado que a Sidebar é renderizada
Quando o usuário está em uma rota ativa
Então o item correspondente deve estar visualmente marcado
E a marca Vhera Tag deve estar visível
```

```text
Dado que um usuário sem permissão admin acessa a UI
Quando a Sidebar é renderizada
Então links administrativos não devem ser exibidos
```

#### Validação

```bash
npm run build
npm run lint
```

Checklist manual:

- Dashboard.
- Etiquetas.
- Produtos.
- Atualizações.
- Histórico.
- Alertas.
- Admin.

#### Critérios de aceite

- Navegação preservada.
- Estado ativo visível.
- Responsividade preservada.
- Permissões preservadas.
- Sem regressão visual severa.

---

### Task 3.3 — Atualizar Topbar

#### SDD

Especificar:

- Uso da marca ou assinatura compacta.
- Cores de fundo/texto.
- Exibição do usuário atual.
- Ação de logout.
- Estados hover/focus.

#### TDD

Testes sugeridos:

```text
Dado que a Topbar é renderizada com usuário autenticado
Quando a tela carrega
Então deve exibir informações do usuário
E deve manter ação de logout disponível
```

#### Validação

```bash
npm run build
```

Checklist manual:

- Usuário autenticado.
- Logout.
- Responsividade.
- Foco de teclado.

#### Critérios de aceite

- Topbar atualizada visualmente.
- Logout preservado.
- Usuário atual preservado.
- Contraste adequado.

---

# Fase 4 — Tela de Login

## Objetivo

Aplicar a identidade Vhera Tag à tela de login, mantendo segurança, acessibilidade e tratamento de erro.

## Arquivos prováveis

```text
src/pages/Login.tsx
src/services/authService.ts
src/lib/auth.ts
```

## Tasks com SDD e TDD

### Task 4.1 — Rebrand da tela de login

#### SDD

Especificar:

- Layout visual.
- Exibição do logo.
- Título e subtítulo.
- Estilo dos campos.
- Estilo do botão.
- Estados de loading e erro.
- Responsividade.
- Acessibilidade de labels.

#### TDD

Testes sugeridos:

```text
Dado que a tela de login é aberta
Quando ela renderiza
Então deve exibir a marca Vhera Tag
E deve exibir campos de e-mail e senha com labels acessíveis
```

```text
Dado que o usuário informa credenciais inválidas
Quando a API retorna erro
Então a mensagem de erro deve ser exibida sem quebrar o layout
```

```text
Dado que o usuário submete o login
Quando a requisição está em andamento
Então o botão deve indicar estado de carregamento
```

#### Validação

```bash
npm run build
npm run lint
```

Checklist manual:

- Login válido.
- Login inválido.
- Loading.
- Erro de rede.
- Mobile.
- Desktop.

#### Critérios de aceite

- Logo e nome Vhera Tag visíveis.
- Campos acessíveis.
- Erros visíveis.
- Loading preservado.
- Nenhuma regressão de autenticação.

---

# Fase 5 — Componentes Visuais Operacionais

## Objetivo

Adaptar cards, badges, tabelas e componentes operacionais sem comprometer a leitura dos status do sistema.

## Arquivos prováveis

```text
src/components/KpiCard.tsx
src/components/BadgeStatus.tsx
src/components/BatteryBadge.tsx
src/components/UpdateStatusBadge.tsx
src/components/PagePlaceholder.tsx
src/components/TagTable.tsx
src/components/TagFilters.tsx
src/components/PreviewEtiqueta.tsx
src/components/TagDetailsModal.tsx
```

## Tasks com SDD e TDD

### Task 5.1 — Atualizar KpiCard

#### SDD

Especificar:

- Estilo do card.
- Destaque numérico.
- Cor de borda.
- Estados de loading/erro, se houver.
- Contraste.

#### TDD

Teste sugerido:

```text
Dado que KpiCard recebe título e valor
Quando renderizado
Então deve exibir ambos corretamente
E manter estrutura acessível
```

#### Validação

```bash
npm run build
```

#### Critérios de aceite

- KPIs legíveis.
- Hierarquia visual clara.
- Tema Vhera Tag aplicado.

---

### Task 5.2 — Atualizar badges de status sem perder semântica

#### SDD

Especificar:

- `online`.
- `offline`.
- `low_battery`.
- `update_failed`.
- `pending`.
- `success`.
- `error`.

A cor amarela da marca não deve substituir automaticamente warning operacional.

#### TDD

Testes sugeridos:

```text
Dado que BadgeStatus recebe status online
Quando renderizado
Então deve exibir texto e classe visual correspondente
```

```text
Dado que BatteryBadge recebe bateria baixa
Quando renderizado
Então deve indicar estado crítico sem depender apenas de cor
```

#### Validação

```bash
npm run build
```

Checklist manual:

- Etiqueta online.
- Etiqueta offline.
- Bateria baixa.
- Falha de atualização.
- Alerta resolvido.
- Dead-letter.

#### Critérios de aceite

- Status continuam distinguíveis.
- Não há dependência exclusiva de cor.
- Ícones/textos ajudam na identificação.
- Marca não confunde estados operacionais.

---

### Task 5.3 — Atualizar tabelas e filtros

#### SDD

Especificar:

- Cabeçalho de tabela.
- Linhas.
- Hover.
- Seleção.
- Campos de filtro.
- Estados vazio/loading/erro.

#### TDD

Testes sugeridos:

```text
Dado que uma tabela de etiquetas recebe lista vazia
Quando renderizada
Então deve exibir estado vazio compreensível
```

```text
Dado que filtros são alterados
Quando o usuário aplica busca
Então os campos devem preservar valor e disparar comportamento esperado
```

#### Validação

```bash
npm run build
```

Checklist manual:

- Listagem com dados.
- Listagem vazia.
- Filtros.
- Paginação, se aplicável.
- Mobile.

#### Critérios de aceite

- Tabelas legíveis.
- Filtros claros.
- Estados vazios preservados.
- Responsividade preservada.

---

# Fase 6 — Páginas Principais

## Objetivo

Garantir que todas as páginas públicas/autenticadas estejam visualmente consistentes com Vhera Tag.

## Páginas impactadas

```text
src/pages/Dashboard.tsx
src/pages/Etiquetas.tsx
src/pages/Produtos.tsx
src/pages/Atualizacoes.tsx
src/pages/Historico.tsx
src/pages/Alertas.tsx
src/pages/AdminDashboard.tsx
src/pages/AdminUsers.tsx
```

## Tasks com SDD e TDD

### Task 6.1 — Validar Dashboard

#### SDD

Especificar:

- Cards principais.
- Hierarquia visual.
- Cores de destaque.
- Estados de carregamento.
- Estados de erro.

#### TDD

Testes sugeridos:

```text
Dado que o dashboard recebe dados de KPIs
Quando renderizado
Então os cards devem exibir os indicadores corretamente
```

#### Validação

- Teste automatizado quando houver infraestrutura.
- Checklist manual em desktop e mobile.

#### Critérios de aceite

- Dashboard consistente.
- KPIs legíveis.
- Nenhuma informação operacional perdida.

---

### Task 6.2 — Validar Etiquetas

#### SDD

Especificar:

- Lista de etiquetas.
- Filtros.
- Detalhes.
- Ações.
- Estados operacionais.

#### TDD

Testes sugeridos:

```text
Dado que a página Etiquetas carrega
Quando existem etiquetas retornadas pela API
Então a tabela deve exibir status, bateria e vínculo de produto
```

```text
Dado que uma ação de refresh é executada
Quando a API responde com sucesso
Então a tela deve atualizar sem depender de refresh manual
```

#### Validação

- Teste automatizado quando possível.
- Teste manual com mock e BFF real.

#### Critérios de aceite

- Fluxo principal preservado.
- Atualização imediata preservada.
- Status legíveis.

---

### Task 6.3 — Validar Produtos

#### SDD

Especificar:

- Lista de produtos.
- Formulário de upsert.
- Upload CSV.
- Estados de erro/sucesso.
- Feedback visual.

#### TDD

Testes sugeridos:

```text
Dado que um CSV válido é enviado
Quando o parser processa o arquivo
Então os produtos válidos devem ser exibidos para confirmação
```

```text
Dado que um CSV inválido é enviado
Quando a validação falha
Então a mensagem de erro deve ser exibida
```

#### Validação

- Testar CSV válido.
- Testar CSV inválido.
- Testar limite de arquivo.
- Testar atualização de lista após upsert.

#### Critérios de aceite

- Upload preservado.
- Erros claros.
- Sucesso claro.
- Visual Vhera Tag aplicado.

---

### Task 6.4 — Validar Alertas e Histórico

#### SDD

Especificar:

- Estado de alerta crítico.
- Estado de alerta resolvido.
- Histórico de operações.
- Filtros.
- Dead-letter.

#### TDD

Testes sugeridos:

```text
Dado que existem alertas pendentes
Quando a página Alertas renderiza
Então os alertas devem ser exibidos com severidade compreensível
```

```text
Dado que um alerta é resolvido
Quando a API confirma a resolução
Então a lista deve atualizar sem refresh manual
```

#### Validação

- Teste manual com alertas.
- Teste visual de severidade.
- Teste de responsividade.

#### Critérios de aceite

- Alertas não confundidos com cor de marca.
- Histórico legível.
- Ações preservadas.

---

### Task 6.5 — Validar Admin

#### SDD

Especificar:

- Dashboard administrativo.
- Gestão de usuários.
- Permissões.
- Reset de senha.
- Revogação de sessões.
- Estados de loading/erro/sucesso.

#### TDD

Testes sugeridos:

```text
Dado que um usuário administrador acessa AdminUsers
Quando a lista carrega
Então os usuários devem ser exibidos
```

```text
Dado que um usuário sem permissão tenta acessar rota admin
Quando a aplicação avalia o perfil
Então o acesso deve ser bloqueado
```

#### Validação

- Teste com perfil `usuario`.
- Teste com perfil `administrador`.
- Teste com perfil `desenvolvedor`.

#### Critérios de aceite

- RBAC visual preservado.
- Fluxos administrativos preservados.
- Nova identidade aplicada.

---

# Fase 7 — Testes Automatizados Frontend

## Objetivo

Adicionar cobertura mínima para garantir que o rebranding não quebre fluxos críticos.

## Arquivos prováveis

```text
src/components/__tests__/
src/pages/__tests__/
src/test/
vitest.config.ts
```

## Tasks com SDD e TDD

### Task 7.1 — Configurar base de testes frontend, se necessário

#### SDD

Especificar:

- Framework de teste.
- Ambiente DOM.
- Helpers de renderização.
- Mock de roteamento.
- Mock de autenticação.

#### TDD

A própria configuração será validada com teste mínimo:

```text
Dado que um componente simples é renderizado
Quando o teste roda
Então o ambiente DOM deve funcionar
```

#### Validação

```bash
npm run test:frontend
```

Caso o projeto prefira manter um script único:

```bash
npm test
```

#### Critérios de aceite

- Testes frontend executam.
- Ambiente DOM configurado.
- Primeiro teste passa.

---

### Task 7.2 — Testar renderização da marca

#### SDD

Especificar:

- Componentes que devem exibir Vhera Tag.
- Textos esperados.
- Alt text esperado.
- Ausência de referência pública à marca anterior.

#### TDD

Testes:

```text
Dado que BrandSignature renderiza
Então deve exibir Vhera Tag
```

```text
Dado que Login renderiza
Então deve exibir Vhera Tag
```

```text
Dado que Sidebar renderiza
Então deve exibir logo ou assinatura Vhera Tag
```

#### Validação

```bash
npm run test:frontend
```

#### Critérios de aceite

- Testes de marca passam.
- Componentes críticos cobertos.

---

### Task 7.3 — Testar fluxos visuais críticos

#### SDD

Especificar fluxos mínimos:

- Login.
- Sidebar por perfil.
- Dashboard com KPIs.
- Etiquetas com estados.
- Produtos com upload.
- Alertas com severidade.

#### TDD

Escrever testes antes da implementação final de ajustes, cobrindo comportamentos esperados.

#### Validação

```bash
npm run test:frontend
npm run test:bff
npm run build
```

#### Critérios de aceite

- Fluxos críticos cobertos.
- Build passa.
- Testes backend continuam passando.

---

# Fase 8 — Documentação e Pull Request

## Objetivo

Documentar a mudança e preparar uma PR revisável, com evidências e critérios claros.

## Arquivos prováveis

```text
docs/brand/vhera-tag-design-system.md
docs/brand/vhera-tag-roadmap.md
README.md
```

## Tasks com SDD e TDD

### Task 8.1 — Criar guia de identidade Vhera Tag

#### SDD

Documentar:

- Visão geral.
- Paleta.
- Logo.
- Favicon.
- Tipografia sugerida.
- Componentes impactados.
- Critérios de contraste.
- Boas práticas.
- Restrições.
- Roadmap futuro.

#### TDD

Não se aplica teste automatizado direto.

#### Validação

- Revisão manual.
- Conferir links e caminhos de assets.
- Conferir se documentação não inventa arquivos inexistentes.

#### Critérios de aceite

- Guia criado.
- Caminhos reais.
- Orientações claras para futuras telas.

---

### Task 8.2 — Preparar Pull Request

#### SDD

A PR deve conter:

- Resumo.
- Contexto.
- Motivação.
- Tipo de alteração.
- Modificações por arquivo/área.
- Commits explicados.
- Como testar.
- Evidências.
- Riscos.
- Rollback.
- Checklist.

#### TDD

Não se aplica teste automatizado direto, mas a PR deve incluir resultados de:

```bash
npm run lint
npm run build
npm run test:bff
npm run test:frontend
```

Quando algum comando não existir, documentar claramente.

#### Critérios de aceite

- PR clara.
- Evidências de validação.
- Riscos descritos.
- Rollback descrito.
- Checklist completo.

---

# 6. Checklist Geral de Aceite

## Marca

- [ ] Logo Vhera Tag adicionado.
- [ ] Favicon atualizado.
- [ ] Título da aplicação atualizado.
- [ ] BrandSignature atualizado.
- [ ] Não há inconsistência visual pública com a identidade anterior.

## Tema

- [ ] Tokens globais criados ou atualizados.
- [ ] Paleta aplicada de forma centralizada.
- [ ] Contraste validado.
- [ ] Estados hover/focus preservados.
- [ ] Cores operacionais preservadas.

## Layout

- [ ] Sidebar atualizada.
- [ ] Topbar atualizada.
- [ ] Login atualizado.
- [ ] Responsividade preservada.
- [ ] Acessibilidade básica preservada.

## Fluxos

- [ ] Login funciona.
- [ ] Logout funciona.
- [ ] Rotas protegidas funcionam.
- [ ] Dashboard funciona.
- [ ] Etiquetas funcionam.
- [ ] Produtos funcionam.
- [ ] Alertas funcionam.
- [ ] Admin funciona conforme perfil.

## Testes

- [ ] Testes de renderização da marca criados.
- [ ] Testes de login criados ou atualizados.
- [ ] Testes de sidebar/permissão criados ou atualizados.
- [ ] Testes de estados operacionais criados ou atualizados.
- [ ] Testes backend continuam passando.

## Validação

- [ ] `npm run format:check` executado.
- [ ] `npm run lint` executado.
- [ ] `npm run build` executado.
- [ ] `npm run test:bff` executado.
- [ ] Testes frontend executados, se configurados.
- [ ] Validação manual desktop executada.
- [ ] Validação manual mobile executada.
- [ ] Console do navegador sem erro crítico.

## Documentação

- [ ] Guia visual criado.
- [ ] Roadmap documentado.
- [ ] README atualizado se necessário.
- [ ] PR documenta riscos e rollback.

---

# 7. Critérios de Pronto

A entrega estará pronta quando:

1. A identidade Vhera Tag estiver aplicada nas áreas públicas e autenticadas do frontend.
2. A troca visual estiver centralizada em tokens e componentes reutilizáveis.
3. Os fluxos existentes continuarem funcionando.
4. As cores de status operacional continuarem claras.
5. A aplicação compilar sem erro.
6. Os testes backend continuarem passando.
7. Os testes frontend mínimos estiverem implementados ou a ausência deles estiver justificada.
8. A documentação estiver atualizada.
9. A PR contiver evidências de validação e rollback.

---

# 8. Riscos e Mitigações

## Risco 1 — Asset original em baixa resolução

A imagem enviada pode não ser ideal para uso em telas retina, favicon ou sidebar compacta.

### Mitigação

- Criar versão SVG ou PNG otimizada.
- Manter asset original como referência.
- Usar variações por tamanho.

## Risco 2 — Amarelo da marca confundido com alerta

Como amarelo costuma representar warning, pode haver confusão com alertas operacionais.

### Mitigação

- Diferenciar warning por ícone, texto e tom.
- Não depender apenas de cor.
- Documentar semântica de status.

## Risco 3 — Rebranding incompleto

Partes da aplicação podem continuar com identidade anterior.

### Mitigação

- Buscar referências à marca anterior.
- Criar checklist de telas.
- Validar visualmente todos os fluxos.

## Risco 4 — Quebra de contraste

Algumas combinações podem ficar pouco legíveis.

### Mitigação

- Validar contraste manualmente.
- Priorizar preto sobre amarelo e branco sobre cinza escuro.
- Manter foco de teclado visível.

## Risco 5 — Testes frontend inexistentes

O projeto pode não possuir infraestrutura completa de testes frontend.

### Mitigação

- Adicionar configuração mínima com Vitest e Testing Library, se aprovado.
- Criar testes incrementais.
- Documentar validação manual quando necessário.

---

# 9. Sequência Recomendada de Execução

```text
1. Criar branch feature/integra-identidade-vhera-tag
2. Criar documentação base SDD da marca
3. Adicionar assets
4. Atualizar favicon e título
5. Atualizar tokens globais
6. Criar/ajustar testes de BrandSignature
7. Atualizar BrandSignature
8. Criar/ajustar testes de Sidebar e Topbar
9. Atualizar Sidebar e Topbar
10. Criar/ajustar testes da tela de Login
11. Atualizar Login
12. Atualizar componentes operacionais
13. Validar páginas principais
14. Adicionar testes frontend mínimos
15. Rodar lint, build e testes
16. Atualizar documentação
17. Abrir PR detalhada
```

---

# 10. Comandos de Validação

```bash
npm install
npm run format:check
npm run lint
npm run build
npm run test:bff
```

Caso seja criado script de testes frontend:

```bash
npm run test:frontend
```

Caso seja adotado script único:

```bash
npm test
```

---

# 11. Modelo de PR

```markdown
# Resumo

Integra a identidade visual Vhera Tag ao frontend, atualizando assets, favicon, título público, tokens visuais, componentes globais, tela de login, componentes operacionais e documentação de marca.

## Tipo de alteração

- [x] Nova funcionalidade
- [x] Ajuste visual
- [x] Documentação
- [x] Testes

## Contexto

O projeto passa a adotar a identidade Vhera Tag, com paleta amarelo/preto/cinza e linguagem visual operacional voltada a etiquetas digitais, logística e controle de ativos.

## Motivação

Garantir consistência visual da aplicação com a nova marca, melhorando reconhecimento, presença visual e clareza da experiência.

## O que foi alterado

- Adicionados assets da marca Vhera Tag.
- Atualizado favicon e título da aplicação.
- Criados/ajustados tokens visuais.
- Atualizados componentes globais de marca.
- Atualizada tela de login.
- Ajustados componentes operacionais.
- Criados/atualizados testes frontend.
- Atualizada documentação da identidade.

## Como testar

1. Executar `npm install`.
2. Executar `npm run format:check`.
3. Executar `npm run lint`.
4. Executar `npm run build`.
5. Executar `npm run test:bff`.
6. Executar testes frontend, se disponíveis.
7. Rodar `npm run dev`.
8. Validar `/login`, Dashboard, Etiquetas, Produtos, Alertas, Histórico e Admin.

## Evidências de validação

- Build:
- Lint:
- Testes BFF:
- Testes frontend:
- Teste manual desktop:
- Teste manual mobile:

## Riscos

- Necessidade futura de versão SVG oficial.
- Possível confusão entre amarelo de marca e warning operacional.
- Necessidade de ampliar testes visuais.

## Rollback

Reverter a PR para retornar à identidade anterior.

## Checklist

- [ ] Código segue o padrão do projeto.
- [ ] Tokens visuais centralizados.
- [ ] Componentes críticos atualizados.
- [ ] Testes executados.
- [ ] Documentação atualizada.
- [ ] Não há secrets expostos.
- [ ] Não há logs sensíveis.
- [ ] Responsividade validada.
- [ ] Contraste básico validado.
```
