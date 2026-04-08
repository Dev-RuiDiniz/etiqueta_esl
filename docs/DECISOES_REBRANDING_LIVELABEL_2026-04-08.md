# Decisões: Rebranding LiveLabel

## 1. Objetivo

Aplicar a marca `LiveLabel` em toda a experiência pública do produto, preservando a estrutura técnica do repositório e a segurança operacional da integração ESL já existente.

## 2. Decisões principais

- O nome público do produto passa a ser `LiveLabel`.
- A assinatura oficial adotada na UI e na documentação funcional é `Etiquetas Digitais Sustentáveis`.
- O nome técnico do repositório permanece `etiqueta_esl` para evitar impacto desnecessário em automações, scripts, imports e histórico Git.
- O frontend inteiro adota a direção visual `light + dark shell` descrita no design system versionado no repositório.

## 3. Assets oficializados

- Logo principal versionado em `src/assets/brand/livelabel-logo.jpg`
- Favicon derivado em `public/livelabel-logo.jpg`
- Guia de marca e interface em `docs/brand/livelabel-design-system.md`

## 4. Convenções visuais adotadas

- Shell lateral escuro com identidade forte de marca
- Superfícies principais claras para leitura operacional
- Verde usado para ação principal, sucesso e associação com sustentabilidade
- Azul usado para informação, conectividade, monitoramento e dados
- `Plus Jakarta Sans` como tipografia-base da aplicação
- `JetBrains Mono` reservado para IDs, códigos, métricas e elementos técnicos

## 5. Escopo aplicado no frontend

- Login
- Sidebar e topbar
- Dashboard operacional
- Rede de etiquetas e stations
- Catálogo de produtos
- Atualizações individuais e em lote
- Alertas
- Histórico
- Cockpit administrativo
- Gestão de usuários
- Componentes compartilhados como cards, tabelas, alertas, estados vazios e loaders

## 6. Convenções de nomenclatura

- Textos institucionais e de produto foram atualizados para `LiveLabel`.
- O termo `cockpit` passa a identificar a área administrativa principal.
- Em telas operacionais, `EtiquetaID` foi normalizado para `Ativo ID` quando a intenção era identificar o ativo digital na interface.
- Termos técnicos de integração com o vendor, rotas `/api/esl/*` e documentação de API foram mantidos quando fazem parte do contrato real do sistema.

## 7. Itens preservados por segurança técnica

- Nome da pasta do projeto
- Contratos de backend e rotas ESL existentes
- Referências documentais ao vendor GreenDisplay e à API ESL
- Estrutura de persistência local e nomenclatura técnica de variáveis de ambiente

## 8. Fora do escopo desta etapa

- Vetorização ou redesenho do logo
- Renomeação estrutural do repositório
- Reescrita dos documentos técnicos de integração com o vendor
- Mudança de contratos HTTP ou payloads apenas por motivo de branding
