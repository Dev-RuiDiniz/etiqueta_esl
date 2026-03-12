# Referência da API ESL (PT-BR)

Documento gerado a partir do PDF `API Reference_20231118.pdf` (60 páginas), convertido para Markdown e comentado em português para apoiar a integração do sistema.

## 1) Visão geral de integração

- Base URL: substituir `https://localhost` pelo domínio real da sua instância ESL.
- Identificador do cliente: substituir `{i_client_id}` no path pelo app-key/client-id da filial (ex.: `default`).
- Assinatura: enviar `sign` em todas as chamadas conforme o valor configurado na filial (o PDF não detalha algoritmo, apenas uso do valor da app-key).
- Conteúdo: usar `Content-Type: application/json` e `Accept: application/json`.
- Codificação: `is_base64` é opcional e, quando omitido, normalmente é `0` segundo o PDF.

## 2) Campos comuns (resumo do PDF)

| Campo | Significado |
|---|---|
| `product` | Conjunto de campos de produto (`pc`, `pn`, `pp`, `qty`, `extend` etc.) |
| `pc` | Código do produto |
| `pn` | Nome do produto |
| `pp` | Preço do produto |
| `qty` | Quantidade/estoque |
| `extend` | Campos estendidos/customizados |
| `led` | Configuração de LED: `{r,g,b,time_on,time}` |
| `r/g/b` | Intensidade 0 a 100 |
| `time_on` | Duração de cada flash (ms) |
| `time` | Tempo total de flashing (min) |

## 3) Fluxo recomendado para integração

1. Criar loja (`store/create`) caso ainda não exista.
2. Cadastrar produtos (`product/create` ou `product/create_multiple`).
3. Consultar templates disponíveis (`template/query`) e mapear por tipo de etiqueta.
4. Vincular produto x ESL (`esl/bind` ou `esl/bind_multiple`).
5. Disparar refresh de fila (`esl/bind_task`) quando necessário.
6. Para atualização imediata em massa, usar `esl/direct` ou `nfc/direct`.
7. Monitorar estado com `esl/query`, `esl/query_status`, `product/query` e endpoints de contagem.

## 4) Catálogo completo de endpoints

| Grupo | Seção | Endpoint (PT) | Método e rota |
|---|---|---|---|
| ENV | `2.1` | Consultar informações do ambiente | `GET api/query/env` |
| ESL | `3.1` | Vincular um produto a uma ESL | `POST api/{i_client_id}/esl/bind` |
| ESL | `3.2` | Vincular múltiplos produtos e ESLs | `POST api/{i_client_id}/esl/bind_multiple` |
| ESL | `3.3` | Desvincular uma ESL | `POST api/{i_client_id}/esl/unbind` |
| ESL | `3.4` | Localizar ESL com flash de LED | `POST api/{i_client_id}/esl/search` |
| ESL | `3.5` | Sincronizar status de ESL | `POST api/{i_client_id}/esl/sync` |
| ESL | `3.6` | Atualização direta em massa de ESL (produto + template + LED) | `POST api/{i_client_id}/esl/direct` |
| ESL | `3.7` | Disparar fila de refresh de vínculo | `POST api/{i_client_id}/esl/bind_task` |
| ESL | `3.8` | Consultar ESLs | `GET api/{i_client_id}/esl/query` |
| ESL | `3.9` | Contar ESLs | `GET api/{i_client_id}/esl/query_count` |
| ESL | `3.10` | Consultar status de ESLs específicas | `POST api/{i_client_id}/esl/query_status` |
| NFC | `4.1` | Consultar NFCs | `GET api/{i_client_id}/nfc/query` |
| NFC | `4.2` | Contar NFCs | `GET api/{i_client_id}/nfc/query_count` |
| NFC | `4.3` | Atualização direta em massa de NFC | `POST api/{i_client_id}/nfc/direct` |
| OFFICE | `5.1` | Criar visitante (Office) | `POST api/{i_client_id}/of/create_visitor` |
| OFFICE | `5.2` | Excluir visitante (Office) | `POST api/{i_client_id}/of/del_visitor` |
| OFFICE | `5.3` | Criar usuário (Office) | `POST api/{i_client_id}/of/create_user` |
| OFFICE | `5.4` | Excluir usuário (Office) | `POST api/{i_client_id}/of/del_user` |
| PRODUCT | `6.1` | Criar/atualizar um produto | `POST api/{i_client_id}/product/create` |
| PRODUCT | `6.2` | Criar múltiplos produtos | `POST api/{i_client_id}/product/create_multiple` |
| PRODUCT | `6.3` | Criar múltiplos produtos com AP definido | `POST api/{i_client_id}/product/create_multiple_with_ap` |
| PRODUCT | `6.4` | Excluir múltiplos produtos | `POST api/{i_client_id}/product/del_multiple` |
| PRODUCT | `6.5` | Contar produtos | `GET api/{i_client_id}/product/query_count` |
| PRODUCT | `6.6` | Consultar produtos | `GET api/{i_client_id}/product/query` |
| STORE | `7.1` | Criar loja | `POST api/{i_client_id}/store/create` |
| TEMPLATE | `8.1` | Consultar templates da loja | `GET api/{i_client_id}/template/query` |

