(function() {
  'use strict';

  function money(amount) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount / 100);
  }

  function showStatus(element, message, error) {
    element.textContent = message;
    element.classList.toggle('is-error', Boolean(error));
  }

  function summary(container, items, amount, reference) {
    container.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Your order';
    container.append(heading);
    if (reference) {
      const label = document.createElement('p');
      label.className = 'payment-reference';
      label.textContent = reference;
      container.append(label);
    }
    items.forEach(function(item) {
      const row = document.createElement('div');
      row.className = 'payment-summary-item';
      const image = document.createElement('img');
      image.src = item.image;
      image.alt = item.name;
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = item.name;
      const variant = document.createElement('p');
      variant.textContent = (item.colorName || '') + ' · Qty ' + item.qty;
      const price = document.createElement('span');
      price.textContent = money(item.price * item.qty * 100);
      details.append(title, variant, price);
      row.append(image, details);
      container.append(row);
    });
    const total = document.createElement('p');
    total.className = 'payment-total';
    total.textContent = 'Total ' + money(amount);
    const delivery = document.createElement('p');
    delivery.className = 'payment-note';
    delivery.textContent = 'Delivery costs are confirmed separately by the store and are not included in this payment.';
    container.append(total, delivery);
  }

  async function api(name, options) {
    let response;
    try {
      response = await fetch('/.netlify/functions/' + name, Object.assign({ cache: 'no-store' }, options));
    } catch (error) {
      throw new Error('Connection interrupted. Your cart is safe. Please try again.');
    }
    let data;
    try { data = await response.json(); } catch (error) { throw new Error('Payment service is unavailable. Please try again shortly.'); }
    if (!response.ok) throw new Error(data.error || 'Could not complete your request. Please try again.');
    return data;
  }

  function startCheckout() {
    const form = document.getElementById('checkout-form');
    const status = document.getElementById('checkout-status');
    const button = form.querySelector('button[type="submit"]');
    let submitting = false;
    function render() {
      const items = window.getCart().filter(function(item) { return item.qty > 0; });
      summary(document.getElementById('checkout-summary'), items, items.reduce(function(total, item) { return total + item.price * item.qty * 100; }, 0));
      button.disabled = submitting || items.length === 0;
      if (!items.length) showStatus(status, 'Your cart is empty. Add a bag from the shop to continue.', true);
      else if (!submitting) showStatus(status, '');
    }
    render();
    window.addEventListener('storage', render);
    window.addEventListener('cart-updated', render);
    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (button.disabled) return;
      submitting = true;
      button.disabled = true;
      button.textContent = 'Saving your order…';
      showStatus(status, 'Checking your items and preparing payment.');
      try {
        sessionStorage.setItem('payment-storage-check', 'ok');
        sessionStorage.removeItem('payment-storage-check');
        const customer = Object.fromEntries(new FormData(form).entries());
        const data = await api('create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer, items: window.getCart() }) });
        sessionStorage.setItem('order-token-' + data.order.id, data.token);
        window.location.assign('payment.html?order=' + encodeURIComponent(data.order.id));
      } catch (error) {
        submitting = false;
        showStatus(status, error.message || 'Please enable browser storage and try again.', true);
        button.disabled = window.getCart().length === 0;
        button.textContent = 'Continue to payment';
      }
    });
  }

  async function startPayment() {
    const parameters = new URLSearchParams(window.location.search);
    const id = parameters.get('order');
    const status = document.getElementById('payment-status');
    const content = document.getElementById('payment-content');
    const payButton = document.getElementById('paystack-button');
    const verifyButton = document.getElementById('verify-button');
    const bankOption = document.getElementById('bank-option');
    const proofForm = document.getElementById('proof-form');
    const proofButton = proofForm.querySelector('button[type="submit"]');
    let token;
    let busy = false;
    let currentOrder;
    try { token = id && sessionStorage.getItem('order-token-' + id); } catch (error) {}
    if (!id || !token) {
      showStatus(status, 'Return to checkout to create an order, or reopen this payment page in the same browser tab used for checkout.', true);
      return;
    }
    function options(body) {
      return { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Order-Token': token }, body: JSON.stringify(body) };
    }
    function setBusy(value) {
      busy = value;
      payButton.disabled = value || !currentOrder || !currentOrder.onlineAvailable || currentOrder.status !== 'pending';
      proofButton.disabled = value || !currentOrder || currentOrder.status !== 'pending' || currentOrder.method === 'paystack';
      verifyButton.disabled = value;
    }
    function render(order) {
      currentOrder = order;
      content.hidden = false;
      summary(document.getElementById('payment-summary'), order.items, order.amount, order.id);
      document.getElementById('paystack-note').textContent = order.onlineAvailable ? 'Payment is confirmed automatically after verification.' : 'Online payments are not available yet. Bank transfer is still available.';
      if (order.status === 'paid') {
        showStatus(status, 'Payment confirmed. Thank you! Keep your order reference for any enquiries.');
        payButton.hidden = true;
        verifyButton.hidden = true;
        bankOption.hidden = true;
        if (!sessionStorage.getItem('order-cleared-' + order.id)) {
          const remaining = window.getCart().map(function(item) {
            const purchased = order.items.find(function(paid) { return paid.id === item.id && paid.colorName === item.colorName; });
            return Object.assign({}, item, { qty: Math.max(0, item.qty - (purchased ? purchased.qty : 0)) });
          }).filter(function(item) { return item.qty > 0; });
          window.setCart(remaining);
          sessionStorage.setItem('order-cleared-' + order.id, 'yes');
        }
      } else if (order.status === 'awaiting_review') {
        showStatus(status, 'Receipt received. Your bank transfer is awaiting store review; this is not yet a payment confirmation. Keep your order reference.');
        payButton.hidden = true;
        verifyButton.hidden = true;
        bankOption.hidden = true;
      } else {
        showStatus(status, 'Choose your payment method below.');
        bankOption.hidden = order.method === 'paystack';
        verifyButton.hidden = order.method !== 'paystack';
      }
      setBusy(false);
    }
    async function verify() {
      if (busy) return;
      setBusy(true);
      showStatus(status, 'Verifying your payment with Paystack…');
      try {
        const data = await api('verify-payment', options({ id }));
        render(data.order);
        if (data.order.status !== 'paid') showStatus(status, 'Payment is not confirmed yet. Complete the Paystack checkout or check again shortly. Do not make a second transfer.');
      } catch (error) { showStatus(status, error.message, true); }
      finally { setBusy(false); }
    }
    payButton.addEventListener('click', async function() {
      if (busy) return;
      setBusy(true);
      payButton.textContent = 'Opening Paystack…';
      showStatus(status, 'Connecting to secure checkout…');
      try {
        const data = await api('initialize-payment', options({ id }));
        const destination = new URL(data.authorizationUrl);
        if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.paystack.com') throw new Error('Unexpected payment destination. Please contact the store.');
        window.location.assign(destination.toString());
      } catch (error) {
        showStatus(status, error.message, true);
        payButton.textContent = 'Pay with Paystack';
        try {
          const data = await api('get-order?id=' + encodeURIComponent(id), { headers: { 'X-Order-Token': token } });
          currentOrder = data.order;
          bankOption.hidden = currentOrder.method === 'paystack';
          verifyButton.hidden = currentOrder.method !== 'paystack';
        } catch (refreshError) {}
        setBusy(false);
      }
    });
    verifyButton.addEventListener('click', verify);
    proofForm.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (busy) return;
      const file = document.getElementById('proofFile').files[0];
      if (!file || file.size > 3 * 1024 * 1024) { showStatus(status, 'Choose a JPG, PNG, or PDF smaller than 3 MB.', true); return; }
      setBusy(true);
      proofButton.textContent = 'Uploading receipt…';
      const form = new FormData();
      form.set('id', id);
      form.set('proofFile', file);
      try {
        const data = await api('send-proof', { method: 'POST', headers: { 'X-Order-Token': token }, body: form });
        render(data.order);
        proofForm.reset();
      } catch (error) { showStatus(status, error.message, true); }
      finally { setBusy(false); proofButton.textContent = 'Send Proof'; }
    });
    try {
      const data = await api('get-order?id=' + encodeURIComponent(id), { headers: { 'X-Order-Token': token } });
      render(data.order);
      if (parameters.has('reference') || parameters.has('trxref') || data.order.method === 'paystack' && data.order.status === 'pending') await verify();
    } catch (error) { showStatus(status, error.message, true); }
  }

  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('checkout-form')) startCheckout();
    if (document.getElementById('payment-status')) startPayment();
  });
})();
