# Configuracao da Base Station WiFi

Tradução para portugues do arquivo original `Base Station WIFI Configuration.pdf`, localizado na raiz do projeto.

## Passo a passo de configuracao

1. Ligue a base station na energia e aguarde cerca de 30 segundos para ela iniciar.
2. Procure a rede Wi-Fi emitida pela base station.
   O nome da rede sera `eslap-XXXX`, onde `XXXX` sao os ultimos quatro digitos do endereco MAC da base station.
3. Se o celular ou computador nao encontrar essa rede, desligue e ligue novamente o Wi-Fi do dispositivo.
4. Conecte-se a essa rede Wi-Fi usando a senha:

```text
12345678
```

5. No navegador do celular ou computador, abra o endereco:

```text
http://192.168.66.1
```

6. Na tela de login, entre com:

```text
usuario: root
senha: 123456
```

7. Apos entrar no painel, clique em `wifi`.
8. No primeiro campo de selecao, escolha a opcao `Bridge`.
9. Selecione o nome da rede Wi-Fi local que a base station deve usar.
10. Digite a senha dessa rede Wi-Fi local.
11. Se quiser conferir a senha digitada, clique no botao que exibe a senha.
12. Nao altere as configuracoes de Wi-Fi e senha que sao transmitidas pela propria base station.
13. Para concluir, clique em `save&apply`.

## Traducao integral do manual

### Titulo

Configuracao da Base Station

### Pagina 1

1. Apos 30 segundos de ligar a base station, ela iniciara e passara a emitir um sinal Wi-Fi. O nome da rede Wi-Fi e `eslap -` seguido dos ultimos quatro digitos do endereco MAC da base station. (Se o celular/computador nao detectar o sinal enviado pela base station, desligue a funcao Wi-Fi e ligue-a novamente.) Conforme mostrado na figura a seguir:

2. Conecte-se ao Wi-Fi da base station com o celular ou computador. A senha do Wi-Fi e:

```text
12345678
```

Abra o navegador no celular/computador e acesse:

```text
http://192.168.66.1
```

(Recomenda-se copiar o endereco.) Em seguida, va para a pagina de login. O nome de usuario e `root` e a senha e `123456`. Ao entrar nessa pagina, clique em `wifi`.

### Pagina 2

3. Clique na primeira caixa de selecao e escolha `Bridge`.

Textos exibidos na ilustracao desta pagina:

- Escolha o nome da sua rede Wi-Fi.
- Digite a senha da rede Wi-Fi escolhida.
- Clique neste botao para exibir a senha.
- Estas sao as configuracoes de Wi-Fi e senha transmitidas pela base station; nao as altere.

### Pagina 3

4. Por fim, clique em `save&apply`.

## Observacao

O manual original e curto e depende de capturas de tela para ilustrar a interface. Esta traducao preserva todo o texto extraivel do PDF e organiza em Markdown as instrucoes apresentadas nas 3 paginas.
