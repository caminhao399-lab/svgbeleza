(() => {
  const WA = '5513981160171';
  const CART_KEY = 'svgbeleza_cart';
  const LAST_ORDER_KEY = 'svgbeleza_last_order';
  const money = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const getCart = () => { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } };
  const saveLastOrder = () => {
    const items = getCart();
    if (!items.length) return;
    const order = {
      createdAt: new Date().toISOString(),
      items: items.map(i => ({
        id:i.id,
        name:i.name || 'Produto',
        image:i.image || '',
        price:Number(i.price || 0),
        quantity:Number(i.qty || i.quantity || 1),
        instructions:i.instructions || i.howToUse || i.modoUso || '',
        description:i.description || '',
        sourceUrl:i.sourceUrl || i.url || i.link || ''
      })),
      total: items.reduce((s,i) => s + Number(i.price || 0) * Number(i.qty || i.quantity || 1), 0)
    };
    try { localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order)); } catch {}
  };
  const whatsappUrl = (extra='') => `https://wa.me/${WA}?text=${encodeURIComponent(extra)}`;
  const buildMessage = (prefix='Olá! Fiz uma compra na SVG Beleza e estou enviando o comprovante.') => {
    const items = getCart();
    const lines = items.map(i => `• ${i.name || 'Produto'} — ${Number(i.qty || i.quantity || 1)}x`).join('\n');
    const total = items.reduce((s,i) => s + Number(i.price || 0) * Number(i.qty || i.quantity || 1), 0);
    return `${prefix}\n\n${lines || '• Pedido SVG Beleza'}\n\nTotal: ${money(total)}\n\nEnvio o comprovante para conferência, por favor.`;
  };

  const style = document.createElement('style');
  style.textContent = `
    .delivery-card .delivery-store,.delivery-card .delivery-distance,.delivery-card .delivery-disclaimer{display:none!important}
    .delivery-card{padding:18px!important;background:#f2f6f1!important;border:1px solid #d6e1d3!important}
    .delivery-card .delivery-top{display:block!important}
    .delivery-card .delivery-kicker{margin-bottom:3px}
    .delivery-card .delivery-countdown{margin-top:10px!important;padding-top:10px!important}
    .pix-support{display:none;margin:18px 0 0;padding:18px 18px 16px;border:1px solid #c9dfce;border-radius:16px;background:linear-gradient(135deg,#f4faf5,#ffffff);text-align:left}
    .pix-support.show{display:block}
    .pix-support-title{display:flex;align-items:center;gap:10px;font-weight:800;font-size:14px;color:#173a29}
    .pix-support-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e1f1e5;color:#1d7a43;font-size:18px}
    .pix-support p{margin:8px 0 13px;color:#68716c;font-size:11px;line-height:1.5}
    .pix-support button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;background:#1d7a43;color:#fff;padding:11px 16px;font-weight:800;font-size:11px;cursor:pointer;text-decoration:none}
    .pix-support small{display:block;margin-top:8px;color:#8a8d87;font-size:9px}
    .confirmation-whatsapp{display:inline-flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding:12px 18px;border-radius:999px;background:#1d7a43;color:#fff;text-decoration:none;font-weight:800}
    @media(max-width:760px){.pix-support{padding:15px}.confirmation-whatsapp{width:100%}}
  `;
  document.head.appendChild(style);

  const deliveryCard = document.getElementById('deliveryCard');
  if (deliveryCard) {
    const title = document.getElementById('deliveryTitle');
    const countdown = document.getElementById('deliveryCountdown');
    const normalizeDelivery = () => {
      if (!title || !countdown) return;
      if (title.textContent === 'Entrega estimada' || title.textContent === 'Prazo a confirmar' || title.textContent === 'Calculando a rota…' || title.textContent === 'Informe o CEP para calcular') title.textContent = 'Prazo de entrega estimado';
      if (countdown.textContent === 'Consulte as condições no fechamento') countdown.textContent = 'A confirmar';
    };
    normalizeDelivery();
    new MutationObserver(normalizeDelivery).observe(deliveryCard, { childList:true, subtree:true, characterData:true });
  }

  const payment = document.getElementById('pixPayment');
  if (payment) {
    const note = payment.querySelector('.pix-note');
    const support = document.createElement('div');
    support.className = 'pix-support';
    support.innerHTML = `<div class="pix-support-title"><span class="pix-support-icon">✓</span><span>Pagamento já realizado?</span></div><p>Se o pagamento não aparecer como confirmado após alguns instantes, envie o comprovante pelo WhatsApp para conferência.</p><button type="button" id="pixWhatsappBtn">Enviar comprovante pelo WhatsApp →</button><small>Atendimento SVG Beleza · (13) 98116-0171</small>`;
    if (note) note.insertAdjacentElement('afterend', support); else payment.appendChild(support);
    document.getElementById('pixWhatsappBtn')?.addEventListener('click', () => window.open(whatsappUrl(buildMessage()), '_blank', 'noopener'));

    let supportTimer = null;
    const showSupportLater = () => {
      if (supportTimer) clearTimeout(supportTimer);
      support.classList.remove('show');
      supportTimer = setTimeout(() => support.classList.add('show'), 30000);
    };
    const observer = new MutationObserver(() => {
      if (payment.classList.contains('show')) showSupportLater();
    });
    observer.observe(payment, { attributes:true, attributeFilter:['class'] });

    const success = document.getElementById('pixSuccess');
    if (success) {
      new MutationObserver(() => {
        if (success.classList.contains('show')) {
          saveLastOrder();
          support.classList.remove('show');
        }
      }).observe(success, { attributes:true, attributeFilter:['class'] });
    }
  }
})();
