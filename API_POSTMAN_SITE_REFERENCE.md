# ESL API Reference From Website Postman

Derived from the website Postman collection named `ESL`.

Source metadata:
- Collection name: `ESL`
- Description: `ESL API`
- Schema: `https://schema.getpostman.com/json/collection/v2.0.0/collection.json`

This file is intended to be the local reference for the endpoints exposed in the website Postman collection. It complements the older PDF-based reference already documented in `docs/API_ESL_INTEGRACAO_REFERENCIA_PT.md`.

## General conventions

- Base path pattern: `https://<host>/api`
- Authenticated path pattern: `https://<host>/api/{i_client_id}/...`
- Unauthenticated env path: `GET /api/query/env`
- Common headers:
  - `Accept: application/json`
  - `Content-Type: application/json`
- Common parameters:
  - `store_code`: store identifier
  - `is_base64`: usually `"0"`
  - `sign`: API sign/app key signature value
- Common pagination fields:
  - `f1`: page
  - `f2`: page size

## Important notes

- The Postman collection uses `http://localhost` only as an example host.
- The collection uses example values such as `default`, `001`, and `80805d794841f1b4`. These should not be assumed valid for a real tenant.
- The website Postman exposes more endpoints than the older PDF reference, including BLE, WiFi, PAD, `store/set`, `pad_template/query`, and `user/*`.
- Real server behavior may be stricter than the older manual. During live tests against the vendor, `store/create` required `f2` even though the older PDF marks it as optional.

## ENV GROUP

### Query the Env's Information

- Method: `GET`
- Path: `/api/query/env`
- Headers:
  - `Accept: application/json`

## ESL BLE GROUP

### query ble esl's information

- Method: `GET`
- Path: `/api/{i_client_id}/esl_ble/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query ble esl count

- Method: `GET`
- Path: `/api/{i_client_id}/esl_ble/query_count`
- Query:
  - `store_code`
  - `is_base64`
  - `sign`

### unbind a ble esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/unbind`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### bind one product or many products to one ble esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/bind`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `is_base64`
  - `sign`

### searh ble esl with flash light

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/search`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### bind many products to many bles

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/bind_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### make ble esls to refresh and led flash with product info and template info, led info

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/direct`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### delete store's ble

- Method: `POST`
- Path: `/api/{i_client_id}/esl_ble/del`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

## ESL GROUP

### bind one product or many products to one esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl/bind`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `is_base64`
  - `sign`

### bind many products to many esls

- Method: `POST`
- Path: `/api/{i_client_id}/esl/bind_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### unbind many esls

- Method: `POST`
- Path: `/api/{i_client_id}/esl/unbind`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### searh esl with flash light

- Method: `POST`
- Path: `/api/{i_client_id}/esl/search`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### sync esl information

- Method: `POST`
- Path: `/api/{i_client_id}/esl/sync`
- Body:
  - `store_code`
  - `is_base64`
  - `sign`

### make esls to refresh and led flash

- Method: `POST`
- Path: `/api/{i_client_id}/esl/direct`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### trigger the esl refresh

- Method: `POST`
- Path: `/api/{i_client_id}/esl/bind_task`
- Body:
  - `store_code`
  - `is_base64`
  - `sign`

### query the esl's information

- Method: `GET`
- Path: `/api/{i_client_id}/esl/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query esl count

- Method: `GET`
- Path: `/api/{i_client_id}/esl/query_count`
- Query:
  - `store_code`
  - `is_base64`
  - `sign`

### query some esl's information

- Method: `POST`
- Path: `/api/{i_client_id}/esl/query_status`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `is_base64`
  - `sign`

### delete store's esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl/del`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

## ESL WIFI GROUP

### query the wifi esl's information

- Method: `GET`
- Path: `/api/{i_client_id}/esl_wifi/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query count of wifi esl

- Method: `GET`
- Path: `/api/{i_client_id}/esl_wifi/query_count`
- Query:
  - `store_code`
  - `is_base64`
  - `sign`

### unbind a wifi esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/unbind`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### bind one product or many products to one wifi esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/bind`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `is_base64`
  - `sign`

### searh wifi esl with flash light

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/search`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### bind many products to many esls

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/bind_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### make wifi esl to refresh and led flash with product info and template info

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/direct`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### delete store's wifi esl

- Method: `POST`
- Path: `/api/{i_client_id}/esl_wifi/del`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

## NFC GROUP

### query the nfc's information

