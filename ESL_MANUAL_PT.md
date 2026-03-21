# Manual do Usuario do ESL

Traducao para portugues do arquivo original `ESL manual.pdf`, localizado na raiz do projeto.

## Catalogo

1. Login
2. Configuracao de idioma
3. Guia da pagina inicial
4. Verificar o status do AP
5. Exibir as informacoes basicas do ESL
6. Criar o template do ESL
7. Criar informacoes do produto
8. Vincular as informacoes do produto ao ESL
9. Atualizar o ESL
10. Configuracoes de luz
11. Obter a API do sistema
12. Plataforma de monitoramento em tempo real do ESL
13. Redefinir a senha
14. Configuracoes de PSM
15. Exibir mais campos
16. Configuracoes de blacklist e whitelist
17. Alterar o grupo de broadcast

## 1. Login

### 1.1

Abra o navegador e digite o endereco IP:

```text
http://esl.greendisplay.cn/
```

Esse e o mesmo endereco IP usado pelas filiais e pela matriz, mudando apenas o nome de usuario e a senha.

### 1.2

Digite o nome de usuario e a senha correspondentes para entrar na sua loja. O acesso de superadministrador sera fornecido apos a implantacao do sistema de software. Depois disso, sera possivel criar contas para as filiais com o nivel mais alto de permissao.

## 2. Configuracao de idioma

### 2.1

Depois de entrar no sistema, escolha o idioma desejado no canto superior direito.

## 3. Guia da pagina inicial

- A: Area de selecao rapida. Permite entrar rapidamente nas interfaces de operacao de etiqueta eletrônica, AP, template e produto, alem de idioma do sistema, configuracoes da loja, atualizacao etc.
- B: Area de navegacao. Area de selecao das funcoes do sistema, como pagina inicial, template, imagem, configuracoes do produto etc.
- C: Area de operacao. Exibe cada funcao e permite executar as acoes correspondentes.

## 4. Verificar o status do AP

### 4.1

Clique em `Navigation` -> `AP`.

### 4.2

Ao entrar em `AP list`, voce pode verificar o estado de execucao e as configuracoes do AP.

## 5. Exibir as informacoes basicas do ESL

### 5.1

Clique em `Navigation` -> `SDR`.

### 5.2

Em `SDR list`, voce pode verificar o estado de execucao e as configuracoes do ESL, como o codigo da etiqueta, o codigo de barras do produto vinculado, a carga restante da bateria e o estado da etiqueta.

## 6. Criar o template do ESL

### 6.1 Enviar imagens para a loja e processa-las

Depois que as imagens forem enviadas para a loja e processadas, elas poderao ser usadas diretamente na edicao do template.

#### 6.1.1 Enviar imagem

Envie a imagem que sera usada no template.

#### 6.1.2 Processar imagem (nao obrigatorio)

Em alguns casos, e melhor usar a imagem sem processamento.

### 6.2

Antes de criar um template do ESL, e necessario confirmar as especificacoes do produto. Por exemplo: uma etiqueta de 4,2 polegadas nas cores preto, branco e vermelho. `ESL-XXBW` corresponde a templates para etiquetas preto e branco. `ESL-XXR` corresponde a templates para etiquetas preto, branco e vermelho.

### 6.3

Na pagina inicial, escolha `Templates` em `Navigation`.

### 6.4

Clique em `New`, no canto superior direito, para entrar na interface de criacao de template. Depois de informar o nome do template personalizado, selecione em `Type Code` o template de tamanho correspondente, por exemplo `ESL-42R`. Em `Direction`, defina a orientacao do template, horizontal ou vertical. Em seguida, selecione o tipo apropriado de etiqueta de preco em `Scene Type`.

Nota: quando voce escolhe um `Scene Type` relacionado ao estado do produto, o template do ESL pode ser trocado automaticamente para outro consistente com o status do item.

### 6.5

Depois de clicar em `Submit`, voce retornara a pagina anterior, onde o template recem-criado sera exibido. Clique no terceiro botao, `Design`, a direita, para entrar na pagina de edicao.

### 6.6

Na pagina de edicao existem tres areas principais: area de operacao da imagem, area de selecao de elementos e area de atributos dos elementos. Tambem e possivel copiar um template existente para criar rapidamente outro igual, selecionando `Copy` em `Action`, dentro de `Templates List`.

### 6.7 Ajustar templates para se adaptarem a mudancas no produto

Por exemplo: se as etiquetas A ou B usarem esse template e forem vinculadas ao produto `a` ou `b`, como fazer para que o nome e as especificacoes mudem automaticamente?

