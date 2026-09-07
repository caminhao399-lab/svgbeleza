(() => {
  const KEY='svgbeleza_cart';
  const $=id=>document.getElementById(id);
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const qty=i=>Math.max(1,Number(i?.qty||i?.quantity||1));
  const sku=i=>String(i?.id||'').split('-').pop();
  const src=i=>i?.image||((/^\d+$/.test(sku(i)))?`https://images.rede.natura.net/image/sku/1200x1200/${sku(i)}_1.jpg`:'');
  const info=i=>{const n=String(i?.name||'');const size=i?.size||((n.match(/\b\d+(?:[.,]\d+)?\s*(?:ml|g|kg|unidades?)\b/i)||[])[0]||'');return{brand:i?.brand||'Lumina',size,tag:i?.tag||'Cuidados capilares',desc:i?.desc||'Produto selecionado para sua rotina de cuidados capilares.'}};
  const css=document.createElement('style');css.id='svg-summary-fix';css.textContent=`
    .drawer.svg-premium-bag .drawer-summary-product{display:none!important}
    .drawer.svg-premium-bag .svg-summary-items{display:flex!important;flex-direction:column!important;gap:10px!important;margin:0 0 18px!important}
    .drawer.svg-premium-bag .svg-summary-item{display:grid!important;grid-template-columns:72px minmax(0,1fr) auto!important;gap:11px!important;align-items:center!important;padding:10px!important;background:#fff!important;border:1px solid #ddd7ce!important;border-radius:13px!important;min-width:0!important}
    .drawer.svg-premium-bag .svg-summary-item img{width:72px!important;height:78px!important;object-fit:contain!important;padding:4px!important;background:#f5f1ea!important;border-radius:9px!important;display:block!important}
    .drawer.svg-premium-bag .svg-summary-item-info{min-width:0!important}
    .drawer.svg-premium-bag .svg-summary-item-brand{font-size:8px!important;letter-spacing:.14em!important;text-transform:uppercase!important;color:#8a8177!important;margin-bottom:4px!important}
    .drawer.svg-premium-bag .svg-summary-item-name{font-size:11px!important;line-height:1.32!important;font-weight:700!important;color:#202a24!important}
    .drawer.svg-premium-bag .svg-summary-item-meta{font-size:8px!important;line-height:1.45!important;color:#777169!important;margin-top:5px!important}
    .drawer.svg-premium-bag .svg-summary-item-total{text-align:right!important;white-space:nowrap!important}.drawer.svg-premium-bag .svg-summary-item-total strong{display:block!important;font-size:11px!important;color:#202a24!important}.drawer.svg-premium-bag .svg-summary-item-total small{display:block!important;margin-top:3px!important;font-size:7px!important;color:#8a8177!important}
    @media(max-width:820px){.drawer.svg-premium-bag .svg-summary-items{display:flex!important;max-height:180px!important;overflow:auto!important}.drawer.svg-premium-bag .svg-summary-item{grid-template-columns:52px minmax(0,1fr) auto!important;padding:7px!important}.drawer.svg-premium-bag .svg-summary-item img{width:52px!important;height:58px!important}.drawer.svg-premium-bag .svg-summary-item-name{font-size:9px!important}.drawer.svg-premium-bag .svg-summary-item-meta{font-size:7px!important}.drawer.svg-premium-bag .svg-summary-item-total strong{font-size:9px!important}}
  `;document.head.appendChild(css);
  function render(){
    const d=$('drawer');if(!d)return;let s=d.querySelector('.drawer-summary');if(!s)return;let list=s.querySelector('.svg-summary-items');if(!list){list=document.createElement('div');list.className='svg-summary-items';const h=s.querySelector('h3');(h?h.nextElementSibling:s.firstChild)?.after?.(list);if(!list.parentNode) s.prepend(list)}
    const cart=read();
    list.innerHTML=cart.map(i=>{const x=info(i),p=src(i),q=qty(i),line=Number(i.price||0)*q;return `<div class="svg-summary-item"><img src="${esc(p)}" alt="${esc(i.name||'Produto')}" loading="eager"><div class="svg-summary-item-info"><div class="svg-summary-item-brand">${esc(x.brand)}</div><div class="svg-summary-item-name">${esc(i.name||'Produto')}</div><div class="svg-summary-item-meta">${q} × ${money(i.price)}${x.size?' · '+esc(x.size):''}${x.tag?' · '+esc(x.tag):''}</div></div><div class="svg-summary-item-total"><strong>${money(line)}</strong><small>total do item</small></div></div>`}).join('');
    if($('drawerSubtotal'))$('drawerSubtotal').textContent=money(cart.reduce((a,i)=>a+Number(i.price||0)*qty(i),0));
    if($('drawerSummaryTotal'))$('drawerSummaryTotal').textContent=money(cart.reduce((a,i)=>a+Number(i.price||0)*qty(i),0));
    list.querySelectorAll('img').forEach(img=>{img.addEventListener('error',()=>{const item=cart.find(i=>(i.name||'')===img.alt);const fallback=item?.image;if(fallback&&img.src!==fallback)img.src=fallback;else img.style.visibility='hidden'},{once:true})});
  }
  function bind(){render();setInterval(render,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();