# Instruções para Adicionar Assets Vhera Tag

## Imagem Fornecida

O logo da Vhera Tag foi fornecido. Por favor, salve a imagem nos seguintes locais:

## Locais Necessários

### 1. Logo Principal (para componentes)
**Caminho:** `src/assets/brand/vhera-tag-logo.png`
**Uso:** BrandSignature, Login, páginas principais
**Formato:** PNG (preferido) ou JPG
**Tamanho recomendado:** Mínimo 512x512px

### 2. Ícone Compacto (para sidebar, favicon)
**Caminho:** `src/assets/brand/vhera-tag-icon.png`
**Uso:** Sidebar compacta, favicon
**Formato:** PNG com fundo transparente
**Tamanho recomendado:** 64x64px ou 128x128px
**Conteúdo:** Apenas o elemento gráfico da etiqueta (sem texto "VHERA TAG")

### 3. Favicon (para navegador)
**Caminho:** `public/vhera-tag-favicon.png`
**Uso:** Aba do navegador
**Formato:** PNG
**Tamanho recomendado:** 32x32px ou 64x64px
**Conteúdo:** Ícone compacto da etiqueta

## Como Preparar as Imagens

### A partir da imagem fornecida:

1. **Logo completo:** Use a imagem fornecida como está para `vhera-tag-logo.png`
2. **Ícone compacto:** Recorte apenas o elemento gráfico da etiqueta (parte esquerda) para `vhera-tag-icon.png`
3. **Favicon:** Use o ícone compacto redimensionado para 32x32px ou 64x64px

### Ferramentas sugeridas:
- Photoshop, GIMP, ou qualquer editor de imagens
- Ferramentas online como Canva, Remove.bg, ou similar
- Para recorte: use ferramenta de seleção e recorte

## Após Salvar as Imagens

1. Verifique se os arquivos estão nos locais corretos
2. Execute `npm run build` para validar que não há erro de import
3. Continue com a próxima fase do plano

## Assets Antigos (Backup)

Os assets antigos serão mantidos como backup:
- `src/assets/brand/livelabel-logo.jpg` (existente)
- `public/livelabel-logo.jpg` (existente)

Não apague esses arquivos até que a migração esteja completa e validada.
