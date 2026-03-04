# Estabilizacao do Front-End ESL (2026-03-04)

## Objetivo
Eliminar oscilacao da interface e tornar o ambiente mock previsivel para uso local e demonstracoes.

## Mudancas aplicadas
- Corrigido o fluxo de disparo do `useAsync` para evitar recarregamentos em loop.
- Mantido tratamento seguro de erros assincros sem rejeicao nao tratada no `useEffect`.
- Desativadas falhas aleatorias de mock por padrao na camada `simulateNetwork`.
- Adicionada chave de controle `VITE_ENABLE_MOCK_FAILURE=true` para reativar falhas simuladas quando necessario.

## Arquivos alterados
- `src/hooks/useAsync.ts`
- `src/services/api.ts`
- `package-lock.json`

## Validacao executada
- `npm run lint` (ok)
- `npm run build` (ok)

## Operacao local
- URL: `http://127.0.0.1:5173/`
- Para parar servidor: `taskkill /PID <pid> /F`
