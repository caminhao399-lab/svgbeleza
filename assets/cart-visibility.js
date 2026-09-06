(() => {
  const KEY='svgbeleza_cart';
  const drawer=()=>document.getElementById('drawer');
  const overlay=()=>document.getElementById('overlay');
  const hasItems=()=>{try{const c=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(c)&&c.some(i=>Number(i?.qty||1)>0)}catch{return false}};
  const sync=()=>{
    const empty=!hasItems();
    const d=drawer(),o=overlay();
    if(d){d.classList.toggle('cart-empty-locked',empty);d.setAttribute('aria-hidden',empty?'true':d.getAttribute('aria-hidden')||'true');d.style.visibility=empty?'hidden':'';d.style.pointerEvents=empty?'none':'';}
    if(o){o.classList.toggle('cart-empty-locked',empty);o.style.visibility=empty?'hidden':'';o.style.pointerEvents=empty?'none':'';}
  };
  const button=document.getElementById('cartButton');
  if(button)button.addEventListener('click',e=>{if(!hasItems()){e.preventDefault();e.stopImmediatePropagation();sync();}},true);
  sync();
  let last='';
  setInterval(()=>{let now='';try{now=localStorage.getItem(KEY)||''}catch{}if(now!==last){last=now;sync()}},200);
  window.addEventListener('storage',e=>{if(e.key===KEY)sync()});
})();
