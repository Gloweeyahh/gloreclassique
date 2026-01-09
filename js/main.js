// ----------------------
// Update Cart UI (Sidebar)
// ----------------------
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const els = [
    document.getElementById('cart-count'),
    document.getElementById('nav-cart-count')
  ];
  els.forEach(el => { if (el) el.textContent = count; });
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div style="text-align:center;color:#aaa;">Your cart is empty.</div>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-thumb">
      <div class="cart-info">
        <div class="cart-title">${item.name}${item.colorName ? ` <span class="cart-color">(${item.colorName})</span>` : ''}</div>
        <div class="cart-meta">₦${item.price.toLocaleString()} x ${item.qty}</div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id}, ${item.colorName ? `'${item.colorName}'` : 'null'})">&times;</button>
    </div>
  `).join('');
}
