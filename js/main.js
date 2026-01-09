// --- Cart & Product Logic ---

// Utility: Get/Set Cart
window.getCart = function() {
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  } catch (e) {
    return [];
  }
};

window.setCart = function(newCart) {
  cart = newCart;
  saveCart();
  updateCartCount();
  renderCart();
};

let cart = window.getCart();

// Utility: Get/Set Products
function loadProducts() {
  const stored = localStorage.getItem('products');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      window.products = parsed;
      return parsed;
    } catch (e) {}
  }
  return window.products || [];
}
function saveProducts(products) {
  localStorage.setItem('products', JSON.stringify(products));
}

// --- PATCHED saveCart ---
function saveCart() {
  // Save only items with qty > 0
  const filteredCart = cart.filter(item => item.qty > 0);
  localStorage.setItem('cart', JSON.stringify(filteredCart));
}

// Cart Count UI
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  [document.getElementById('cart-count'), document.getElementById('nav-cart-count')].forEach(el => {
    if (el) el.textContent = count;
  });
}

// Cart Sidebar UI
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
        <div class="cart-title">${item.name}${item.colorName ? ` <span class='cart-color'>(${item.colorName})</span>` : ''}</div>
        <div class="cart-meta">₦${item.price.toLocaleString()} x ${item.qty}</div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id}, ${item.colorName ? `'${item.colorName.replace(/'/g, "\\'")}'` : 'null'})">&times;</button>
    </div>
  `).join('');
}

// Add to Cart (handles variants)
function addToCart(product) {
  const idx = cart.findIndex(i => i.id === product.id && (i.colorName || null) === (product.colorName || null));
  let availableStock = null;
  const prodData = allProducts.find(p => p.id === product.id);
  if (prodData && product.colorName && prodData.colors) {
    const colorObj = prodData.colors.find(c => c.name === product.colorName);
    if (colorObj) availableStock = colorObj.stock;
  } else if (prodData && !product.colorName) {
    availableStock = prodData.stock || 0;
  }
  let currentQty = idx > -1 ? cart[idx].qty : 0;
  if (availableStock !== null && currentQty >= availableStock) {
    showAddedToCartMessage('Cannot add more than available stock.');
    return;
  }
  if (idx > -1) {
    cart[idx].qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  updateCartCount();
  renderCart();
  showAddedToCartMessage();
}

// Remove from Cart
function removeFromCart(id, colorName) {
  cart = cart.filter(i => {
    if (i.id !== id) return true;
    if ((i.colorName || null) !== (colorName || null)) return true;
    return false;
  });
  saveCart();
  updateCartCount();
  renderCart();
}

// Cart Sidebar Toggle
function toggleCart() {
  const sidebar = document.querySelector('.cart-sidebar');
  const overlay = document.querySelector('.cart-overlay');
  if (sidebar) sidebar.classList.toggle('active');
  if (overlay) overlay.classList.toggle('active');
}

// Checkout: Decrement stock, clear cart, update UI/storage
function checkoutCart() {
  cart.forEach(item => {
    const prod = allProducts.find(p => p.id === item.id);
    if (prod && item.colorName && prod.colors) {
      const colorObj = prod.colors.find(c => c.name === item.colorName);
      if (colorObj) colorObj.stock = Math.max(0, colorObj.stock - item.qty);
    } else if (prod && !item.colorName && prod.stock !== undefined) {
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  });
  saveProducts(allProducts);
  window.products = allProducts;
  cart = [];
  saveCart(); // uses patched saveCart
  updateCartCount();
  renderCart();
  allProducts = loadProducts();
  window.products = allProducts;
  renderProducts();
  window.dispatchEvent(new Event('storage'));
  showAddedToCartMessage('Checkout complete! Stock updated.');
}

// Product Rendering (unchanged, omitted for brevity)
// ... keep all your renderProducts, color swatch, search, etc. as-is ...
