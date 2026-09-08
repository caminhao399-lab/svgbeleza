(() => {
  const card = document.getElementById('deliveryCard');
  if (!card) return;

  const title = document.getElementById('deliveryTitle');
  const countdown = document.getElementById('deliveryCountdown');
  if (!countdown) return;

  const getCepInput = () => document.querySelector('#pixCep, #cep, input[autocomplete="postal-code"], input[name*="cep" i], input[placeholder*="CEP" i]');
  const getStateInput = () => document.querySelector('#pixState, #state, input[name*="estado" i], input[name*="state" i]');

  function businessDate(base, days) {
    const d = new Date(base);
    let left = days;
    while (left > 0) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      if (day !== 0 && day !== 6) left--;
    }
    return d;
  }

  function formatDate(d) {
    return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'long' });
  }

  function estimateForAddress() {
    const cep = (getCepInput()?.value || '').replace(/\D/g, '');
    const state = (getStateInput()?.value || '').trim().toUpperCase();
    if (cep.length !== 8) return;

    // Mantém qualquer cálculo de rota já concluído pelo checkout.
    const current = (countdown.textContent || '').trim().toLowerCase();
    if (current && !/a confirmar|consulte|calculando|não foi possível|indisponível/.test(current)) return;

    let min = 4, max = 8;
    const first = Number(cep[0]);
    if (state === 'SP' || first === 0 || first === 1) { min = 3; max = 6; }
    else if (['RJ','ES','MG'].includes(state) || [2,3].includes(first)) { min = 4; max = 8; }
    else if (['PR','SC','RS'].includes(state) || first === 8 || first === 9) { min = 5; max = 9; }
    else if (['BA','SE','PE','AL','PB','RN','CE','PI','MA'].includes(state) || [4,5,6].includes(first)) { min = 6; max = 10; }
    else { min = 6; max = 12; }

    const start = businessDate(new Date(), min);
    const end = businessDate(new Date(), max);
    if (title) title.textContent = 'Prazo de entrega estimado';
    countdown.innerHTML = `<strong>${formatDate(start)} a ${formatDate(end)}</strong><span>para este endereço</span>`;
    card.classList.remove('loading');
  }

  estimateForAddress();
  const observer = new MutationObserver(() => estimateForAddress());
  observer.observe(card, { childList:true, subtree:true, characterData:true });
  document.addEventListener('input', event => {
    if (event.target === getCepInput() || event.target === getStateInput()) estimateForAddress();
  }, true);
  document.addEventListener('change', event => {
    if (event.target === getCepInput() || event.target === getStateInput()) estimateForAddress();
  }, true);
})();
