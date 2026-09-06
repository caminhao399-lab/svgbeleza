const cart = JSON.parse(localStorage.getItem("fiosvita_cart") || "[]");
const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const save = () => { localStorage.setItem("fiosvita_cart",JSON.stringify(cart)); renderCart(); };
function renderCart(){
  const count = document.querySelector("#cartCount");
  const items = document.querySelector("#cartItems");
  const total = document.querySelector("#cartTotal");
  if(!count) return;
  count.textContent = cart.reduce((s,i)=>s+i.qty,0);
  if(!cart.length){ items.innerHTML='<p class="muted">Seu carrinho está vazio.</p>'; total.textContent=money(0); return; }
  items.innerHTML = cart.map((i,idx)=>`<div class="drawer-item"><div><b>${i.name}</b><div>${i.qty} × ${money(i.price)}</div></div><button class="remove" data-remove="${idx}">remover</button></div>`).join("");
  total.textContent = money(cart.reduce((s,i)=>s+i.price*i.qty,0));
  items.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);save();});
}
document.querySelectorAll("[data-buy]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const card=btn.closest(".product");
    const item={id:card.dataset.id,name:card.dataset.name,price:Number(card.dataset.price),qty:1};
    const existing=cart.find(x=>x.id===item.id);
    if(existing) existing.qty++; else cart.push(item);
    save(); openCart();
  });
});
function openCart(){document.querySelector("#drawer").classList.add("open");document.querySelector("#overlay").classList.add("show");document.querySelector("#drawer").setAttribute("aria-hidden","false");}
function closeCart(){document.querySelector("#drawer").classList.remove("open");document.querySelector("#overlay").classList.remove("show");document.querySelector("#drawer").setAttribute("aria-hidden","true");}
document.querySelector("#cartButton")?.addEventListener("click",openCart);
document.querySelector("#closeCart")?.addEventListener("click",closeCart);
document.querySelector("#overlay")?.addEventListener("click",closeCart);
document.querySelector("#checkoutButton")?.addEventListener("click",()=>{
  if(!cart.length){alert("Adicione um produto ao carrinho.");return;}
  alert("Checkout preparado. O próximo passo é conectar seu gateway Pix/cartão no backend, com webhook para confirmação automática.");
});
document.querySelector("#quizForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  const q1=document.querySelector("#q1").value;
  const result=document.querySelector("#quizResult");
  const map={dry:"Comece pelo Kit Hidratação Essencial e complemente com uma máscara de nutrição.",frizz:"Uma rotina com Leave-in Anti-Frizz e hidratação pode ser um bom ponto de partida.",curly:"Para cachos, comece pelo Creme Definição de Cachos e mantenha hidratação regular."};
  result.textContent=map[q1];
});
renderCart();