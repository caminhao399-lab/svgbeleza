(() => {
  const style = document.createElement('style');
  style.id = 'svg-site-final-polish';
  style.textContent = `
    .announcement:before,.announcement:after{display:none!important;content:none!important}
    .announcement{justify-content:center!important;font-size:9px!important;letter-spacing:.08em!important}
    .product-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:16px!important}
    .product{border-radius:10px!important;background:#fff!important}
    .product-visual{height:285px!important;background:#f5f2ed!important}
    .product-body{padding:16px!important}
    .product h3{font-size:13px!important;line-height:1.35!important;min-height:52px!important}
    .product p{font-size:10px!important;min-height:42px!important}
    .buy{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;align-items:stretch!important}
    .buy strong{font-size:17px!important}
    .add{width:100%!important;height:40px!important;border-radius:999px!important;padding:0 16px!important;font-size:11px!important;letter-spacing:.01em!important}
    .add:after{content:none!important}
    .category-tab{min-height:225px!important}
    .search{box-shadow:0 4px 14px rgba(45,36,27,.04)!important}
    @media(max-width:1000px){.product-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}}
    @media(max-width:760px){.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.product-visual{height:220px!important}.product-body{padding:12px!important}.product h3{font-size:11px!important;min-height:46px!important}.product p{font-size:9px!important;min-height:38px!important}.add{height:38px!important;font-size:10px!important}}
  `;
  document.head.appendChild(style);
  const rename = () => document.querySelectorAll('.add').forEach(b => { if (b.textContent.trim() === 'Adicionar') b.textContent = 'Adicionar à sacola'; });
  rename();
  new MutationObserver(rename).observe(document.getElementById('productGrid') || document.body,{childList:true,subtree:true});
})();
