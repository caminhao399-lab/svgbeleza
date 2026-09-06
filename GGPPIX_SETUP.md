# Configuração do checkout GGPIX — SVG Beleza

## 1. Segurança
A API Key nunca deve ficar no frontend ou no GitHub. Configure-a no Render como `GGPPIX_API_KEY`.

Como a chave foi compartilhada em uma conversa, gere/revoque essa chave no painel GGPIX antes de colocar em produção.

## 2. Webhook
No painel GGPIX, cadastre:

`https://svgbeleza-api.onrender.com/webhooks/pix`

Eventos: `PIX_IN`.

Gere um segredo HMAC para esse webhook e coloque-o no Render como `GGPPIX_WEBHOOK_SECRET`.

## 3. Variáveis do backend
- `GGPPIX_API_KEY` = nova API Key do painel
- `GGPPIX_WEBHOOK_SECRET` = segredo HMAC do webhook
- `ALLOWED_ORIGIN` = URL pública do site SVG Beleza
- `WEBHOOK_URL` = `https://svgbeleza-api.onrender.com/webhooks/pix`

## 4. Render — backend
Criar um **Web Service** apontando para este mesmo repositório:

- Branch: `main`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/health`

O serviço precisa usar o nome `svgbeleza-api` para manter a URL já configurada no frontend. Se outro nome for usado, altere `window.SVG_BELEZA_API_URL` em `index.html`.

## 5. Fluxo
Carrinho → dados do comprador → `POST /api/create-pix` → GGPIX PIX In → QR Code/Copia e Cola → polling de status + webhook → `COMPLETE`.

O backend recalcula o valor usando `server/catalog.js`; o navegador não consegue escolher livremente o preço cobrado.
