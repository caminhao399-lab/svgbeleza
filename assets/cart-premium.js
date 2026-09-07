(() => {
  const KEY = 'svgbeleza_cart';
  const $ = id => document.getElementById(id);
  const money = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const read = () => { try { const c = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(c) ? c : []; } catch { return []; } };
  const qty = i => Math.max(1, Number(i?.qty || i?.quantity || 1));
  const sku = i => String(i?.id || '').split('-').pop();
  const photoUrl = i => {
    const s = sku(i);
    if (/^\d+$/.test(s)) return `https://images.rede.natura.net/image/sku/1200x1200/${s}_1.jpg`;
    return i?.image || '';
  };
  const total = c => c.reduce((sum, i) => sum + Number(i?.price || 0) * qty(i), 0);

  const known = {
    '167291': { brand:'Lumina', size:'300 ml', tag:'Antifrizz 24h', cat:'Cabelos lisos', desc:'Restaura os fios, alinha as cutículas e ajuda a controlar o frizz por até 24 horas.' },
    '167288': { brand:'Lumina', size:'150 ml', tag:'Proteção térmica', cat:'Cabelos lisos', desc:'Spray com aminoácidos, barreira antiumidade e proteção térmica de até 230°C.' },
    '167286': { brand:'Lumina', size:'300 ml', tag:'Restauração', cat:'Cabelos lisos', desc:'Limpeza equilibrada de longa duração, com recarga de nutrientes e efeito liso prolongado.' },
    '167289': { brand:'Lumina', size:'250 ml', tag:'Tratamento profundo', cat:'Cabelos lisos', desc:'Restauração imediata, reposição de massa e fortalecimento dos fios.' },
    '167294': { brand:'Lumina', size:'300 ml', tag:'Refil econômico', cat:'Cabelos lisos', desc:'Versão refil para limpeza equilibrada, maciez e efeito liso prolongado.' },
    '167285': { brand:'Lumina', size:'300 ml', tag:'Refil econômico', cat:'Cabelos lisos', desc:'Refil que restaura, alinha as cutículas e ajuda a reduzir o frizz.' }
  };
  const info = i => {
    const k = known[sku(i)] || {};
    const size = i?.size || k.size || ((String(i?.name || '').match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|kg|unidades?)\b/i) || [])[0] || '');
    return { brand:i?.brand || k.brand || 'SVG Beleza', size, tag:i?.tag || k.tag || 'Cuidados capilares', cat:i?.cat === 'cacheados' ? 'Cabelos cacheados' : i?.cat === 'crespos' ? 'Cabelos crespos' : k.cat || 'Cuidados para cabelos', desc:i?.desc || k.desc || 'Produto selecionado para compor uma rotina de cuidados capilares.' };
  };

  const style = document.createElement('style');
  style.id = 'svg-cart-premium-v2';
  style.textContent = `
    body.svg-bag-open{overflow:hidden}
    .drawer.svg-premium-bag{position:fixed!important;inset:0 0 0 auto!important;width:min(1120px,97vw)!important;height:100vh!important;max-width:none!important;padding:0!important;background:#fff!important;border:0!important;border-left:1px solid #dcd6cd!important;border-radius:0!important;box-shadow:-30px 0 90px rgba(22,30,25,.24)!important;display:grid!important;grid-template-columns:minmax(0,1fr) 390px!important;grid-template-rows:92px minmax(0,1fr)!important;overflow:hidden!important;z-index:5000!important;transform:translateX(101%)!important;transition:transform .32s cubic-bezier(.2,.75,.2,1)!important}
    .drawer.svg-premium-bag.open{transform:translateX(0)!important}
    .drawer.svg-premium-bag .drawer-head{grid-column:1!important;grid-row:1!important;height:92px!important;padding:24px 42px!important;background:#fff!important;border-bottom:1px solid #e8e2da!important;display:flex!important;align-items:center!important;justify-content:space-between!important}
    .drawer.svg-premium-bag .drawer-head .eyebrow{font-size:9px!important;letter-spacing:.24em!important;margin:0 0 6px!important;color:#81796f!important}
    .drawer.svg-premium-bag .drawer-head h2{margin:0!important;font-family:'Playfair Display',serif!important;font-size:34px!important;line-height:1!important;letter-spacing:-.04em!important;color:#17211c!important}
    .drawer.svg-premium-bag .drawer-head button{position:static!important;flex:none!important;width:42px!important;height:42px!important;padding:0!important;border:1px solid #d8d0c6!important;border-radius:50%!important;background:#fbf9f5!important;color:#18231d!important;font-size:24px!important;line-height:1!important;cursor:pointer!important;transition:.2s ease!important}.drawer.svg-premium-bag .drawer-head button:hover{background:#172820!important;color:#fff!important;border-color:#172820!important}
    .drawer.svg-premium-bag #cartItems{grid-column:1!important;grid-row:2!important;padding:4px 42px 42px!important;background:#fff!important;overflow:auto!important;min-width:0!important;min-height:0!important}
    .svg-bag-item{display:grid!important;grid-template-columns:176px minmax(0,1fr) 125px!important;gap:28px!important;align-items:start!important;padding:30px 0!important;border-bottom:1px solid #e8e2da!important}
    .svg-bag-photo-wrap{position:relative;width:176px!important;height:198px!important;border-radius:18px!important;background:linear-gradient(145deg,#f8f5ef,#f1ede6)!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important}
    .svg-bag-photo{width:100%!important;height:100%!important;padding:16px!important;object-fit:contain!important;display:block!important;mix-blend-mode:multiply!important}
    .svg-bag-badge{position:absolute!important;left:12px!important;top:12px!important;padding:5px 8px!important;border-radius:999px!important;background:rgba(255,255,255,.9)!important;border:1px solid #e1dbd2!important;font-size:8px!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#6f695f!important}
    .svg-bag-info{min-width:0!important;padding-top:2px!important}.svg-bag-brand{font-size:9px!important;line-height:1!important;letter-spacing:.2em!important;text-transform:uppercase!important;color:#8a8177!important;margin:0 0 9px!important}.svg-bag-name{font-size:18px!important;line-height:1.3!important;font-weight:700!important;letter-spacing:-.01em!important;color:#1b251f!important;max-width:620px!important}.svg-bag-desc{margin-top:9px!important;max-width:620px!important;font-size:11px!important;line-height:1.55!important;color:#706b63!important}.svg-bag-meta{display:flex!important;flex-wrap:wrap!important;gap:7px!important;margin-top:14px!important}.svg-bag-meta span{display:inline-flex!important;align-items:center!important;min-height:26px!important;padding:0 9px!important;border:1px solid #ded8cf!important;border-radius:999px!important;background:#fbfaf7!important;font-size:9px!important;color:#5f5b55!important}.svg-bag-actions{display:flex!important;align-items:center!important;gap:12px!important;margin-top:18px!important}.svg-bag-qty{display:inline-flex!important;align-items:center!important;height:38px!important;border:1px solid #cfc8be!important;border-radius:999px!important;overflow:hidden!important;background:#fff!important}.svg-bag-qty button{width:36px!important;height:38px!important;padding:0!important;border:0!important;background:#fff!important;color:#26312a!important;font-size:17px!important;cursor:pointer!important}.svg-bag-qty span{min-width:34px!important;text-align:center!important;font-size:11px!important;font-weight:800!important;color:#26312a!important}.svg-bag-remove{border:0!important;background:transparent!important;color:#777169!important;text-decoration:none!important;font-size:10px!important;padding:7px 2px!important;cursor:pointer!important}.svg-bag-remove:hover{text-decoration:underline!important;color:#1d2922!important}
    .svg-bag-price{text-align:right!important;padding-top:2px!important;white-space:nowrap!important}.svg-bag-price small{display:block!important;margin-bottom:5px!important;font-size:9px!important;color:#8b847b!important}.svg-bag-price strong{font-size:17px!important;color:#1d2821!important;letter-spacing:-.02em!important}
    .svg-bag-empty{padding:130px 30px!important;text-align:center!important;color:#766f67!important;font-size:12px!important}.svg-bag-empty strong{display:block!important;margin-bottom:9px!important;font-family:'Playfair Display',serif!important;font-size:31px!important;color:#1d2821!important}
    .drawer.svg-premium-bag .drawer-summary{grid-column:2!important;grid-row:1/3!important;min-width:0!important;display:flex!important;flex-direction:column!important;padding:34px 30px 28px!important;background:#f4f0e9!important;border-left:1px solid #dcd5ca!important;overflow:auto!important}.drawer.svg-premium-bag .drawer-summary h3{margin:0 0 21px!important;font-family:'Playfair Display',serif!important;font-size:28px!important;line-height:1.08!important;letter-spacing:-.03em!important;color:#17211c!important}
    .drawer.svg-premium-bag .drawer-summary-product{display:grid!important;grid-template-columns:94px minmax(0,1fr)!important;gap:13px!important;align-items:center!important;margin:0 0 22px!important;padding:12px!important;background:#fff!important;border:1px solid #ded8cf!important;border-radius:15px!important;min-width:0!important}.drawer.svg-premium-bag .drawer-summary-product img{width:94px!important;height:108px!important;object-fit:contain!important;padding:7px!important;background:#f6f2eb!important;border-radius:10px!important;mix-blend-mode:multiply!important}.drawer.svg-premium-bag .drawer-summary-product>div{min-width:0!important}.drawer.svg-premium-bag .drawer-summary-product strong{display:block!important;font-size:12px!important;line-height:1.35!important;color:#202a24!important}.drawer.svg-premium-bag .drawer-summary-product small{display:block!important;margin-top:6px!important;font-size:9px!important;line-height:1.45!important;color:#7b746b!important}
    .drawer.svg-premium-bag .summary-lines{padding:16px 0!important;margin:0 0 16px!important;border-top:1px solid #d6cec3!important;border-bottom:1px solid #d6cec3!important}.drawer.svg-premium-bag .summary-line{display:flex!important;justify-content:space-between!important;gap:12px!important;margin:10px 0!important;font-size:12px!important;color:#706a62!important}.drawer.svg-premium-bag .summary-line strong{color:#202a24!important}.drawer.svg-premium-bag .summary-line.total-line{margin-top:18px!important;font-size:14px!important;color:#202a24!important}.drawer.svg-premium-bag .summary-line.total-line strong{font-family:'Playfair Display',serif!important;font-size:30px!important;letter-spacing:-.03em!important}
    .drawer.svg-premium-bag .summary-shipping,.drawer.svg-premium-bag .summary-security{display:flex!important;gap:9px!important;align-items:flex-start!important;padding:13px!important;margin:0 0 10px!important;border-radius:12px!important;font-size:9px!important;line-height:1.5!important}.drawer.svg-premium-bag .summary-shipping{background:#edf4ed!important;border:1px solid #cfddcf!important;color:#31573a!important}.drawer.svg-premium-bag .summary-security{background:#fff!important;border:1px solid #ded8cf!important;color:#68645e!important;margin-bottom:20px!important}.drawer.svg-premium-bag .drawer-summary .total{display:none!important}
    .drawer.svg-premium-bag .continue-shopping{order:6!important;width:100%!important;height:46px!important;margin:0 0 10px!important;border:1px solid #bcb4a8!important;border-radius:999px!important;background:transparent!important;color:#27322b!important;font-size:11px!important;font-weight:800!important;cursor:pointer!important}.drawer.svg-premium-bag .continue-shopping:hover{background:#fff!important}.drawer.svg-premium-bag .drawer-summary #checkoutButton{order:7!important;width:100%!important;height:50px!important;margin:0!important;border:0!important;border-radius:999px!important;background:#172820!important;color:#fff!important;font-size:12px!important;font-weight:800!important;cursor:pointer!important;box-shadow:0 10px 24px rgba(23,40,32,.17)!important}.drawer.svg-premium-bag .drawer-note{order:8!important;margin:10px 0 0!important;text-align:center!important;color:#817970!important;font-size:9px!important;line-height:1.45!important}
    .overlay.svg-premium-overlay{z-index:4990!important;background:rgba(10,16,13,.62)!important;backdrop-filter:blur(3px)!important}
    .cart-btn.has-items{box-shadow:0 0 0 1px rgba(197,167,125,.25)!important}
    .svg-bag-toast{position:fixed;left:50%;bottom:24px;z-index:10001;transform:translate(-50%,12px);opacity:0;pointer-events:none;background:#172820;color:#fff;padding:11px 18px;border-radius:999px;font-size:11px;font-weight:700;box-shadow:0 12px 30px rgba(0,0,0,.18);transition:.2s ease}.svg-bag-toast.show{opacity:1;transform:translate(-50%,0)}
    @media(max-width:820px){.drawer.svg-premium-bag{width:100vw!important;grid-template-columns:1fr!important;grid-template-rows:76px minmax(0,1fr) auto!important}.drawer.svg-premium-bag .drawer-head{grid-column:1!important;grid-row:1!important;height:76px!important;padding:16px 20px!important}.drawer.svg-premium-bag .drawer-head h2{font-size:26px!important}.drawer.svg-premium-bag #cartItems{grid-column:1!important;grid-row:2!important;padding:0 20px 20px!important}.svg-bag-item{grid-template-columns:102px minmax(0,1fr)!important;gap:15px!important;padding:20px 0!important}.svg-bag-photo-wrap{width:102px!important;height:122px!important;border-radius:13px!important}.svg-bag-photo{padding:9px!important}.svg-bag-name{font-size:14px!important}.svg-bag-desc{font-size:10px!important;margin-top:7px!important}.svg-bag-meta{margin-top:9px!important}.svg-bag-meta span{font-size:8px!important;min-height:23px!important}.svg-bag-actions{margin-top:11px!important}.svg-bag-price{grid-column:2!important;text-align:left!important;padding-top:0!important;margin-top:-5px!important}.svg-bag-price small{display:inline!important;margin-right:6px!important}.svg-bag-price strong{font-size:14px!important}.drawer.svg-premium-bag .drawer-summary{grid-column:1!important;grid-row:3!important;padding:17px 20px 20px!important;border-left:0!important;border-top:1px solid #d8d0c5!important;max-height:46vh!important}.drawer.svg-premium-bag .drawer-summary h3{font-size:21px!important;margin-bottom:11px!important}.drawer.svg-premium-bag .drawer-summary-product{display:none!important}.drawer.svg-premium-bag .summary-lines{padding:9px 0!important;margin-bottom:9px!important}.drawer.svg-premium-bag .summary-line{font-size:10px!important;margin:6px 0!important}.drawer.svg-premium-bag .summary-line.total-line strong{font-size:22px!important}.drawer.svg-premium-bag .summary-shipping{font-size:8px!important;padding:9px!important;margin-bottom:7px!important}.drawer.svg-premium-bag .summary-security{display:none!important}.drawer.svg-premium-bag .continue-shopping{height:39px!important;font-size:9px!important;margin-bottom:7px!important}.drawer.svg-premium-bag .drawer-summary #checkoutButton{height:43px!important;font-size:10px!important}}
  `;
  document.head.appendChild(style);

  function ensureSummary(){
    const d = $('drawer'); if(!d) return;
    d.classList.add('svg-premium-bag');
    $('overlay')?.classList.add('svg-premium-overlay');
    let s = d.querySelector('.drawer-summary');
    if(!s){
      s = document.createElement('div');
      s.className = 'drawer-summary';
      s.innerHTML = '<h3>Resumo da compra</h3><div class="drawer-summary-product" id="drawerSummaryProduct"></div><div class="summary-lines"><div class="summary-line"><span>Subtotal</span><strong id="drawerSubtotal">R$ 0,00</strong></div><div class="summary-line"><span>Frete</span><strong>A calcular</strong></div><div class="summary-line total-line"><span>Total do pedido</span><strong id="drawerSummaryTotal">R$ 0,00</strong></div></div><div class="summary-shipping">✓ <span><strong>Entrega calculada no checkout</strong><br>O valor e o prazo aparecem depois que você informa o endereço.</span></div><div class="summary-security">◈ <span>Compra protegida no fluxo seguro de pagamento.</span></div>';
      d.appendChild(s);
    }
    if(!s.querySelector('.continue-shopping')){
      const c = document.createElement('button'); c.type='button'; c.className='continue-shopping'; c.textContent='← Continuar comprando'; c.onclick=closeBag; s.appendChild(c);
    }
    const oldTotal=d.querySelector('.total'), checkout=$('checkoutButton'), note=d.querySelector('.drawer-note');
    if(oldTotal && oldTotal.parentElement!==s) s.appendChild(oldTotal);
    if(checkout && checkout.parentElement!==s) s.appendChild(checkout);
    if(note && note.parentElement!==s) s.appendChild(note);
  }

  function render(){
    const root=$('cartItems'); if(!root) return;
    const c=read(); ensureSummary();
    const count=c.reduce((sum,i)=>sum+qty(i),0);
    if($('cartCount')) $('cartCount').textContent=count;
    $('cartButton')?.classList.toggle('has-items',count>0);
    root.innerHTML = c.length ? c.map((i,n)=>{
      const d=info(i), src=photoUrl(i);
      return `<article class="svg-bag-item"><div class="svg-bag-photo-wrap"><span class="svg-bag-badge">${esc(d.brand)}</span><img class="svg-bag-photo" src="${esc(src)}" alt="${esc(i.name)}" loading="eager" onerror="this.style.opacity='.25'"></div><div class="svg-bag-info"><div class="svg-bag-brand">${esc(d.brand)} · ${esc(d.cat)}</div><div class="svg-bag-name">${esc(i.name || 'Produto')}</div><div class="svg-bag-desc">${esc(d.desc)}</div><div class="svg-bag-meta"><span>${esc(d.size || 'Produto original')}</span><span>${esc(d.tag)}</span></div><div class="svg-bag-actions"><div class="svg-bag-qty"><button type="button" data-minus="${n}" aria-label="Diminuir quantidade">−</button><span>${qty(i)}</span><button type="button" data-plus="${n}" aria-label="Aumentar quantidade">+</button></div><button type="button" class="svg-bag-remove" data-remove="${n}">Remover</button></div></div><div class="svg-bag-price"><small>Preço por unidade</small><strong>${money(Number(i.price||0)*qty(i))}</strong></div></article>`;
    }).join('') : '<div class="svg-bag-empty"><strong>Sua sacola está vazia</strong>Escolha um produto para começar sua compra.</div>';

    root.querySelectorAll('[data-plus]').forEach(b=>b.onclick=()=>{const x=read(),i=x[+b.dataset.plus];if(i){i.qty=qty(i)+1;localStorage.setItem(KEY,JSON.stringify(x));render();}});
    root.querySelectorAll('[data-minus]').forEach(b=>b.onclick=()=>{const x=read(),i=x[+b.dataset.minus];if(i){i.qty=Math.max(1,qty(i)-1);localStorage.setItem(KEY,JSON.stringify(x));render();}});
    root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const x=read();x.splice(+b.dataset.remove,1);localStorage.setItem(KEY,JSON.stringify(x));render();toast(x.length?'Produto removido':'Sua sacola ficou vazia');});

    const t=total(c);
    if($('drawerSubtotal')) $('drawerSubtotal').textContent=money(t);
    if($('drawerSummaryTotal')) $('drawerSummaryTotal').textContent=money(t);
    if($('cartTotal')) $('cartTotal').textContent=money(t);
    const first=c[0], box=$('drawerSummaryProduct');
    if(box){
      if(!first) box.innerHTML='';
      else { const d=info(first); box.innerHTML=`<img src="${esc(photoUrl(first))}" alt="${esc(first.name||'Produto')}" loading="eager"><div><strong>${esc(first.name||'Produto selecionado')}</strong><small>${qty(first)} unidade(s) · ${money(Number(first.price||0))} por unidade<br>${esc(d.size)} · ${esc(d.tag)}</small></div>`; }
    }
  }

  function openBag(){
    const d=$('drawer'); if(!d || !read().length) return;
    ensureSummary(); render(); d.classList.add('open'); d.setAttribute('aria-hidden','false'); document.body.classList.add('svg-bag-open'); $('overlay')?.classList.add('show');
  }
  function closeBag(){
    const d=$('drawer'); if(!d) return;
    d.classList.remove('open'); d.setAttribute('aria-hidden','true'); document.body.classList.remove('svg-bag-open'); $('overlay')?.classList.remove('show');
  }
  function toast(text){
    let t=document.querySelector('.svg-bag-toast'); if(!t){t=document.createElement('div');t.className='svg-bag-toast';document.body.appendChild(t);}
    t.textContent=text; t.classList.add('show'); clearTimeout(t._timer); t._timer=setTimeout(()=>t.classList.remove('show'),1700);
  }

  function bind(){
    ensureSummary(); render();
    $('cartButton')?.addEventListener('click',()=>setTimeout(openBag,0));
    $('closeCart')?.addEventListener('click',closeBag);
    $('overlay')?.addEventListener('click',closeBag);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeBag();});
    const cart=$('cartItems'); if(cart) new MutationObserver(()=>{setTimeout(()=>{ensureSummary();render();},0)}).observe(cart,{childList:true,subtree:true});
    setInterval(()=>{const c=read(), n=c.reduce((s,i)=>s+qty(i),0); if($('cartCount'))$('cartCount').textContent=n; $('cartButton')?.classList.toggle('has-items',n>0);},700);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
})();