- Method: `GET`
- Path: `/api/{i_client_id}/nfc/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query nfc count

- Method: `GET`
- Path: `/api/{i_client_id}/nfc/query_count`
- Query:
  - `store_code`
  - `is_base64`
  - `sign`

### make one nfc to generate picture with product info and template info

- Method: `POST`
- Path: `/api/{i_client_id}/nfc/direct`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### delete store's nfc

- Method: `POST`
- Path: `/api/{i_client_id}/nfc/del`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

## PAD GROUP

### bind one product or many products to a pad

- Method: `POST`
- Path: `/api/{i_client_id}/pad/bind`
- Body:
  - `store_code`
  - `pad_code`
  - `product_code`
  - `padtemplate_id`
  - `face`
  - `device_area`
  - `is_base64`
  - `sign`

### bind many products to many pads

- Method: `POST`
- Path: `/api/{i_client_id}/pad/bind_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### unbind a pad

- Method: `POST`
- Path: `/api/{i_client_id}/pad/unbind`
- Body:
  - `store_code`
  - `pad_code`
  - `face`
  - `is_base64`
  - `sign`

### delete store's pad

- Method: `POST`
- Path: `/api/{i_client_id}/pad/del`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### query the pad's information

- Method: `GET`
- Path: `/api/{i_client_id}/pad/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

## PRODUCT GROUP

### create a product

- Method: `POST`
- Path: `/api/{i_client_id}/product/create`
- Body:
  - `store_code`
  - `pi`
  - `pc`
  - `pn`
  - `ps`
  - `pg`
  - `pu`
  - `pp`
  - `vp`
  - `pop`
  - `po`
  - `pm`
  - `promotion`
  - `pqr`
  - `f1` to `f16`
  - `extend`
  - `is_base64`
  - `sign`

### create many products

- Method: `POST`
- Path: `/api/{i_client_id}/product/create_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### delete many product

- Method: `POST`
- Path: `/api/{i_client_id}/product/del_multiple`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### query product count

- Method: `GET`
- Path: `/api/{i_client_id}/product/query_count`
- Query:
  - `store_code`
  - `is_base64`
  - `sign`

### query the product's information

- Method: `GET`
- Path: `/api/{i_client_id}/product/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query some Product's information

- Method: `POST`
- Path: `/api/{i_client_id}/product/query_with_code`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### create a product adjust order

- Method: `POST`
- Path: `/api/{i_client_id}/productadjust/create_order`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `f4`
  - `f5`
  - `f6`
  - `f7`
  - `is_base64`
  - `sign`

### delete a product adjust order

- Method: `POST`
- Path: `/api/{i_client_id}/productadjust/del_order`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

### trigger a product adjust order

- Method: `POST`
- Path: `/api/{i_client_id}/productadjust/adjust_task`
- Body:
  - `store_code`
  - `f1`
  - `is_base64`
  - `sign`

## STORE GROUP

### create a store

- Method: `POST`
- Path: `/api/{i_client_id}/store/create`
- Body:
  - `store_code`
  - `f1`
  - `f2`
  - `f3`
  - `is_base64`
  - `sign`

Observed example from the website Postman:

```json
{
  "store_code": "000",
  "f1": "STORE001",
  "f2": "STORE001",
  "f3": "20A, 2345 Belmont Avenue",
  "is_base64": "0",
  "sign": "80805d794841f1b4"
}
```

### set a store's options

- Method: `POST`
- Path: `/api/{i_client_id}/store/set`
- Body:
  - `store_code`
  - `store_name`
  - `store_address`
  - `store_api`
  - `store_docking`
  - `store_docking_detail`
  - `store_docking_fields`
  - `store_docking_time`
  - `store_timezone`
  - `store_locale`
  - `store_filter`
  - `is_base64`
  - `sign`

## TEMPLATE GROUP

### query the esl templates in store

- Method: `GET`
- Path: `/api/{i_client_id}/template/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

### query the pad templates in store

- Method: `GET`
- Path: `/api/{i_client_id}/pad_template/query`
- Query:
  - `store_code`
  - `f1`
  - `f2`
  - `is_base64`
  - `sign`

## USER GROUP

### create a user

- Method: `POST`
- Path: `/api/{i_client_id}/user/create`
- Body:
  - `store_code`
  - `user_account`
  - `user_password`
  - `user_name`
  - `user_mobile`
  - `is_base64`
  - `sign`

### delete a user

- Method: `POST`
- Path: `/api/{i_client_id}/user/delete`
- Body:
  - `store_code`
  - `user_account`
  - `is_base64`
  - `sign`

## Practical test notes

Recommended non-destructive checks against a real host:

```bash
GET /api/query/env
GET /api/{i_client_id}/esl/query_count
GET /api/{i_client_id}/product/query_count
GET /api/{i_client_id}/template/query
```

Avoid using mutation endpoints such as `store/create`, `store/set`, `product/create`, `bind`, `unbind`, `del`, and `direct` during connection smoke tests.
