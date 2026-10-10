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
let allProducts = [];

// Utility: Get/Set Products
function loadProducts() {
  try {
    const stored = localStorage.getItem('products');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length && parsed.every(product =>
        product && typeof product.id === 'number' && typeof product.name === 'string' &&
        typeof product.price === 'number' && typeof product.image === 'string' &&
        (!product.colors || (Array.isArray(product.colors) && product.colors.every(color =>
          color && typeof color.name === 'string' && typeof color.image === 'string' &&
          typeof color.stock === 'number')))
      )) return parsed;
    }
  } catch (e) {}
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

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-media">
      <span class="ribbon">Sold Out</span>
      <img class="product-img-main" loading="lazy">
      <div class="color-swatches"></div>
    </div>
    <h3></h3>
    <div class="product-meta">
      <span><span class="old-price"></span><span class="price"></span></span>
      <span class="stock"></span>
    </div>
    <div class="product-actions">
      <button type="button" class="btn btn-primary btn-full"></button>
    </div>
  `;
  card.querySelector('h3').textContent = product.name;
  card.querySelector('.price').textContent = `₦${product.price.toLocaleString()}`;
  const oldPrice = card.querySelector('.old-price');
  oldPrice.textContent = product.oldPrice ? `₦${product.oldPrice.toLocaleString()} ` : '';
  const image = card.querySelector('.product-img-main');
  image.alt = product.name;
  const button = card.querySelector('.product-actions button');
  button.dataset.id = product.id;
  const variants = (product.colors || []).map((color, colorIndex) => ({ ...color, colorIndex }))
    .sort((first, second) => (first.stock === 0) - (second.stock === 0));
  let selectedVariant = variants[0];
  const swatches = card.querySelector('.color-swatches');

  function updateVariant() {
    const stock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
    image.src = selectedVariant ? selectedVariant.image : product.image;
    card.querySelector('.stock').textContent = stock > 0 ? `${stock} left` : 'Restock soon';
    card.querySelector('.ribbon').hidden = stock > 0;
    button.disabled = stock <= 0;
    button.textContent = stock > 0 ? 'Add to cart' : 'Sold out';
    swatches.querySelectorAll('button').forEach(swatch => {
      const selected = selectedVariant && Number(swatch.dataset.index) === selectedVariant.colorIndex;
      swatch.classList.toggle('selected', selected);
      swatch.setAttribute('aria-pressed', String(Boolean(selected)));
    });
  }

  variants.forEach(variant => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'color-swatch';
    swatch.title = variant.name;
    swatch.setAttribute('aria-label', `${product.name}: ${variant.name}`);
    swatch.style.background = variant.swatch;
    swatch.dataset.index = variant.colorIndex;
    swatch.addEventListener('click', () => {
      selectedVariant = variant;
      updateVariant();
    });
    swatches.appendChild(swatch);
  });
  button.addEventListener('click', () => {
    const selectedProduct = { ...product };
    if (selectedVariant) {
      selectedProduct.colorName = selectedVariant.name;
      selectedProduct.colorIndex = selectedVariant.colorIndex;
      selectedProduct.image = selectedVariant.image;
    }
    addToCart(selectedProduct);
  });
  updateVariant();
  return card;
}

function renderProducts() {
  const search = document.querySelector('.search-input');
  const query = search ? search.value.trim().toLowerCase() : '';
  const filteredProducts = allProducts.filter(product =>
    `${product.name} ${product.category || ''}`.toLowerCase().includes(query)
  );
  document.querySelectorAll('#shop, #all-products').forEach(grid => {
    const limit = Number.parseInt(grid.dataset.limit, 10);
    const products = limit > 0 ? filteredProducts.slice(0, limit) : filteredProducts;
    grid.replaceChildren(...products.map(createProductCard));
    if (!products.length) {
      const message = document.createElement('p');
      message.className = 'not-found';
      message.textContent = query ? 'No bags match your search.' : 'No products are available right now.';
      grid.appendChild(message);
    }
  });
}

let cartMessageTimeout;
function showAddedToCartMessage(message = 'Added to cart.') {
  let status = document.getElementById('cart-message');
  if (!status) {
    status = document.createElement('div');
    status.id = 'cart-message';
    status.className = 'pill';
    status.setAttribute('role', 'status');
    Object.assign(status.style, { position: 'fixed', bottom: '24px', right: '24px', zIndex: '1000' });
    document.body.appendChild(status);
  }
  status.textContent = message;
  status.style.display = '';
  clearTimeout(cartMessageTimeout);
  cartMessageTimeout = setTimeout(() => { status.style.display = 'none'; }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  allProducts = loadProducts();
  window.products = allProducts;
  renderProducts();
  updateCartCount();
  renderCart();
  const search = document.querySelector('.search-input');
  if (search) search.addEventListener('input', renderProducts);
});
