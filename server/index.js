const http = require('node:http');
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const prices = require('./catalog');

const PORT = Number(process.env.PORT || 10000);
const BRAVOPAY_API_KEY = process.env.BRAVOPAY_API_KEY;
const BRAVOPAY_BASE_URL = process.env.BRAVOPAY_BASE_URL || 'https://bravopay.club/api/v1';
const BRAVOPAY_PRODUCT_ID = process.env.BRAVOPAY_PRODUCT_ID || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://svgbeleza.onrender.com';

function json(res, status, data, extraHeaders = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(data));
}
function corsHeaders(origin) {
  if (!ALLOWED_ORIGIN) return {};
  return origin === ALLOWED_ORIGIN ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' } : {};
}
async function readJson(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 100_000) throw new Error('Payload muito grande.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
function normalizeDocument(value) { return String(value || '').replace(/\D/g, ''); }
function validCPF(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== Number(cpf[9])) return false;
  sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0; return d2 === Number(cpf[10]);
}
function validPayerDocument(value) { const doc = normalizeDocument(value); if (doc.length === 11) return validCPF(doc); if (doc.length === 14) return true; return false; }
function cleanItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new Error('Carrinho inválido.');
  return items.map(item => { const id = String(item.id || ''); const qty = Number(item.qty); if (!prices[id] || !Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error('Produto ou quantidade inválida.'); return { id, qty, unitPriceCents: prices[id] }; });
}
function totalFor(items) { return items.reduce((total, item) => total + item.unitPriceCents * item.qty, 0); }
function cleanUtm(utm) {
  if (!utm || typeof utm !== 'object') return {};
  const keys = ['source', 'medium', 'campaign', 'content', 'term', 'fbclid', 'ttclid', 'gclid']; const result = {};
  for (const key of keys) { if (utm[key] !== undefined && utm[key] !== null) { const value = String(utm[key]).trim(); if (value) result[key] = value.slice(0, 500); } }
  return result;
}
async function bravopayRequest(endpoint, options = {}) {
  if (!BRAVOPAY_API_KEY) throw new Error('BRAVOPAY_API_KEY não configurada no servidor.');
  const response = await fetch(`${BRAVOPAY_BASE_URL}${endpoint}`, { ...options, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BRAVOPAY_API_KEY}`, ...(options.headers || {}) } });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = { error: text || 'Resposta inválida da BravoPay.' }; }
  if (!response.ok) { const err = new Error(data.error || data.message || `BravoPay HTTP ${response.status}`); err.status = response.status; throw err; }
  return data;
}
async function createPix(body) {
  const items = cleanItems(body.items); const amountCents = totalFor(items); if (amountCents < 100) throw new Error('Valor mínimo do pedido é R$ 1,00.');
  const payerName = String(body.payerName || '').trim().replace(/\s+/g, ' '); const payerDocument = normalizeDocument(body.payerDocument); const payerEmail = String(body.payerEmail || '').trim().slice(0, 160); const payerPhone = normalizeDocument(body.payerPhone);
  if (payerName.length < 3 || payerName.length > 120) throw new Error('Informe seu nome completo.'); if (!validPayerDocument(payerDocument)) throw new Error('Informe um CPF válido ou CNPJ válido.');
  const externalReference = `svg-${crypto.randomUUID()}`;
  const payload = { amount_cents: amountCents, method: 'pix', customer: { name: payerName, cpf: payerDocument, ...(payerEmail ? { email: payerEmail } : {}), ...(payerPhone ? { phone: payerPhone } : {}) }, external_reference: externalReference, utm: cleanUtm(body.utm), ...(BRAVOPAY_PRODUCT_ID ? { product_id: BRAVOPAY_PRODUCT_ID } : {}) };
  const data = await bravopayRequest('/transactions', { method: 'POST', body: JSON.stringify(payload) }); const copyPaste = data?.pix?.copy_paste;
  if (!data?.id || !copyPaste) throw new Error('A BravoPay não retornou uma cobrança PIX válida.');
  const qrDataUrl = await QRCode.toDataURL(copyPaste, { width: 320, margin: 2, errorCorrectionLevel: 'M' });
  return { success: true, orderId: externalReference, transactionId: data.id, status: data.status || 'PENDING', amountCents, pixCopyPaste: copyPaste, qrDataUrl, expiresAt: data?.pix?.expires_at || null };
}
async function getPaymentStatus(transactionId) {
  const data = await bravopayRequest(`/transactions/${encodeURIComponent(transactionId)}`, { method: 'GET' });
  return { transactionId: data.id, status: data.status, amountCents: data.amount_cents, externalReference: data.external_reference || null, paidAt: data.paid_at || null };
}
async function handleWebhook(req) {
  const chunks = []; let size = 0; for await (const chunk of req) { size += chunk.length; if (size > 100_000) throw new Error('Webhook muito grande.'); chunks.push(chunk); }
  const event = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); if (!event?.transaction?.id) throw new Error('Webhook sem transaction.id.');
  console.log('[BRAVOPAY WEBHOOK]', JSON.stringify({ event: event.event, transactionId: event.transaction.id, amountCents: event.transaction.amount_cents, paidAt: event.transaction.paid_at || null }));
  if (['transaction.paid', 'transaction.refunded', 'transaction.chargeback'].includes(event.event)) console.log('[BRAVOPAY CONFIRMED]', JSON.stringify(await getPaymentStatus(event.transaction.id)));
}
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || ''; const headers = corsHeaders(origin); const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { ...headers }); return res.end(); }
  try {
    if (url.pathname === '/health' && req.method === 'GET') return json(res, 200, { ok: true, service: 'svgbeleza-checkout', gateway: 'bravopay', bravoPayKeyConfigured: Boolean(BRAVOPAY_API_KEY), productIdConfigured: Boolean(BRAVOPAY_PRODUCT_ID) }, headers);
    if (url.pathname === '/api/create-pix' && req.method === 'POST') { if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) return json(res, 403, { error: 'Origem não autorizada.' }, headers); return json(res, 201, await createPix(await readJson(req)), headers); }
    const statusMatch = url.pathname.match(/^\/api\/payment-status\/([^/]+)$/);
    if (statusMatch && req.method === 'GET') return json(res, 200, await getPaymentStatus(decodeURIComponent(statusMatch[1])), headers);
    if (url.pathname === '/webhooks/bravopay' && req.method === 'POST') { await handleWebhook(req); return json(res, 200, { received: true }); }
    return json(res, 404, { error: 'Rota não encontrada.' }, headers);
  } catch (error) { console.error('[CHECKOUT ERROR]', error); const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 400; return json(res, status, { error: error.message || 'Não foi possível processar o pagamento.' }, headers); }
});
server.listen(PORT, '0.0.0.0', () => { console.log(`SVG Beleza checkout BravoPay ativo na porta ${PORT}`); if (!BRAVOPAY_API_KEY) console.warn('ATENÇÃO: BRAVOPAY_API_KEY não configurada.'); if (!BRAVOPAY_PRODUCT_ID) console.warn('Aviso: BRAVOPAY_PRODUCT_ID não configurada; product_id não será enviado.'); });