#### 6.7.1

Insira um marcador com `#` em um elemento de texto ou caixa de texto para transforma-lo em um campo adaptativo, que mudara conforme as informacoes do produto. Por exemplo, `#pn` e o campo adaptativo do nome do produto, correspondendo ao nome do atributo definido no cadastro do produto.

#### 6.7.2

Ao criar um template, voce pode selecionar os elementos correspondentes na area de selecao, como texto, codigo de barras e QR code, e editar os atributos desses elementos, como tamanho, posicao e cor, na area de atributos.

## 7. Criar informacoes do produto

### 7.1 Conectar ao ERP (ou estoque)

Quando o sistema ESL precisa se conectar ao ERP, ele pode sincronizar as informacoes de produtos existentes no ERP, incluindo os campos que devem ser exibidos na etiqueta.

### 7.2 Sem conexao com o ERP

Use o proprio sistema de software ESL para criar informacoes dos produtos diretamente, por exemplo, para testes.

Existem duas formas de criar as informacoes dos produtos:

#### 7.2.1 Importando arquivos

##### 7.2.1.1

Selecione `Navigation` -> `Product` na barra de navegacao e clique em `Export`, a direita, para exportar a planilha Excel. Preencha os atributos do produto de acordo com o formato da planilha exportada e salve o arquivo.

##### 7.2.1.2

Depois de preencher as informacoes dos produtos, escolha o arquivo Excel correto clicando em `Upload`, a esquerda. Depois disso, a importacao sera concluida com sucesso.

#### 7.2.2 Adicionar informacoes do produto manualmente no sistema

##### 7.2.2.1

Clique em `New` na lista de produtos para entrar na pagina de criacao de produto.

##### 7.2.2.2

Depois de preencher os atributos correspondentes do produto, envie o formulario para criar o cadastro. Observe que os campos marcados com `*` sao obrigatorios.

## 8. Vincular as informacoes do produto ao ESL

Voce pode consultar `<The guidance of the ESL’s installation>` para entender como o PDA se relaciona com as informacoes de produto no sistema ESL e como o backoffice exibe essas informacoes.

### 8.1 Vincular as informacoes do produto no backoffice do ESL

#### 8.1.1

Clique em `SDR`, dentro de `Navigation`, para entrar na pagina da lista de ESL e clique no botao `Bind`, em `Action`, para vincular a etiqueta correspondente.

#### 8.1.2

Digite o codigo de barras correspondente ao produto. Voce pode copiar o codigo de barras da lista de produtos e colar aqui diretamente. Em seguida, escolha o template correspondente em `Template` e clique em `Submit`.

#### 8.1.3

Atualize a lista de ESL clicando em `Trigger`.

Nota: o valor exibido ao lado de `Trigger` indica a quantidade de etiquetas aguardando disparo.

## 9. Atualizar o ESL

### 9.1 Disparar atualizacao apos alterar as informacoes do produto

Voce pode disparar de uma vez as informacoes atualizadas monitorando os produtos alterados, tanto quando a mudanca for feita na lista de produtos do backoffice ESL quanto quando vier do ERP.

#### 9.1.1

Exemplo: alterar o preco de dois produtos, mudando de `$10` para `$9.50` e de `$8.50` para `$8`.

#### 9.1.2

O preco revisado e exibido abaixo.

#### 9.1.3

Voce podera ver que existem duas etiquetas em espera na coluna `Trigger`, e o estado das duas etiquetas correspondentes tambem sera exibido como `Waiting` ao alternar para `SDR List`.

### 9.2 Disparar o ESL apos modificar a propria etiqueta

Dispare a atualizacao do ESL apos vincular ou desvincular um template da etiqueta, ou mesmo depois de modificar o conteudo do template na `ESL list`.

## 10. Configuracoes de luz

O ESL correspondente acendera de acordo com a situacao predefinida ao executar a funcao de busca, desde que as condicoes correspondentes tenham sido configuradas.

### 10.1

Clique em `LED`, dentro de `Assistant`, na barra de navegacao, para entrar na pagina da lista de LEDs.

### 10.2

Clique em `New` para criar uma nova configuracao de piscada. O nome pode ser definido conforme necessario, por exemplo, para configurar a piscada da funcao de busca. O ESL correspondente piscara quando o status do produto for definido como mercadoria VIP em `Scene`. Depois de localizar a configuracao de piscada, voce precisara executar a acao de piscada na `ESL list`.