## 5) Referência de uso por endpoint

### Grupo ENV

#### 2.1 - Consultar informações do ambiente

- Título original no PDF: `Query the Env's Information`
- Método/rota: `GET api/query/env`
- Tipo de parâmetros: `N/D`
- Parâmetros listados no PDF: não identificado automaticamente (ver transcrição integral abaixo).
- Comentário de integração: Endpoint utilitário de ambiente.

### Grupo ESL

#### 3.1 - Vincular um produto a uma ESL

- Título original no PDF: `Bind a product and a esl`
- Método/rota: `POST api/{i_client_id}/esl/bind`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 string required esl's code`
  - `f2 string required produdct's code`
  - `f3 string optional template id`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.2 - Vincular múltiplos produtos e ESLs

- Título original no PDF: `Bind many products and esls`
- Método/rota: `POST api/{i_client_id}/esl/bind_multiple`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 array required product's info`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.3 - Desvincular uma ESL

- Título original no PDF: `Unbind a esl`
- Método/rota: `POST api/{i_client_id}/esl/unbind`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 string required esl's code`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.4 - Localizar ESL com flash de LED

- Título original no PDF: `Searh esl with flash light`
- Método/rota: `POST api/{i_client_id}/esl/search`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 string required esl's codes array`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.5 - Sincronizar status de ESL

- Título original no PDF: `Sync esl status`
- Método/rota: `POST api/{i_client_id}/esl/sync`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.6 - Atualização direta em massa de ESL (produto + template + LED)

- Título original no PDF: `refresh and splash many esls with product info and template`
- Método/rota: `POST api/{i_client_id}/esl/direct`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 array required products array`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.7 - Disparar fila de refresh de vínculo

- Título original no PDF: `Trigger the Esl Refresh`
- Método/rota: `POST api/{i_client_id}/esl/bind_task`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.8 - Consultar ESLs

- Título original no PDF: `Query the Esl's Information`
- Método/rota: `GET api/{i_client_id}/esl/query`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `f1 optional which page`
  - `f2 optional size in one page`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.9 - Contar ESLs

- Título original no PDF: `Query esl count`
- Método/rota: `GET api/{i_client_id}/esl/query_count`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

#### 3.10 - Consultar status de ESLs específicas

- Título original no PDF: `Query some Esl's Information`
- Método/rota: `POST api/{i_client_id}/esl/query_status`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 string optional which page`
  - `f2 string optional size in one page`
  - `f3 array required esl_codes`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Usar este grupo para ciclo de vida de etiquetas ESL (vínculo, disparo de atualização, consulta e status).

### Grupo NFC

#### 4.1 - Consultar NFCs

- Título original no PDF: `Query the NFC's Information`
- Método/rota: `GET api/{i_client_id}/nfc/query`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `f1 optional which page`
  - `f2 optional size in one page`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Mesma ideia do grupo ESL, mas voltado aos dispositivos NFC.

#### 4.2 - Contar NFCs

- Título original no PDF: `Query nfc count`
- Método/rota: `GET api/{i_client_id}/nfc/query_count`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Mesma ideia do grupo ESL, mas voltado aos dispositivos NFC.

#### 4.3 - Atualização direta em massa de NFC

- Título original no PDF: `refresh many nfcs with product info and template info`
- Método/rota: `POST api/{i_client_id}/nfc/direct`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 array required products array`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Mesma ideia do grupo ESL, mas voltado aos dispositivos NFC.

### Grupo OFFICE

#### 5.1 - Criar visitante (Office)

- Título original no PDF: `Create a visitor's information`
- Método/rota: `POST api/{i_client_id}/of/create_visitor`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `code string required visit code`
  - `name string required visitor's name`
  - `company string optional visitor's company`
  - `department string optional visitor's department`
  - `job string optional visitor's job`
  - `mobile string required visitor's mobile`
  - `email string optional visitor's email`
  - `card_no string optional visitor's card no`
  - `receptionist string optional receptionist's name`
  - `receptionist_mobile string optional receptionist's mobile`
  - `receptionist_department string optional receptionist's department`
  - `started_at string optional visitor's start time`
  - `ended_at string optional visitor's end time`
  - `content string optional visit matters`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Endpoints administrativos de Office/usuários; normalmente usados em provisionamento.

