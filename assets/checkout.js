(() => {
  const API_BASE = (window.SVG_BELEZA_API_URL || 'https://svgbeleza-api.onrender.com').replace(/\/$/, '');
  const TRACKING_KEY = 'svgbeleza_utm';
  let pollTimer = null;

  const style = document.createElement('style');
  style.textContent = `
    .pix-modal-backdrop{position:fixed;inset:0;background:rgba(12,18,15,.72);backdrop-filter:blur(8px);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px}.pix-modal-backdrop.show{display:flex}.pix-modal{width:min(760px,100%);max-height:92vh;overflow:auto;background:#f8f4ec;border:1px solid rgba(22,38,30,.12);border-radius:28px;box-shadow:0 30px 90px rgba(0,0,0,.3);padding:28px;color:#17201b}.pix-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.pix-head h2{margin:0;font-family:Playfair Display,serif;font-size:32px}.pix-close{border:0;background:transparent;font-size:32px;line-height:1;cursor:pointer;color:#17201b}.pix-sub{margin:6px 0 0;color:#68716c}.pix-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}.pix-form label{display:grid;gap:7px;font-size:13px;font-weight:700}.pix-form label.full{grid-column:1/-1}.pix-form input{border:1px solid #d8d1c5;background:#fff;border-radius:12px;padding:13px 14px;font:inherit;outline:none}.pix-form input:focus{border-color:#738b7a;box-shadow:0 0 0 3px rgba(115,139,122,.14)}.pix-total{display:flex;justify-content:space-between;align-items:center;padding:17px 0;border-top:1px solid #ded7ca;border-bottom:1px solid #ded7ca;margin:20px 0;font-weight:700}.pix-total strong{font-size:22px}.pix-submit{width:100%;border:0;border-radius:14px;padding:15px 18px;background:#1c2d24;color:#fff;font-weight:800;font-size:16px;cursor:pointer}.pix-submit:disabled{opacity:.55;cursor:wait}.pix-error{display:none;background:#fff0ee;color:#9b3025;border:1px solid #f0c9c3;border-radius:12px;padding:12px;margin-top:14px}.pix-error.show{display:block}.pix-payment{display:none;text-align:center}.pix-payment.show{display:block}.pix-status{font-weight:800;margin:8px 0 18px}.pix-qr{width:min(320px,80vw);aspect-ratio:1;background:#fff;border-radius:18px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.08);margin:0 auto 18px}.pix-qr img{width:100%;height:100%;display:block}.pix-copy{display:flex;gap:8px}.pix-copy input{flex:1;min-width:0;border:1px solid #d8d1c5;background:#fff;border-radius:12px;padding:12px;font:12px monospace}.pix-copy button{border:0;border-radius:12px;padding:0 15px;background:#e3ddd1;color:#17201b;font-weight:800;cursor:pointer}.pix-note{color:#68716c;font-size:13px;line-height:1.55}.pix-success{display:none;background:#edf6ef;border:1px solid #c7dfcc;border-radius:14px;padding:15px;margin-top:15px;color:#1e6a31}.pix-success.show{display:block}@media(max-width:640px){.pix-modal{padding:20px;border-radius:22px}.pix-head h2{font-size:27px}.pix-form{grid-template-columns:1fr}.pix-form label.full{grid-column:auto}.pix-copy{flex-direction:column}.pix-copy button{padding:12px}}
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'pix-modal-backdrop';
  modal.innerHTML = `<div class="pix-modal" role="dialog" aria-modal="true" aria-labelledby="pixTitle"><div class="pix-head"><div><p class="eyebrow">CHECKOUT SVG BELEZA</p><h2 id="pixTitle">Finalizar com Pix</h2><p class="pix-sub">Pagamento processado com segurança pela BravoPay.</p></div><button class="pix-close" aria-label="Fechar">×</button></div><div class="pix-form-wrap"><form class="pix-form" id="pixForm"><label class="full">Nome completo<input id="pixName" autocomplete="name" required minlength="3" placeholder="Seu nome completo"></label><label>CPF ou CNPJ<input id="pixDocument" inputmode="numeric" autocomplete="off" required placeholder="Somente números"></label><label>Celular <span style="font-weight:500">(opcional)</span><input id="pixPhone" inputmode="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label><label class="full">E-mail <span style="font-weight:500">(opcional)</span><input id="pixEmail" type="email" autocomplete="email" placeholder="voce@email.com"></label><div class="pix-total full"><span>Total do pedido</span><strong id="pixTotal">R$ 0,00</strong></div><button class="pix-submit full" type="submit" id="pixSubmit">Gerar meu Pix</button><div class="pix-error full" id="pixError"></div></form></div><div class="pix-payment" id="pixPayment"><p class="eyebrow">PAGAMENTO GERADO</p><div class="pix-status" id="pixStatus">Aguardando pagamento…</div><div class="pix-qr"><img id="pixQr" alt="QR Code Pix para pagamento"></div><div class="pix-copy"><input id="pixCopy" readonly aria-label="Pix Copia e Cola"><button id="pixCopyBtn" type="button">Copiar</button></div><p class="pix-note">Abra o aplicativo do seu banco, escolha Pix e escaneie o QR Code ou use o código Copia e Cola. Não feche esta janela até o pagamento ser confirmado.</p><div class="pix-success" id="pixSuccess">Pagamento confirmado. Obrigado pela compra!</div></div></div>`;
  document.body.appendChild(modal);
  const $ = id => document.getElementById(id);
  const money = cents => Number(cents / 100).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const close = () => { modal.classList.remove('show'); if (pollTimer) clearInterval(pollTimer); pollTimer = null; };
  modal.querySelector('.pix-close').onclick = close;
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  function captureTracking() {
    const params = new URLSearchParams(window.location.search);
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(TRACKING_KEY) || '{}'); } catch {}
    const keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','ttclid','gclid'];
    for (const key of keys) { const value = params.get(key); if (value) stored[key] = value.slice(0, 500); }
    localStorage.setItem(TRACKING_KEY, JSON.stringify(stored));
    return stored;
  }
  function bravoUtm() {
    let s = {}; try { s = JSON.parse(localStorage.getItem(TRACKING_KEY) || '{}'); } catch {}
    return { ...(s.utm_source ? {source:s.utm_source}:{}), ...(s.utm_medium ? {medium:s.utm_medium}:{}), ...(s.utm_campaign ? {campaign:s.utm_campaign}:{}), ...(s.utm_content ? {content:s.utm_content}:{}), ...(s.utm_term ? {term:s.utm_term}:{}), ...(s.fbclid ? {fbclid:s.fbclid}:{}), ...(s.ttclid ? {ttclid:s.ttclid}:{}), ...(s.gclid ? {gclid:s.gclid}:{}) };
  }
  captureTracking();

  function cart() { try { return JSON.parse(localStorage.getItem('svgbeleza_cart') || '[]'); } catch { return []; } }
  function cartItems() { return cart().map(i => ({ id:i.id, qty:Number(i.qty || i.quantity || 1) })); }
  function open() {
    const items = cartItems(); if (!items.length) return alert('Adicione um produto à sacola.');
    $('pixTotal').textContent = cart().reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || i.quantity || 1), 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    $('pixForm').style.display = ''; $('pixPayment').classList.remove('show'); $('pixError').classList.remove('show'); $('pixSubmit').disabled = false; $('pixSubmit').textContent = 'Gerar meu Pix'; modal.classList.add('show');
  }
  async function createPix(event) {
    event.preventDefault(); const submit = $('pixSubmit'); const error = $('pixError'); submit.disabled = true; submit.textContent = 'Gerando cobrança…'; error.classList.remove('show');
    try {
      const response = await fetch(`${API_BASE}/api/create-pix`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ items:cartItems(), payerName:$('pixName').value, payerDocument:$('pixDocument').value, payerEmail:$('pixEmail').value, payerPhone:$('pixPhone').value, utm:bravoUtm() }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Não foi possível gerar o Pix.');
      $('pixForm').style.display = 'none'; $('pixPayment').classList.add('show'); $('pixQr').src = data.qrDataUrl; $('pixCopy').value = data.pixCopyPaste; $('pixStatus').textContent = `Aguardando pagamento • ${money(data.amountCents)}`; poll(data.transactionId);
    } catch (err) { error.textContent = err.message; error.classList.add('show'); submit.disabled = false; submit.textContent = 'Gerar meu Pix'; }
  }
  async function checkStatus(transactionId) {
    try {
      const response = await fetch(`${API_BASE}/api/payment-status/${encodeURIComponent(transactionId)}`, { cache:'no-store' }); if (!response.ok) return; const data = await response.json();
      if (data.status === 'PAID') { if (pollTimer) clearInterval(pollTimer); $('pixStatus').textContent = 'Pagamento confirmado ✓'; $('pixSuccess').classList.add('show'); localStorage.removeItem('svgbeleza_cart'); setTimeout(() => { window.location.href = '/obrigado'; }, 1200); }
      else if (data.status === 'EXPIRED') { if (pollTimer) clearInterval(pollTimer); $('pixStatus').textContent = 'Este PIX expirou.'; }
      else if (['FAILED','CANCELED'].includes(data.status)) { if (pollTimer) clearInterval(pollTimer); $('pixStatus').textContent = data.status === 'CANCELED' ? 'Cobrança cancelada.' : 'Pagamento não concluído.'; }
      else if (data.status === 'REFUNDED') { if (pollTimer) clearInterval(pollTimer); $('pixStatus').textContent = 'Pagamento estornado.'; }
    } catch {}
  }
  function poll(transactionId) { if (pollTimer) clearInterval(pollTimer); pollTimer = setInterval(() => checkStatus(transactionId), 3000); checkStatus(transactionId); }
  $('pixForm').addEventListener('submit', createPix);
  $('pixCopyBtn').onclick = async () => { try { await navigator.clipboard.writeText($('pixCopy').value); $('pixCopyBtn').textContent = 'Copiado ✓'; setTimeout(() => $('pixCopyBtn').textContent = 'Copiar', 1800); } catch { $('pixCopy').select(); document.execCommand('copy'); } };
  const checkoutButton = document.getElementById('checkoutButton'); if (checkoutButton) checkoutButton.onclick = open;
})();
