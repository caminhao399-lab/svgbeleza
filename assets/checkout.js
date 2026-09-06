(() => {
  const API_BASE = (window.SVG_BELEZA_API_URL || 'https://svgbeleza-api.onrender.com').replace(/\/$/, '');
  const TRACKING_KEY = 'svgbeleza_utm';
  const CUSTOMER_KEY = 'svgbeleza_customer';
  let pollTimer = null;
  let deliveryTimer = null;
  let estimateState = null;

  const style = document.createElement('style');
  style.textContent = `
    /* Sacola inspirada no padrão editorial da referência enviada */
    .drawer{width:min(900px,96vw)!important;max-width:none!important;background:#f8f5ef!important;border-left:1px solid rgba(24,32,29,.08)!important;padding:0!important;display:grid!important;grid-template-columns:minmax(0,1.18fr) minmax(300px,.82fr)!important;grid-template-rows:auto 1fr auto!important;gap:0!important;overflow:hidden!important}
    .drawer-head{grid-column:1!important;grid-row:1!important;padding:28px 30px 18px!important;border-bottom:1px solid #e5ded3!important;background:#fbf9f4!important}
    .drawer-head h2{font-family:Playfair Display,serif!important;font-size:31px!important;letter-spacing:-.03em!important;margin:2px 0 0!important}
    #cartItems{grid-column:1!important;grid-row:2!important;padding:18px 30px!important;overflow:auto!important;min-height:0!important}
    #cartItems>div{background:#fff!important;border:1px solid #e5ddd2!important;border-radius:14px!important;margin-bottom:10px!important;box-shadow:0 7px 20px rgba(34,28,21,.05)!important}
    .drawer-summary{grid-column:2!important;grid-row:1/4!important;background:#eee9e0!important;border-left:1px solid #e0d8cc!important;padding:26px 24px!important;display:flex!important;flex-direction:column!important;min-width:0!important}
    .drawer-summary h3{font-family:Playfair Display,serif!important;font-size:22px!important;margin:0 0 18px!important;color:#202923!important}
    .drawer-summary-product{display:flex;gap:11px;align-items:center;background:#f9f7f2;border:1px solid #e0d8cc;border-radius:12px;padding:10px;margin-bottom:18px}
    .drawer-summary-product img{width:54px;height:66px;object-fit:contain;background:#fff;border-radius:8px}
    .drawer-summary-product strong{display:block;font-size:11px;line-height:1.35;color:#242b27}
    .drawer-summary-product small{display:block;margin-top:5px;color:#817a70;font-size:9px}
    .summary-lines{border-top:1px solid #dcd4c8;border-bottom:1px solid #dcd4c8;padding:14px 0;margin-bottom:16px}
    .summary-line{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#6d675f;margin:8px 0}
    .summary-line strong{color:#202823}
    .summary-line.total-line{font-size:14px;color:#1c2520;margin-top:13px}
    .summary-line.total-line strong{font-size:21px;font-family:Playfair Display,serif}
    .summary-shipping{display:flex;gap:9px;align-items:flex-start;padding:11px 12px;border-radius:12px;background:#edf4ed;border:1px solid #d0dfd0;color:#34563b;font-size:10px;line-height:1.4;margin-bottom:14px}
    .summary-security{display:flex;gap:9px;align-items:flex-start;padding:11px 12px;border-radius:12px;background:#fffdf9;border:1px solid #e0d8cc;color:#62665f;font-size:9px;line-height:1.45;margin-bottom:16px}
    .drawer-summary .total{border:0!important;margin:0!important;padding:0!important;display:block!important}
    .drawer-summary .total span{display:none!important}.drawer-summary .total strong{display:none!important}
    .drawer-summary #checkoutButton{margin-top:auto!important;width:100%!important;border-radius:999px!important;padding:14px 18px!important;font-size:12px!important;order:5!important}
    .drawer-summary .drawer-note{font-size:9px!important;text-align:center!important;margin:9px 0 0!important;color:#7b756c!important;order:6!important}
    .drawer-summary .continue-shopping{width:100%;margin:9px 0 0;border:1px solid #cfc6b9;background:transparent;color:#4d514b;border-radius:999px;padding:10px;font-size:10px;cursor:pointer}
    .drawer-summary .delivery-mini{display:none}
    .drawer-close-mobile{display:none}

    .pix-modal-backdrop{position:fixed;inset:0;background:rgba(12,18,15,.72);backdrop-filter:blur(9px);z-index:9999;display:none;align-items:center;justify-content:center;padding:16px}.pix-modal-backdrop.show{display:flex}
    .pix-modal{width:min(820px,100%);max-height:94vh;overflow:auto;background:#f8f4ec;border:1px solid rgba(22,38,30,.12);border-radius:28px;box-shadow:0 30px 90px rgba(0,0,0,.3);padding:28px;color:#17201b}
    .pix-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:20px}.pix-head h2{margin:0;font-family:Playfair Display,serif;font-size:32px;letter-spacing:-.03em}.pix-close{border:0;background:transparent;font-size:32px;line-height:1;cursor:pointer;color:#17201b}.pix-sub{margin:6px 0 0;color:#68716c;font-size:12px}
    .checkout-progress{display:flex;gap:8px;margin:0 0 20px}.checkout-step{flex:1;height:4px;border-radius:99px;background:#ded8cd}.checkout-step.active{background:#1c2d24}
    .pix-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.pix-form label{display:grid;gap:7px;font-size:12px;font-weight:700}.pix-form label.full{grid-column:1/-1}.pix-form input{border:1px solid #d8d1c5;background:#fff;border-radius:12px;padding:13px 14px;font:inherit;outline:none;color:#17201b}.pix-form input:focus{border-color:#738b7a;box-shadow:0 0 0 3px rgba(115,139,122,.14)}.pix-form input[readonly]{background:#f4f1eb;color:#686c66}.field-hint{font-size:9px;font-weight:500;color:#858077;margin-top:-3px}.cep-row{display:grid;grid-template-columns:150px 1fr;gap:12px}.cep-status{font-size:10px;color:#6b746d;min-height:14px}.cep-status.ok{color:#2f713b}.cep-status.error{color:#a63b2d}.address-grid{display:grid;grid-template-columns:1.5fr .55fr 1fr;gap:12px}.address-grid .street{grid-column:1/2}.address-grid .number{grid-column:2/3}.address-grid .complement{grid-column:3/4}.address-grid .neighborhood{grid-column:1/2}.address-grid .city{grid-column:2/3}.address-grid .state{grid-column:3/4}
    .delivery-card{grid-column:1/-1;background:#f0f4ef;border:1px solid #d5e0d3;border-radius:16px;padding:15px;margin-top:2px}.delivery-card.loading{background:#f6f3ed;border-color:#ded7cb}.delivery-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.delivery-kicker{font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#708071;font-weight:800}.delivery-card h3{font-family:Playfair Display,serif;font-size:20px;margin:3px 0;color:#1e2822}.delivery-store{font-size:10px;color:#666d65;line-height:1.45}.delivery-distance{font-size:10px;font-weight:800;color:#36573d;text-align:right;white-space:nowrap}.delivery-countdown{margin-top:12px;padding-top:12px;border-top:1px solid #d6dfd4;display:flex;align-items:center;justify-content:space-between;gap:12px}.delivery-countdown strong{font-family:Playfair Display,serif;font-size:18px}.delivery-countdown span{font-size:9px;color:#70776f;text-align:right}.delivery-disclaimer{margin:8px 0 0;font-size:8px;color:#85877f;line-height:1.4}
    .pix-total{display:flex;justify-content:space-between;align-items:center;padding:15px 0;border-top:1px solid #ded7ca;border-bottom:1px solid #ded7ca;margin:16px 0;font-weight:700}.pix-total strong{font-size:22px}.pix-submit{width:100%;border:0;border-radius:14px;padding:15px 18px;background:#1c2d24;color:#fff;font-weight:800;font-size:16px;cursor:pointer}.pix-submit:disabled{opacity:.55;cursor:wait}.pix-error{display:none;background:#fff0ee;color:#9b3025;border:1px solid #f0c9c3;border-radius:12px;padding:12px;margin-top:12px}.pix-error.show{display:block}.pix-payment{display:none;text-align:center}.pix-payment.show{display:block}.pix-status{font-weight:800;margin:8px 0 18px}.pix-qr{width:min(320px,80vw);aspect-ratio:1;background:#fff;border-radius:18px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.08);margin:0 auto 18px}.pix-qr img{width:100%;height:100%;display:block}.pix-copy{display:flex;gap:8px}.pix-copy input{flex:1;min-width:0;border:1px solid #d8d1c5;background:#fff;border-radius:12px;padding:12px;font:12px monospace}.pix-copy button{border:0;border-radius:12px;padding:0 15px;background:#e3ddd1;color:#17201b;font-weight:800;cursor:pointer}.pix-note{color:#68716c;font-size:13px;line-height:1.55}.pix-success{display:none;background:#edf6ef;border:1px solid #c7dfcc;border-radius:14px;padding:15px;margin-top:15px;color:#1e6a31}.pix-success.show{display:block}
    @media(max-width:760px){.drawer{width:100vw!important;grid-template-columns:1fr!important;grid-template-rows:auto 1fr auto!important}.drawer-head{grid-column:1!important}.drawer-summary{grid-column:1!important;grid-row:3!important;border-left:0!important;border-top:1px solid #ded6ca!important;padding:16px 18px!important;max-height:44vh!important;overflow:auto}.drawer-summary #checkoutButton{margin-top:8px!important}.drawer-summary-product{display:none}.summary-lines{margin-bottom:8px}.summary-security{display:none}#cartItems{padding:14px 18px!important}.pix-modal{padding:20px;border-radius:22px}.pix-head h2{font-size:27px}.pix-form{grid-template-columns:1fr}.pix-form label.full{grid-column:auto}.cep-row,.address-grid{grid-template-columns:1fr}.address-grid .street,.address-grid .number,.address-grid .complement,.address-grid .neighborhood,.address-grid .city,.address-grid .state{grid-column:auto}.delivery-top,.delivery-countdown{display:block}.delivery-distance{text-align:left;margin-top:5px}.pix-copy{flex-direction:column}.pix-copy button{padding:12px}}
  `;
  document.head.appendChild(style);

  function getCart() { try { return JSON.parse(localStorage.getItem('svgbeleza_cart') || '[]'); } catch { return []; } }
  function cartItems() { return getCart().map(i => ({ id:i.id, qty:Number(i.qty || i.quantity || 1) })); }
  function cartTotal() { return getCart().reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || i.quantity || 1), 0); }
  const money = cents => Number(cents / 100).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const moneyBRL = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const $ = id => document.getElementById(id);

  function buildBagSummary() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.drawer-summary')) return;
    const total = drawer.querySelector('.total');
    const button = document.getElementById('checkoutButton');
    const note = drawer.querySelector('.drawer-note');
    const summary = document.createElement('div');
    summary.className = 'drawer-summary';
    summary.innerHTML = `<h3>Resumo da compra</h3><div class="drawer-summary-product" id="drawerSummaryProduct"></div><div class="summary-lines"><div class="summary-line"><span>Subtotal</span><strong id="drawerSubtotal">R$ 0,00</strong></div><div class="summary-line"><span>Frete</span><strong style="color:#2e713b">Grátis</strong></div><div class="summary-line total-line"><span>Total do pedido</span><strong id="drawerSummaryTotal">R$ 0,00</strong></div></div><div class="summary-shipping">✓ <span><strong>Frete grátis</strong><br>Seu pedido segue para cálculo de entrega no checkout.</span></div><div class="summary-security">◈ <span>Compra protegida. Seus dados de pagamento permanecem no fluxo seguro do gateway.</span></div><button class="continue-shopping" type="button" id="drawerContinueShopping">← Continuar comprando</button></div>`;
    drawer.appendChild(summary);
    if (total) summary.appendChild(total);
    if (button) summary.appendChild(button);
    if (note) summary.appendChild(note);
    const continueBtn = document.getElementById('drawerContinueShopping');
    continueBtn?.addEventListener('click', () => document.getElementById('closeCart')?.click());
    updateBagSummary();
  }

  function updateBagSummary() {
    const items = getCart();
    const total = cartTotal();
    const subtotal = document.getElementById('drawerSubtotal');
    const totalEl = document.getElementById('drawerSummaryTotal');
    if (subtotal) subtotal.textContent = moneyBRL(total);
    if (totalEl) totalEl.textContent = moneyBRL(total);
    const first = items[0];
    const productBox = document.getElementById('drawerSummaryProduct');
    if (productBox) {
      if (!first) productBox.innerHTML = '';
      else productBox.innerHTML = `<img src="${first.image || ''}" alt=""><div><strong>${escapeHtml(first.name || 'Produto selecionado')}</strong><small>${Number(first.qty || first.quantity || 1)} unidade(s) · ${moneyBRL(Number(first.price || 0))}</small></div>`;
    }
  }

  function escapeHtml(value) { return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch])); }

  buildBagSummary();
  const bagObserver = new MutationObserver(() => updateBagSummary());
  const cartItemsEl = document.getElementById('cartItems');
  if (cartItemsEl) bagObserver.observe(cartItemsEl, { childList:true, subtree:true });
  updateBagSummary();

  const modal = document.createElement('div');
  modal.className = 'pix-modal-backdrop';
  modal.innerHTML = `<div class="pix-modal" role="dialog" aria-modal="true" aria-labelledby="pixTitle"><div class="pix-head"><div><p class="eyebrow">CHECKOUT SVG BELEZA</p><h2 id="pixTitle">Finalizar compra</h2><p class="pix-sub">Preencha seus dados para calcular a entrega e gerar seu Pix.</p></div><button class="pix-close" aria-label="Fechar">×</button></div><div class="checkout-progress"><span class="checkout-step active"></span><span class="checkout-step"></span><span class="checkout-step"></span></div><div class="pix-form-wrap"><form class="pix-form" id="pixForm"><label class="full">Nome completo<input id="pixName" autocomplete="name" required minlength="3" placeholder="Seu nome completo"></label><label>CPF<input id="pixDocument" inputmode="numeric" autocomplete="off" required placeholder="000.000.000-00" maxlength="14"></label><label>Telefone <span class="field-hint">DDD + telefone</span><input id="pixPhone" inputmode="tel" autocomplete="tel" required placeholder="(00) 00000-0000" maxlength="15"></label><label class="full">CEP <span class="field-hint">Preencha para localizar o endereço automaticamente</span><input id="pixCep" inputmode="numeric" autocomplete="postal-code" required placeholder="00000-000" maxlength="9"></label><div class="cep-row full"><div><div class="cep-status" id="cepStatus"></div></div><div></div></div><div class="address-grid full"><label class="street">Rua<input id="pixStreet" autocomplete="street-address" readonly required></label><label class="number">Número<input id="pixNumber" inputmode="numeric" autocomplete="address-line2" required placeholder="Ex.: 120"></label><label class="complement">Complemento <span class="field-hint">opcional</span><input id="pixComplement" autocomplete="address-line2" placeholder="Apto, bloco, casa..."></label><label class="neighborhood">Bairro<input id="pixNeighborhood" readonly required></label><label class="city">Cidade<input id="pixCity" readonly required></label><label class="state">Estado<input id="pixState" readonly required></label></div><div class="delivery-card loading full" id="deliveryCard"><div class="delivery-top"><div><div class="delivery-kicker">Logística inteligente</div><h3 id="deliveryTitle">Informe o CEP para calcular</h3><div class="delivery-store" id="deliveryStore">Vamos procurar a unidade Natura mais próxima do endereço informado.</div></div><div class="delivery-distance" id="deliveryDistance">—</div></div><div class="delivery-countdown"><strong id="deliveryCountdown">—</strong><span>estimativa logística<br>atualizada automaticamente</span></div><p class="delivery-disclaimer">Estimativa baseada na unidade Natura encontrada mais próxima e na rota disponível. O prazo real depende de estoque, modalidade e disponibilidade de entrega.</p></div><div class="pix-total full"><span>Total do pedido</span><strong id="pixTotal">R$ 0,00</strong></div><button class="pix-submit full" type="submit" id="pixSubmit">Continuar para o Pix</button><div class="pix-error full" id="pixError"></div></form></div><div class="pix-payment" id="pixPayment"><p class="eyebrow">PAGAMENTO GERADO</p><div class="pix-status" id="pixStatus">Aguardando pagamento…</div><div class="pix-qr"><img id="pixQr" alt="QR Code Pix para pagamento"></div><div class="pix-copy"><input id="pixCopy" readonly aria-label="Pix Copia e Cola"><button id="pixCopyBtn" type="button">Copiar</button></div><p class="pix-note">Abra o aplicativo do seu banco, escolha Pix e escaneie o QR Code ou use o código Copia e Cola. Não feche esta janela até o pagamento ser confirmado.</p><div class="pix-success" id="pixSuccess">Pagamento confirmado. Obrigado pela compra!</div></div></div>`;
  document.body.appendChild(modal);

  const close = () => { modal.classList.remove('show'); if (pollTimer) clearInterval(pollTimer); pollTimer = null; if (deliveryTimer) clearInterval(deliveryTimer); deliveryTimer = null; };
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

  function saveCustomer() {
    const data = getAddressData();
    try { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(data)); } catch {}
  }
  function getAddressData() {
    return { name:$('pixName').value.trim(), document:$('pixDocument').value.replace(/\D/g,''), phone:$('pixPhone').value.replace(/\D/g,''), cep:$('pixCep').value.replace(/\D/g,''), street:$('pixStreet').value.trim(), number:$('pixNumber').value.trim(), complement:$('pixComplement').value.trim(), neighborhood:$('pixNeighborhood').value.trim(), city:$('pixCity').value.trim(), state:$('pixState').value.trim(), source:'viacep', ...(estimateState ? { naturaStore:estimateState.storeName, naturaStoreAddress:estimateState.storeAddress, naturaDistanceKm:estimateState.distanceKm, naturaRouteMinutes:estimateState.routeMinutes, deliveryEstimateMinutes:estimateState.deliveryEstimateMinutes } : {}) };
  }
  function restoreCustomer() {
    let data = null; try { data = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null'); } catch {}
    if (!data) return;
    ['name','document','phone','cep','street','number','complement','neighborhood','city','state'].forEach(key => { const map={name:'pixName',document:'pixDocument',phone:'pixPhone',cep:'pixCep',street:'pixStreet',number:'pixNumber',complement:'pixComplement',neighborhood:'pixNeighborhood',city:'pixCity',state:'pixState'}; if ($(map[key]) && data[key]) $(map[key]).value=data[key]; });
    if (data.cep && data.street) { $('cepStatus').textContent='Endereço salvo neste dispositivo.'; $('cepStatus').className='cep-status ok'; }
  }

  function maskCPF(value) { const d=value.replace(/\D/g,'').slice(0,11); return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2'); }
  function maskPhone(value) { const d=value.replace(/\D/g,'').slice(0,11); if(d.length<=10) return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{4})(\d)/,'$1-$2'); return d.replace(/(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2'); }
  function maskCEP(value) { const d=value.replace(/\D/g,'').slice(0,8); return d.length>5 ? d.slice(0,5)+'-'+d.slice(5) : d; }
  $('pixDocument').addEventListener('input', e => e.target.value=maskCPF(e.target.value));
  $('pixPhone').addEventListener('input', e => e.target.value=maskPhone(e.target.value));
  $('pixCep').addEventListener('input', e => { e.target.value=maskCEP(e.target.value); if(e.target.value.replace(/\D/g,'').length===8) lookupCEP(); });

  async function lookupCEP() {
    const cep=$('pixCep').value.replace(/\D/g,''); if(cep.length!==8) return;
    const status=$('cepStatus'); status.textContent='Consultando CEP…'; status.className='cep-status';
    ['pixStreet','pixNeighborhood','pixCity','pixState'].forEach(id=>$(id).value='');
    try {
      const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`,{cache:'no-store'}); const data=await response.json();
      if(!response.ok || data.erro) throw new Error('CEP não encontrado.');
      $('pixStreet').value=data.logradouro || ''; $('pixNeighborhood').value=data.bairro || ''; $('pixCity').value=data.localidade || ''; $('pixState').value=data.uf || '';
      status.textContent='✓ Endereço encontrado. Informe apenas o número da casa.'; status.className='cep-status ok';
      saveCustomer();
      if($('pixNumber').value.trim()) estimateDelivery();
    } catch(err) { status.textContent=err.message || 'Não foi possível consultar o CEP.'; status.className='cep-status error'; }
  }

  function open() {
    const items=cartItems(); if(!items.length) return alert('Adicione um produto à sacola.');
    $('pixTotal').textContent=moneyBRL(cartTotal()); $('pixForm').style.display=''; $('pixPayment').classList.remove('show'); $('pixError').classList.remove('show'); $('pixSuccess').classList.remove('show'); $('pixSubmit').disabled=false; $('pixSubmit').textContent='Continuar para o Pix'; modal.classList.add('show'); restoreCustomer(); if($('pixCep').value.replace(/\D/g,'').length===8 && $('pixNumber').value.trim()) estimateDelivery();
  }

  async function geocode(query) {
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=br&q=${encodeURIComponent(query)}`;
    const response=await fetch(url,{headers:{'Accept':'application/json'},cache:'no-store'}); if(!response.ok) throw new Error('Geolocalização indisponível.'); return response.json();
  }
  function distanceKm(aLat,aLon,bLat,bLon){const R=6371,rad=Math.PI/180,dLat=(bLat-aLat)*rad,dLon=(bLon-aLon)*rad;const x=Math.sin(dLat/2)**2+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
  async function findNearestNatura(addressQuery, customerLat, customerLon, city, state) {
    let results=[];
    try { results=await geocode(`Natura, ${city}, ${state}, Brasil`); } catch {}
    if(!results.length) { try { results=await geocode(`Natura, ${addressQuery}, Brasil`); } catch {} }
    const normalized=results.filter(r=>Number.isFinite(Number(r.lat))&&Number.isFinite(Number(r.lon))).map(r=>({storeName:r.display_name?.split(',')[0]||'Natura',storeAddress:r.display_name||'Unidade Natura',lat:Number(r.lat),lon:Number(r.lon),distanceKm:distanceKm(customerLat,customerLon,Number(r.lat),Number(r.lon))})).sort((a,b)=>a.distanceKm-b.distanceKm);
    return normalized[0]||null;
  }
  async function estimateDelivery() {
    const street=$('pixStreet').value.trim(), number=$('pixNumber').value.trim(), city=$('pixCity').value.trim(), state=$('pixState').value.trim();
    if(!street||!number||!city||!state) return;
    const card=$('deliveryCard'); card.classList.add('loading'); $('deliveryTitle').textContent='Calculando a rota…'; $('deliveryStore').textContent='Localizando o endereço e a unidade Natura mais próxima.'; $('deliveryDistance').textContent='—'; $('deliveryCountdown').textContent='Aguarde…';
    const addressQuery=`${street}, ${number}, ${$('pixNeighborhood').value}, ${city}, ${state}, ${$('pixCep').value}`;
    try {
      const customerResults=await geocode(addressQuery); const customer=customerResults.find(r=>r.type==='house'||r.type==='building'||r.type==='residential'||r.type==='road')||customerResults[0]; if(!customer) throw new Error('Não foi possível localizar o endereço.');
      const cLat=Number(customer.lat),cLon=Number(customer.lon); const store=await findNearestNatura(addressQuery,cLat,cLon,city,state); if(!store) throw new Error('Não encontrei uma unidade Natura mapeada próxima.');
      let routeMinutes=Math.max(20,Math.round(store.distanceKm*3));
      try { const route=await fetch(`https://router.project-osrm.org/route/v1/driving/${store.lon},${store.lat};${cLon},${cLat}?overview=false`,{cache:'no-store'}).then(r=>r.json()); if(route?.routes?.[0]) routeMinutes=Math.max(10,Math.round(route.routes[0].duration/60)); } catch {}
      const deliveryEstimateMinutes=Math.min(72*60,Math.max(120,routeMinutes+120));
      estimateState={storeName:store.storeName,storeAddress:store.storeAddress,distanceKm:Number(store.distanceKm.toFixed(1)),routeMinutes,deliveryEstimateMinutes,targetAt:Date.now()+deliveryEstimateMinutes*60000};
      card.classList.remove('loading'); $('deliveryTitle').textContent='Entrega estimada'; $('deliveryStore').textContent=`Natura mais próxima encontrada: ${store.storeName}`; $('deliveryDistance').textContent=`${store.distanceKm.toFixed(1).replace('.',',')} km`;
      startDeliveryCountdown(estimateState.targetAt); saveCustomer();
    } catch(err) { card.classList.remove('loading'); $('deliveryTitle').textContent='Prazo a confirmar'; $('deliveryStore').textContent='O endereço foi preenchido, mas a rota da unidade Natura não pôde ser calculada agora.'; $('deliveryDistance').textContent=''; $('deliveryCountdown').textContent='Consulte as condições no fechamento'; estimateState=null; }
  }
  function formatCountdown(ms){const total=Math.max(0,Math.floor(ms/1000)),days=Math.floor(total/86400),hours=Math.floor((total%86400)/3600),mins=Math.floor((total%3600)/60),secs=total%60;return `${days}d ${String(hours).padStart(2,'0')}h ${String(mins).padStart(2,'0')}min ${String(secs).padStart(2,'0')}s`;}
  function startDeliveryCountdown(targetAt){if(deliveryTimer)clearInterval(deliveryTimer);const tick=()=>{const el=$('deliveryCountdown');if(!el)return;const remaining=targetAt-Date.now();el.textContent=remaining>0?formatCountdown(remaining):'Em breve';if(remaining<=0){clearInterval(deliveryTimer);deliveryTimer=null;}};tick();deliveryTimer=setInterval(tick,1000);}

  async function createPix(event) {
    event.preventDefault(); const submit=$('pixSubmit'),error=$('pixError'); submit.disabled=true; submit.textContent='Validando dados…'; error.classList.remove('show');
    try {
      if($('pixPhone').value.replace(/\D/g,'').length<10) throw new Error('Informe o telefone completo com DDD.');
      if($('pixCep').value.replace(/\D/g,'').length!==8) throw new Error('Informe um CEP válido.');
      if(!$('pixStreet').value||!$('pixNumber').value||!$('pixNeighborhood').value||!$('pixCity').value||!$('pixState').value) throw new Error('Complete o endereço antes de continuar.');
      saveCustomer(); submit.textContent='Gerando cobrança Pix…';
      const response=await fetch(`${API_BASE}/api/create-pix`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cartItems(),payerName:$('pixName').value,payerDocument:$('pixDocument').value,payerPhone:$('pixPhone').value,utm:bravoUtm(),address:getAddressData()})});
      const data=await response.json(); if(!response.ok) throw new Error(data.error||'Não foi possível gerar o Pix.');
      $('pixForm').style.display='none'; $('pixPayment').classList.add('show'); $('pixQr').src=data.qrDataUrl; $('pixCopy').value=data.pixCopyPaste; $('pixStatus').textContent=`Aguardando pagamento • ${money(data.amountCents)}`; poll(data.transactionId);
    } catch(err) { error.textContent=err.message||'Não foi possível continuar.'; error.classList.add('show'); submit.disabled=false; submit.textContent='Continuar para o Pix'; }
  }
  async function checkStatus(transactionId) {
    try { const response=await fetch(`${API_BASE}/api/payment-status/${encodeURIComponent(transactionId)}`,{cache:'no-store'}); if(!response.ok)return; const data=await response.json(); if(data.status==='PAID'){if(pollTimer)clearInterval(pollTimer);$('pixStatus').textContent='Pagamento confirmado ✓';$('pixSuccess').classList.add('show');localStorage.removeItem('svgbeleza_cart');setTimeout(()=>{window.location.href='/obrigado';},1200)} else if(data.status==='EXPIRED'){if(pollTimer)clearInterval(pollTimer);$('pixStatus').textContent='Este PIX expirou.'} else if(['FAILED','CANCELED'].includes(data.status)){if(pollTimer)clearInterval(pollTimer);$('pixStatus').textContent=data.status==='CANCELED'?'Cobrança cancelada.':'Pagamento não concluído.'} else if(data.status==='REFUNDED'){if(pollTimer)clearInterval(pollTimer);$('pixStatus').textContent='Pagamento estornado.'} } catch {}
  }
  function poll(transactionId){if(pollTimer)clearInterval(pollTimer);pollTimer=setInterval(()=>checkStatus(transactionId),3000);checkStatus(transactionId);}
  $('pixForm').addEventListener('submit',createPix);
  $('pixNumber').addEventListener('blur',estimateDelivery);
  $('pixNumber').addEventListener('input',()=>{if($('pixNumber').value.trim()&&$('pixCep').value.replace(/\D/g,'').length===8) saveCustomer();});
  $('pixCopyBtn').onclick=async()=>{try{await navigator.clipboard.writeText($('pixCopy').value);$('pixCopyBtn').textContent='Copiado ✓';setTimeout(()=>$('pixCopyBtn').textContent='Copiar',1800)}catch{$('pixCopy').select();document.execCommand('copy')}};
  const checkoutButton=document.getElementById('checkoutButton'); if(checkoutButton) checkoutButton.onclick=open;
})();
