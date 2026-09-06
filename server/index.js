const http = require('node:http');
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const prices = require('./catalog');

const PORT = Number(process.env.PORT || 10000);
const API_KEY = process.env.GGPPIX_API_KEY;
const WEBHOOK_SECRET = process.env.GGPPIX_WEBHOOK_SECRET;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';
const GGPPIX_URL = 'https://ggpixapi.com/api/v1';

function json(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function corsHeaders(origin) {
  if (!ALLOWED_ORIGIN) return {};
  return origin === ALLOWED_ORIGIN ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  } : {};
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 100_000) throw new Error('Payload muito grande.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function normalizeDocument(value) {
  return String(value || '').replace(/\D/g, '');
}

function validCPF(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(cpf[10]);
}

function validPayerDocument(value) {
  const doc = normalizeDocument(value);
  if (doc.length === 11) return validCPF(doc);
  if (doc.length === 14) return true; // A GGPIXAPI valida o CNPJ recebido.
  return false;
}

function cleanItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new Error('Carrinho inválido.');
  return items.map(item => {
    const id = String(item.id || '');
    const qty = Number(item.qty);
    if (!prices[id] || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Produto ou quantidade inválida.');
    return { id, qty, unitPriceCents: prices[id] };
  });
}

function totalFor(items) {
  return items.reduce((total, item) => total + item.unitPriceCents * item.qty, 0);
}

function validateWebhook(rawBody, signature) {
  if (!WEBHOOK_SECRET) return false;
  const match = /^t=(\d+),v1=([a-f0-9]+)$/i.exec(signature || '');
  if (!match) return false;
  const timestamp = Number(match[1]);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest('hex');
  const received = match[2];
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

async function ggpixRequest(endpoint, options = {}) {
  if (!API_KEY) throw new Error('GGPPIX_API_KEY não configurada no servidor.');
  const response = await fetch(`${GGPPIX_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text || 'Resposta inválida da GGPIXAPI.' }; }
  if (!response.ok) {
    const err = new Error(data.error || data.message || `GGPIXAPI HTTP ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function createPix(body) {
  if (!WEBHOOK_URL) throw new Error('WEBHOOK_URL não configurada no servidor.');
  const items = cleanItems(body.items);
  const amountCents = totalFor(items);
  if (amountCents < 100) throw new Error('Valor mínimo do pedido é R$ 1,00.');

  const payerName = String(body.payerName || '').trim().replace(/\s+/g, ' ');
  const payerDocument = normalizeDocument(body.payerDocument);
  const payerEmail = String(body.payerEmail || '').trim().slice(0, 160);
  const payerPhone = normalizeDocument(body.payerPhone);
  if (payerName.length < 3 || payerName.length > 120) throw new Error('Informe seu nome completo.');
  if (!validPayerDocument(payerDocument)) throw new Error('Informe um CPF válido ou CNPJ válido.');

  const externalId = `svg-${crypto.randomUUID()}`;
  const metadata = {
    orderId: externalId,
    source: 'svgbeleza',
    items: items.map(({ id, qty }) => ({ id, qty })),
    amountCents
  };
  const payload = {
    amountCents,
    description: `Pedido SVG Beleza ${externalId}`,
    payerName,
    payerDocument,
    externalId,
    webhookUrl: WEBHOOK_URL,
    metadata
  };
  if (payerEmail) payload.payerEmail = payerEmail;
  if (payerPhone) payload.payerPhone = payerPhone;

  const data = await ggpixRequest('/pix/in', { method: 'POST', body: JSON.stringify(payload) });
  const pixCopyPaste = data.pixCopyPaste || data.pixCode;
  if (!pixCopyPaste) throw new Error('A GGPIXAPI não retornou o Pix Copia e Cola.');
  const qrDataUrl = await QRCode.toDataURL(pixCopyPaste, { width: 320, margin: 2, errorCorrectionLevel: 'M' });

  return { orderId: externalId, transactionId: data.id, status: data.status || 'PENDING', amountCents, pixCopyPaste, qrDataUrl };
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const headers = corsHeaders(origin);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...headers });
    return res.end();
  }

  try {
    if (url.pathname === '/health' && req.method === 'GET') {
      return json(res, 200, { ok: true, service: 'svgbeleza-checkout', gateway: 'ggpixapi' }, headers);
    }

    if (url.pathname === '/api/create-pix' && req.method === 'POST') {
      if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) return json(res, 403, { error: 'Origem não autorizada.' }, headers);
      const body = await readJson(req);
      const result = await createPix(body);
      return json(res, 201, result, headers);
    }

    const statusMatch = url.pathname.match(/^\/api\/payment-status\/([^/]+)$/);
    if (statusMatch && req.method === 'GET') {
      const data = await ggpixRequest(`/transactions/${encodeURIComponent(statusMatch[1])}`);
      return json(res, 200, { transactionId: data.id, status: data.status, amountCents: data.amount, externalId: data.externalId, paidAt: data.paidAt || null }, headers);
    }

    if (url.pathname === '/webhooks/pix' && req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const rawBody = Buffer.concat(chunks).toString('utf8');
      if (!validateWebhook(rawBody, req.headers['x-webhook-signature'])) return json(res, 401, { error: 'Assinatura do webhook inválida.' });
      let event = {};
      try { event = JSON.parse(rawBody); } catch {}
      console.log('[GGPIX WEBHOOK]', JSON.stringify({ transactionId: event.transactionId, externalId: event.externalId, type: event.type, status: event.status, amount: event.amount, paidAt: event.paidAt }));
      return json(res, 200, { received: true });
    }

    return json(res, 404, { error: 'Rota não encontrada.' }, headers);
  } catch (error) {
    console.error('[CHECKOUT ERROR]', error);
    const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 400;
    return json(res, status, { error: error.message || 'Não foi possível criar o pagamento.' }, headers);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SVG Beleza checkout ativo na porta ${PORT}`);
  if (!API_KEY) console.warn('ATENÇÃO: GGPPIX_API_KEY não configurada.');
  if (!WEBHOOK_SECRET) console.warn('ATENÇÃO: GGPPIX_WEBHOOK_SECRET não configurada.');
  if (!WEBHOOK_URL) console.warn('ATENÇÃO: WEBHOOK_URL não configurada.');
});