#### 5.2 - Excluir visitante (Office)

- Título original no PDF: `Delete a visitor's information`
- Método/rota: `POST api/{i_client_id}/of/del_visitor`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `code string required user code`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Endpoints administrativos de Office/usuários; normalmente usados em provisionamento.

#### 5.3 - Criar usuário (Office)

- Título original no PDF: `Create a user's information`
- Método/rota: `POST api/{i_client_id}/of/create_user`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `code string required user code`
  - `name string required user's name`
  - `company string optional user's company`
  - `department string optional user's department`
  - `job string optional user's job`
  - `mobile string required user's mobile`
  - `email string optional user's email`
  - `type string optional user's type`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Endpoints administrativos de Office/usuários; normalmente usados em provisionamento.

#### 5.4 - Excluir usuário (Office)

- Título original no PDF: `Delete a visitor's information`
- Método/rota: `POST api/{i_client_id}/of/del_user`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `code string required user code`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Endpoints administrativos de Office/usuários; normalmente usados em provisionamento.

### Grupo PRODUCT

#### 6.1 - Criar/atualizar um produto

- Título original no PDF: `Create a Product`
- Método/rota: `POST api/{i_client_id}/product/create`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string optional store's code`
  - `pi string optional product's inner_code`
  - `pc string required product's code`
  - `pn string required product's name`
  - `ps string optional product's spec`
  - `pg string optional product's grade`
  - `pu string optional product's unit`
  - `pp string required product's price`
  - `vp string optional product's vip price`
  - `pop string optional product's origin price`
  - `po string optional product's origin`
  - `pm string optional product's manufacturer`
  - `promotion string optional promotion scene`
  - `pim string optional product's image`
  - `pqr string optional product's qrcode`
  - `f1 string optional custom field 1`
  - `f2 string optional custom field 2`
  - `f3 string optional custom field 3`
  - `f4 string optional custom field 4`
  - `f5 string optional custom field 5`
  - `f6 string optional custom field 6`
  - `f7 string optional custom field 7`
  - `f8 string optional custom field 8`
  - `f9 string optional custom field 9`
  - `f10 string optional custom field 10`
  - `f11 string optional custom field 11`
  - `f12 string optional custom field 12`
  - `f13 string optional custom field 13`
  - `f14 string optional custom field 14`
  - `f15 string optional custom field 15`
  - `f16 string optional custom field 16`
  - `extend array optional extend field`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

#### 6.2 - Criar múltiplos produtos

- Título original no PDF: `Create many products`
- Método/rota: `POST api/{i_client_id}/product/create_multiple`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 array required products array`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

#### 6.3 - Criar múltiplos produtos com AP definido

- Título original no PDF: `Create many products with defined ap code`
- Método/rota: `POST api/{i_client_id}/product/create_multiple_with_ap`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `old_store_code string required store's code`
  - `new_store_code string required store's code`
  - `f1 array required products array`
  - `is_base64 string optional default is 0`
  - `f2 string required ap code`
  - `sign string required sign`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

#### 6.4 - Excluir múltiplos produtos

- Título original no PDF: `Delete product multiple`
- Método/rota: `POST api/{i_client_id}/product/del_multiple`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 array required products array`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

#### 6.5 - Contar produtos

- Título original no PDF: `Query product count`
- Método/rota: `GET api/{i_client_id}/product/query_count`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `is 0`
  - `sign requ`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

#### 6.6 - Consultar produtos

- Título original no PDF: `Query the Product's Information`
- Método/rota: `GET api/{i_client_id}/product/query`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `f1 optional which page`
  - `f2 optional size in one page`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Manter cadastro de produtos sincronizado antes de vincular às etiquetas.

### Grupo STORE

#### 7.1 - Criar loja

- Título original no PDF: `Create a Store`
- Método/rota: `POST api/{i_client_id}/store/create`
- Tipo de parâmetros: `Body`
- Parâmetros listados no PDF:
  - `store_code string required store's code`
  - `f1 string required store's name`
  - `f2 string optional store's address`
  - `is_base64 string optional default is 0`
  - `sign string required sign`
- Comentário de integração: Pré-requisito para organizar dados por loja (`store_code`).

### Grupo TEMPLATE

#### 8.1 - Consultar templates da loja

- Título original no PDF: `Query the Templates in store`
- Método/rota: `GET api/{i_client_id}/template/query`
- Tipo de parâmetros: `Query`
- Parâmetros listados no PDF:
  - `store_code required store's code`
  - `f1 optional which page`
  - `f2 optional size in one page`
  - `is_base64 optional default is 0`
  - `sign required sign`