## 11. Obter a API do sistema

A principal funcao da API e conectar sistemas de terceiros, como sistema de faturamento, sistema de armazenagem, ERP e sistema de gestao hospitalar.

### 11.1

Clique em `API` no menu `Navigation` para entrar na pagina da interface da API.

### 11.2

Ao entrar na interface da API, voce podera ver diversos parametros e os codigos correspondentes.

## 12. Plataforma de monitoramento em tempo real do ESL

### 12.1

Clique em `Monitor` para entrar na plataforma de monitoramento em tempo real.

## 13. Redefinir a senha

### 13.1

Clique no icone do usuario no canto superior direito e depois no botao `Settings` para entrar na pagina de configuracoes do usuario.

### 13.2

Defina uma nova senha na pagina de configuracoes do usuario e clique em `Submit`.

## 14. Configuracoes de PSM

A principal funcao da configuracao de PSM e monitorar a velocidade de atualizacao do ESL no AP.

Quando configurado no modo `rocket`, a atualizacao da etiqueta de preco sera a mais rapida.

Quando configurado no modo `snail`, a atualizacao sera a mais lenta.

Quanto maior a taxa de atualizacao, maior sera o consumo de bateria do dispositivo ESL.

Os passos sao os seguintes:

### 14.1

Clique em `Store` na barra de navegacao para entrar na interface de configuracoes da loja.

### 14.2

Selecione `SDR` no lado esquerdo. Em `PSM Data`, escolha um modo de PSM. A recomendacao do manual e usar o padrao `Normal Speed`.

### 14.3

Configure a entrada automatica do ESL em hibernacao e o tempo para isso. Clique em `Auto Sleep` para ativar a funcao e depois defina o tempo em `To Sleep Mode after hours`.

Nota: ao definir o tempo para a entrada automatica em hibernacao, o ESL passara para esse estado apos o numero de horas configurado sem receber atualizacoes, o que reduz o consumo de energia. No entanto, a primeira atualizacao apos a entrada em hibernacao pode demorar mais, porque o dispositivo precisa ser despertado antes.

## 15. Exibir mais campos

### 15.1

Voce pode personalizar as configuracoes caso precise mostrar mais campos na lista de `SDR`.

### 15.2

Clique em `Store`, no canto superior direito, para entrar em `SDR` dentro de `Store Setting`, e selecione em `SDRGrid Contents` os campos de produto que deseja exibir na lista de SDR.

## 16. Configuracoes de blacklist e whitelist

### Explicacao da blacklist

Quando a loja e configurada como blacklist, o AP deixa de escanear por padrao as etiquetas eletronicas adicionadas a essa lista. Isso significa que o backoffice do sistema nao conseguira ver os relatórios enviados por essas etiquetas. Depois que a etiqueta e removida da blacklist, ela volta a ser escaneada e reportada pelo AP.

### Explicacao da whitelist

Quando a loja e configurada como whitelist, o AP so pode escanear as etiquetas adicionadas a essa lista. As etiquetas que nao estiverem nela nao serao escaneadas, e por isso o backoffice do sistema nao conseguira ver os seus relatórios.

### Metodo de configuracao

Primeiro clique em `Store` no menu de atalho. Em seguida, entre em `SDR` dentro de `Store Setting`, selecione a opcao desejada em `Filter` e configure a black/white list da loja.

### 16.1 Adicionar ESL a blacklist ou whitelist

Clique em `Batch Add` -> `Filter` -> `Device` na barra de navegacao para entrar na pagina de adicao em lote de etiquetas eletronicas.

### 16.2

Escaneie o codigo referente ao numero da etiqueta ou digite esse numero manualmente e clique em `Submit` para concluir.

Nota: o numero da etiqueta e o codigo de barras na parte frontal do ESL.

### 16.3 Visualizar a whitelist

Clique em `Filter`, dentro de `Device`, na barra de navegacao. Se for necessario excluir uma etiqueta, clique no botao `Delete` em `Action`, na lista.

## Fim do manual

Este e o fim deste manual de instrucoes. Obrigado pela leitura.

## 17. Alterar o grupo de broadcast

O PDF original mostra o titulo desta secao e, nas paginas seguintes, principalmente capturas de tela. Nao ha texto adicional extraivel suficiente nessas paginas para uma traducao textual mais detalhada sem inventar conteudo.

## Observacao

Esta traducao preserva a estrutura e o texto extraivel do PDF original. Em alguns trechos, o manual depende de imagens da interface para complementar a instrucao.