- Comentário de integração: Consultar templates para aplicar layout correto por tipo de ESL.

## 6) Exemplos práticos (PT-BR)

### Exemplo A: criar produto e vincular a ESL

```bash
# 1) Criar/atualizar produto
curl -X POST "https://SEU_DOMINIO/api/default/product/create" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d "{\"store_code\":\"001\",\"pc\":\"789000000001\",\"pn\":\"Produto Exemplo\",\"pp\":\"19.90\",\"sign\":\"SUA_SIGN\"}"

# 2) Vincular produto à etiqueta
curl -X POST "https://SEU_DOMINIO/api/default/esl/bind" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d "{\"store_code\":\"001\",\"f1\":\"54300001\",\"f2\":\"789000000001\",\"f3\":\"3\",\"sign\":\"SUA_SIGN\"}"

# 3) Disparar refresh de vínculo
curl -X POST "https://SEU_DOMINIO/api/default/esl/bind_task" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d "{\"store_code\":\"001\",\"sign\":\"SUA_SIGN\"}"
```

### Exemplo B: consulta paginada de produtos

```bash
curl -G "https://SEU_DOMINIO/api/default/product/query" \\
  -H "Accept: application/json" \\
  --data-urlencode "store_code=001" \\
  --data-urlencode "f1=1" \\
  --data-urlencode "f2=50" \\
  --data-urlencode "sign=SUA_SIGN"
```

## 7) Transcrição integral do PDF (convertido para Markdown)

> Observação: esta seção preserva o conteúdo completo extraído do PDF com pequenas limpezas de cabeçalho/rodapé.

```text
Welcome  to  the  generated  API  reference.   Get  Postman  Collection

1 Field Explanation
Field Explanation
product Product field（eg:pp,pn,pp,qty,extend etc.）
pc Product code
pn Product name
pp Product price
qty Product quantity
extend Extension fields,
led Led field{r,g,b,time_on,time}
{r,g,b,time_on,time} {r(red：0~100),g(green：0~100),b(blue：0~100),
time_on（unit：ms，The continued flash time for a single flash）,
time（unit：minutes，The continued time of flashing）}
1.1 API example：

1.1.1 Download postman： Get Postman Collection, import the
collection file into the postman：

1.1.2 Replace the localhost with the host domain name, and
replace the request url’s default as your app-key’s name,
and the body’s sign parameter’s value as your app-key’s

value, and you can the app-key’s information at the
branch’s setting

2 ENV GROUP

2.1 Query the Env's Information

2.1.1 HTTPS Request

GET api/query/env

2.1.2 Example request:

const url = new URL("https://localhost/api/query/env"); let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {

method: "GET",
headers: headers,
})
.then(response => response.json())
.then(json => console.log(json));

2.1.3 Example response (200):

{
"name": "Laravel",
"env": "documentation", "version": "2.0.6",

"debug": false,
"url": "https:\/\/localhost", "timezone": "Asia\/Shanghai", "locale": "zh-CN",
"fallback_locale": "zh-CN", "cipher": "AES-256-CBC",
"log": "daily",
"log_level": "info", "log_max_files": 3
}

3 ESL GROUP

3.1 Bind a product and a esl

after doing it, the esl will be filled in refresh queue, you can use bind_task to
trigger it.

3.1.1 HTTPS Request

POST api/{i_client_id}/esl/bind

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 string required esl's code
f2 string required produdct's code
f3 string optional template id

Parameter Type Status Description
is_base64 string optional default is 0
sign string required sign

3.1.2 Example request:

const url = new URL("https://localhost/api/default/esl/bind");  let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "54300001",
"f2": "6943093201838",
"f3": "3",
"is_base64": "0",
"sign": "80805d794841f1b4"
}
fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.1.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}
3.2 Bind many products and esls

after doing it, the esl will be filled in refresh queue, you can use bind_task to
trigger it.

3.2.1 HTTPS Request

POST api/{i_client_id}/esl/bind_multiple

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 array required product's info
is_base64 string optional default is 0
sign string required sign

3.2.2 Example request:

const url = new URL("https://localhost/api/default/esl/bind_multiple");  let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",

"f1": "[{\"esl_code\":\"xxxxxxx\", \"product_code\":\"xxxxxxxx\", \
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})

then(response => response.json())
.then(json => console.log(json));

3.2.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

3.3 Unbind a esl
after doing it, the esl will fill in refresh queue, you can use the
bind_task to trigger it.

3.3.1 HTTPS Request

POST api/{i_client_id}/esl/unbind

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 string required esl's code
is_base64 string optional default is 0
sign string required sign

3.3.2   Example request:

const url = new URL("https://localhost/api/default/esl/unbind"); let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "54300001",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.3.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

3.4 Searh esl with flash light

you can use this api to make esl Led flashing.

3.4.1 HTTPS Request
POST api/{i_client_id}/esl/search

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 string required esl's codes array
is_base64 string optional default is 0
sign string required sign
3.4.2 Example request:

const url = new URL("https://localhost/api/default/esl/search"); let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "[54300001,54300002]",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {

method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.4.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}
3.5 Sync esl status

you can use this api to sync esl status.

3.5.1 HTTPS Request

POST api/{i_client_id}/esl/sync

Body Parameters

Parameter Type Status Description
store_code string required store's code
is_base64 string optional default is 0
sign string required sign

3.5.2 Example request:

const url = new URL("https://localhost/api/default/esl/sync"); let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.5.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

3.6 refresh and splash many esls with product info and template
info, led info

after doing it, the esls will be refresh and splash directly

3.6.1 HTTPS Request
POST api/{i_client_id}/esl/direct

Body Parameters

Parameter Type Status Description

store_code string required store's code
f1 array required products array
is_base64 string optional default is 0
sign string required sign

3.6.2 Example request:

const url = new URL("https://localhost/api/default/esl/direct"); let headers =
{
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "[{\"esl_code\":\"54200001\",\"template_id\":11,\"product\":{
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.6.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

3.7 Trigger the Esl Refresh

This is a trigger, after doing it, the esl will refresh when  the esl  is
in refresh queue.
3.7.1 HTTPS Request

POST api/{i_client_id}/esl/bind_task

Body Parameters
Parameter Type Status Description
store_code string required store's code
is_base64 string optional default is 0
sign string required sign

3.7.2 Example request:

const url = new URL("https://localhost/api/default/esl/bind_task"); let headers
= {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.7.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

3.8 Query the Esl's Information

3.8.1 HTTPS Request

GET api/{i_client_id}/esl/query

Query Parameters

Parameter Status Description
store_code required store's code
f1 optional which page
f2 optional size in one page
is_base64 optional default is 0
sign required sign

3.8.2 Example request:

const url = new URL("https://localhost/api/default/esl/query"); let params =
{
"store_code": "001",
"f1": "1",
"f2": "10",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {
method: "GET",
headers: headers,
})

then(response => response.json())
.then(json => console.log(json));

3.8.3 Example response (200):

[
{
"esl_code": "a4502393",
"esl_version": "2001\/2306\/0101", "action":  0,
"online":  0,
"esl_battery":  3032,
"product_code": "666666",
"created_at": "2023-02-27 11:28:42",
"updated_at":  "2023-02-28 16:23:41",
"ap_code": "40:d6:3c:2d:22:07", "esltype_code": "ESL-29R"
},
{
"esl_code": "c4300017",
"esl_version": "2003\/2400\/0101", "action":  0,
"online":  0,
"esl_battery":  3114,
"product_code": "6930982668223",
"created_at": "2023-02-27 11:27:52",
"updated_at":  "2023-02-28 16:21:29",
"ap_code": "40:d6:3c:2d:22:07", "esltype_code": "ESL-21R"
}
]

3.9 Query esl count

Query esl count

3.9.1 HTTPS Request

GET api/{i_client_id}/esl/query_count

Query Parameters

Parameter Status Description
store_code required store's code
is_base64 optional default is 0

sign required sign

3.9.2 Example request:

const url = new URL("https://localhost/api/default/esl/query_count"); let
params = {
"store_code": "001",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {

method: "GET",
headers: headers,

})

.then(response => response.json())
.then(json => console.log(json));

3.9.3 Example response (200):

{
"online_count":  0,
"offline_count":   2
}

3.10 Query some Esl's Information

3.10.1 HTTPS Request

POST api/{i_client_id}/esl/query_status

Body Parameters

Parameter Type Status Description
store_code required optional store's code
f1 which optional page
f2 size optional in one page
f3 array required esl_codes
is_base64 default optional is 0
sign required optional sign

3.10.2 Example request:

const url = new URL("https://localhost/api/default/esl/query_status" );

let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "1",
"f2": "10",
"f3": "[\"54200001\", \"54200002\"]",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

3.10.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

4 NFC GROUP

4.1 Query the NFC's Information

4.1.1 HTTPS Request

GET api/{i_client_id}/nfc/query

Query Parameters

Parameter Status Description
store_code required store's code
f1 optional which page
f2 optional size in one page
is_base64 optional default is 0
sign required sign

4.1.2 Example request:

const url = new URL("https://localhost/api/default/nfc/query"); let params =
{
"store_code": "001",
"f1": "1",
"f2": "10",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",

4.1.3 Example response (200):

[]

4.2 Query nfc count

Query nfc count

4.2.1 HTTPS Request

GET api/{i_client_id}/nfc/query_count

Query Parameters

Parameter Status Description
store_code required store's code
is_base64 optional default is 0
sign required sign

4.2.2 Example request:

const url = new URL("https://localhost/api/default/nfc/query_count"); let
params = {
"store_code": "001",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {
method: "GET",
headers: headers,
})
.then(response => response.json())
.then(json => console.log(json));

4.2.3 Example response (200):

{
"count": 0
}

4.3 refresh many nfcs with product info and template info

after doing it, the nfcs will be queued

4.3.1 HTTPS Request

POST api/{i_client_id}/nfc/direct

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 array required products array
is_base64 string optional default is 0
sign string required sign

4.3.2 Example request:

const url =  new  URL("https://localhost/api/default/nfc/direct"); let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "[{\"nfc_code\":\"54200001\",\"template_id\":11,\"product\":{
"is_base64": "0",
"sign": "80805d794841f1b4"

}

fetch(url, {
method:  "POST", headers: headers,

4.3.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

5 OFFICE GROUP

5.1 Create a visitor's information

you can use this api to create a visitor's information.

5.1.1 HTTPS Request

POST api/{i_client_id}/of/create_visitor

Body Parameters

Parameter Type Status Description
store_code st
ring
requir
ed
store's code
code st
ring
requir
ed
visit code
name st
ring
requir
ed
visitor's name
company st
ring
optio
nal
visitor's company
department st
ring
optio
nal
visitor's department
job st
ring
optio
nal
visitor's job
mobile st
ring
requir
ed
visitor's mobile
email st
ring
optio
nal
visitor's email
card_no st
ring
optio
nal
visitor's job
receptionist st
ring
optio
nal
receptionist's name
receptionist_mobile st
ring
optio
nal
s receptionist's mobile
receptionist_departmen
t
st
ring
optio
nal
receptionist's
department

Parameter Type Status Description
started_at string optional visitor's start time
ended_at string optional visitor's end time
content string optional visit matters
is_base64 string optional default is 0
sign string required sign

5.1.2 Example request:

const url  =  new  URL("https://localhost/api/default/of/create_visitor"); let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "002",
"code": "202201010001",
"name": "Jack",
"company": "Huawei",
"department":  "Develop  DEP", "job": "Engineer",
"mobile": "189xxxxxxxx", "email": "xxxx@xxxxx.com",
"card_no":  "320520XXXXXXXXXXXXXXX",
"receptionist": "John",
"receptionist_mobile": "139xxxxxxxx",
"receptionist_department" :  "Financial  DEP", "started_at": "2023-01-01:09:30",
"ended_at": "2023-01-01:15:30",
"content": "Work's Content", "is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

5.1.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

5.2 Delete a visitor's information

you can use this api to delete a visitor's information

5.2.1 HTTPS Request

POST api/{i_client_id}/of/del_visitor

Body Parameters

Parameter Type Status Description
store_code string required store's code
code string required visit code
is_base64 string optional default is 0
sign string required sign

5.2.2 Example request:

const url = new URL("https://localhost/api/default/of/del_visitor"); let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "002",
"code": "202201010001",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST",

headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

5.2.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

5.3 Create a user's information

you can use this api to create a user's information.

5.3.1 HTTPS Request
POST api/{i_client_id}/of/create_user

Body Parameters

Parameter Type Status Description
store_code string required store's code
code string required user code
name string required user's name
company string optional user's company
department string optional user's department
job string optional user's job
mobile string required user's mobile
email string optional user's email
type string optional user's type
is_base64 string optional default is 0
sign string required sign
5.3.2 Example request:

const url = new URL("https://localhost/api/default/of/create_user"); let headers
= {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "002",
"code": "A001",
"name": "Jack",
"company": "Huawei",

"department":  "Develop  DEP", "job": "Engineer",
"mobile": "189xxxxxxxx", "email": "xxxx@xxxxx.com", "type": "0",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

5.3.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}
5.4 Delete a visitor's information

you can use this api to delete a visitor's information

5.4.1 HTTPS Request
POST api/{i_client_id}/of/del_user

Body Parameters

Parameter Type Status Description
store_code string required store's code
code string required visit code
is_base64 string optional default is 0
sign string required sign

5.4.2 Example request:

const url = new URL("https://localhost/api/default/of/del_user"); let headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "002",
"code": "A001",
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

5.4.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

6 PRODUCT GROUP

6.1 Create a Product

when the product code exists in system already, It's will be updated.

6.1.1 HTTPS Request

POST api/{i_client_id}/product/create

Body Parameters

Parameter Type Status Description
store_code string optional store's code
pi string optional product's inner_code
pc string required product's code
pn string required product's name
ps string optional product's spec
pg string optional product's grade
pu string optional product's unit
pp string required product's price
vp string optional product's vip price
pop string optional product's origin price
Parameter Type Status Description

po string optional product's origin
pm string optional product's manufacturer
promotion product's optional scene
pim string optional product's image
pqr string optional product's qrcode
f1 string optional custom field 1
f2 string optional custom field 2
f3 string optional custom field 3
f4 string optional custom field 4
f5 string optional custom field 5
f6 string optional custom field 6
f7 string optional custom field 7
f8 string optional custom field 8
f9 string optional custom field 9
f10 string optional custom field 10
f11 string optional custom field 11
f12 string optional custom field 12
f13 string optional custom field 13
f14 string optional custom field 14
f15 string optional custom field 15
f16 string optional custom field 16
Parameter Type Status Description

extend array optional optional extend field
is_base64 string optional default is 0
sign string required sign

6.1.2 Example request:

const url = new URL("https://localhost/api/default/product/create"); let headers
= {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"pi": "38100001",
Parameter Type Status Description

"pc": "6943093201838",
"pn": "apple",
"ps": "xxxx",
"pg": "xxxx",
"pu": "xxxx",
"pp": "8.9",
"vp": "001",
"pop": "001",
"po": "China",
"pm": "001",
"promotion": "1\/2\/3\/4", "pim": "001",
"pqr": "001",
"f1": "xxx",
"f2": "xxx",
"f3": "xxx",
"f4": "xxx",
"f5": "xxx",
"f6": "xxx",
"f7": "xxx",
"f8": "xxx",
"f9": "xxx",
"f10": "xxx",
"f11": "xxx",
"f12": "xxx",
"f13": "xxx",
"f14": "xxx",
"f15": "xxx",
"f16": "xxx",
"extend": "{\"e001\":\"v11\", \"e002\":\"v12\", \"e003\":\"v13\", \
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})

then(response => response.json())
then(json => console.log(json));
Parameter Type Status Description

6.1.1 Example response (200):
{
"error_code":  1,
"error_msg": "default missing store_code field"
}

6.2 Create many products

you can use this api to create some products one time.

6.2.1 HTTPS Request

POST api/{i_client_id}/product/create_multiple

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 array required products array
is_base64 string optional default is 0
sign string required sign

6.2.2 Example request:

Parameter Type Status Description

const url = new URL("https://localhost/api/default/product/create_multip let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "[{\"pc\": \"010901\", \"pn\":\"red apple\",\"pp\":56.8}, {\"
"is_base64": "0",
"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})

6.2.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

6.3 Create many products with defined ap code

you can use this api to create some products one time.

6.3.1   HTTPS Request
POST api/{i_client_id}/product/create_multiple_with_ap

Body Parameters

Parameter Type Status Description
old_store_code string required store's code
new_store_code string required store's code
f1 array required products array
is_base64 string optional default is 0
f2 string required ap code
sign string required sign

6.3.2 Example request:

const url = new URL("https://localhost/api/default/product/create_multip let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"old_store_code": "001",
"new_store_code": "002",
"f1": "[{\"pc\": \"010901\", \"pn\":\"red apple\",\"pp\":56.8}, {\"
"is_base64": "0",
"f2": "40:d6:3c:5e:11:63", "sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())

.then(json => console.log(json));

6.3.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing old_store_code field"
}

6.4 Delete product multiple

you can use this api to delete some products, if this product is bind
with esl, the esl will be unbind.

6.4.1 HTTPS Request

POST api/{i_client_id}/product/del_multiple

Body Parameters

Parameter Type Status Description
store_code string required store's code
f1 array required products array
is_base64 string optional default is 0
sign string required sign

6.4.2 Example request:

const url = new URL("https://localhost/api/default/product/del_multiple" let
headers = {
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",

6.4.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

6.5 Query product count

Query product count

6.5.1   HTTPS Request
GET api/{i_client_id}/product/query_count

Query Parameters

Parame
ter
Statu
s
Descripti
on

store_
code
requ
ired
store's
code
is_bas
e64
opti
onal
default
is 0
sign requ
ired
sign

6.5.2 Example request:

const url = new URL("https://localhost/api/default/product/query_count") let
params = {
"store_code": "001",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {
method: "GET",
headers: headers,
})
.then(response => response.json())
.then(json => console.log(json));

6.5.3 Example response (200):

{
"count": 6551
}

6.6 Query the Product's Information

6.6.1 HTTPS Request

GET api/{i_client_id}/product/query

Query Parameters

Parameter Status Description
store_code required store's code
f1 optional which page
f2 optional size in one page
is_base64 optional default is 0
sign required sign

6.6.2 Example request:

const url = new URL("https://localhost/api/default/product/query"); let
params = {
"store_code": "001",
"f1": "1",
"f2": "10",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {

6.6.3 Example response (200):

[
{
"id":  432679,
"product_code": "6943093201838",
"product_inner": "38100001", "product_name": "apple",
"product_spec": "xxxx",
"product_grade": "xxxx", "product_price": "8.90", "product_unit": "xxxx",
"product_origin_price": "1.00",
"product_mfrs": "001",
"product_origin": "China", "product_desc": "备注",
"product_image": "001",
"product_image_code ": null, "product_qrcode": "001",
"enabled":  1,
"promotion":  1,
"created_at": null,
"updated_at": "2023-01-11 15:29:20",
"product_storage":  0,
"product_storage_threshold":  10,
"product_vip_price": "1.00",
"product_sales_price": "0.00", "product_sale_type": null,
"start_date": null,
"end_date": null,
"start_time": null,

"end_time": null, "field1": "xxx",
"field2": "xxx",
"field3": "xxx",
"field4": "xxx",
"field5": "xxx",
"field6": "xxx",
"field7": "xxx",
"field8": "xxx",
"field9": "xxx",
"field10": "xxx",
"field11": "xxx",
"field12": "xxx",
"field13": "xxx",
"field14": "xxx",
"field15": "xxx",
"field16": "xxx",
"users_username": null, "store_code": "001",
"product_display": null, "image": null,
"group": null,
"video": null,
"video_code": null, "is_advert": null, "keywords": null, "extend": {
"v1": "v11",
"v2": "v12",
"v3": "v13",
"v4": "v14",
"v5": "v15",
"v6": "v16",
"v7": "v17",
"v8": "v18"
},
"product_from": null,
"field17": null,
"field18": null,
7 STORE GROUP

7.1 Create a Store

when the store code exists in system already, It's will be updated

7.1.1 HTTPS Request

POST api/{i_client_id}/store/create

Body Parameters

Parameter Type Status Description

store_code string required store's code
f1 string required store's name
f2 string optional store's address
is_base64 string optional default is 0
sign string required sign

7.1.2 Example request:

const url = new URL("https://localhost/api/default/store/create");  let headers =
{
"Content-Type": "application/json", "Accept": "application/json",
}

let body = {
"store_code": "001",
"f1": "vonluxe",
"f2": "20A, 2345 Belmont Avenue", "is_base64": "0",

"sign": "80805d794841f1b4"
}

fetch(url, {
method:  "POST", headers: headers, body: body
})
.then(response => response.json())
.then(json => console.log(json));

7.1.3 Example response (200):

{
"error_code":  1,
"error_msg": "default missing store_code field"
}

8 TEMPLATE GROUP

8.1 Query the Templates in store

8.1.1 HTTPS Request

GET api/{i_client_id}/template/query

Query Parameters

Parameter Status Description
store_code required store's code
f1 optional which page
f2 optional size in one page
is_base64 optional default is 0

sign required sign

8.1.2 Example request:

const url = new URL("https://localhost/api/default/template/query"); let
params = {
"store_code": "001",
"f1": "1",
"f2": "10",
"is_base64": "0",
"sign": "80805d794841f1b4",
};
Object.keys(params).forEach(key => url.searchParams.append(key, par

let headers = {
"Accept": "application/json",
"Content-Type": "application/json",
}

fetch(url, {
method: "GET",
headers: headers,
})
.then(response => response.json())
.then(json => console.log(json));

8.1.3 Example response (200):

[
{
"id":  608,
"esltype_code":  "ESL-15BW",
"esltemplate_name": "Men's running shoes -bak", "esltemplate_default": 0
},
{
"id":  609,
"esltype_code":  "ESL-15BW", "esltemplate_name ":  "KARELA",
"esltemplate_default": 0
},
{
"id":  610,
"esltype_code": "ESL-15R", "esltemplate_name ":  "KARELA", "esltemplate_default":
0
},
{
"id":  611,
"esltype_code": "ESL-75R", "esltemplate_name": "KAR", "esltemplate_default": 0
},
{
"id":  623,
"esltype_code": "ESL-42R",
"esltemplate_name": "erwrwer", "esltemplate_default": 0
},
{
"id":  624,
"esltype_code": "ESL-42R",
"esltemplate_name": "default-bak", "esltemplate_default": 1
},
{
"id":  643,
"esltype_code": "ESL-75R",
}
]
```
