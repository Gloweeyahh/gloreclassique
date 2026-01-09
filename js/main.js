// --- Cart & Product Logic ---

// Utility: Get/Set Cart
window.getCart = function() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
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
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Cart Count UI
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  [document.getElementById('cart-count'), document.getElementById('nav-cart-count')].forEach(el => {
    if (el) el.textContent = count;
  });
  // Nav close button
  const closeBtn = document.querySelector('.side-nav .close-nav');
  if (closeBtn) closeBtn.onclick = () => toggleNav(false);
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

// Cart Notification
function showAddedToCartMessage(message) {
  let msg = document.getElementById('added-to-cart-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'added-to-cart-msg';
    msg.className = 'added-to-cart-msg';
    document.body.appendChild(msg);
  }
  msg.textContent = message || 'Added to cart!';
  msg.style.opacity = '1';
  msg.style.display = 'block';
  setTimeout(() => {
    msg.style.opacity = '0';
    setTimeout(() => { msg.style.display = 'none'; }, 400);
  }, 1200);
}

// Add to Cart (handles variants)
function addToCart(product) {
  const idx = cart.findIndex(i => i.id === product.id && (i.colorName || null) === (product.colorName || null));
  // Find available stock for this color/variant
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
function continueShopping() { toggleCart(); }

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
  saveCart();
  updateCartCount();
  renderCart();
  allProducts = loadProducts();
  window.products = allProducts;
  renderProducts();
  // Sync across tabs
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('products', JSON.stringify(allProducts));
  window.dispatchEvent(new Event('storage'));
  showAddedToCartMessage('Checkout complete! Stock updated.');
}

// --- Product List & Search ---

document.addEventListener('DOMContentLoaded', function() {
  // Hamburger alignment fix
  const wrap = document.querySelector('.hamburger-wrap');
  if (wrap) wrap.style.alignItems = 'flex-start';
});

const shop = document.getElementById('shop');
const searchInput = document.querySelector('.search-input');
let allProducts = [];

function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get('category');
}

function formatPrice(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
}

function renderProducts(filter = "") {
  if (!shop) return;
  const category = getCategory();
  const limit = shop.dataset.limit ? parseInt(shop.dataset.limit, 10) : null;
  let list = category ? allProducts.filter(p => p.category === category) : allProducts.slice();
  if (filter) {
    list = list.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  }
  if (limit && list.length > limit) list = list.slice(0, limit);
  shop.innerHTML = "";
  if (list.length === 0) {
    shop.innerHTML = '<div class="not-found">Bag not found</div>';
    return;
  }
  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    // Sort colors: available first
    let sortedColors = [];
    if (product.colors && product.colors.length > 0) {
      sortedColors = [...product.colors].sort((a, b) => (a.stock === 0) - (b.stock === 0));
    }
    let selectedColor = 0;
    let colorStock = sortedColors.length > 0 ? sortedColors[0].stock : 0;
    let soldOut = colorStock === 0;
    // Color swatches
    let swatchHtml = "";
    if (sortedColors.length > 0) {
      swatchHtml = `<div class="color-swatches">${sortedColors.map((c, i) => `<span class="color-swatch" title="${c.name}" style="background:${c.swatch};" data-img="${c.image}" data-index="${i}"></span>`).join("")}</div>`;
    }
    // Price display
    let priceHtml = `<span class="price">${formatPrice(product.price)}</span>`;
    if (product.oldPrice) {
      priceHtml = `<span class="old-price">${formatPrice(product.oldPrice)}</span> <span class="price">${formatPrice(product.price)}</span>`;
    }
    card.innerHTML = `
      <div class="product-media">
        <span class="ribbon" style="display:${soldOut ? 'inline-block' : 'none'}">Sold Out</span>
        <img src="${sortedColors.length > 0 ? sortedColors[0].image : product.image}" alt="${product.name}" class="product-img-main">
        ${swatchHtml}
      </div>
      <h3>${product.name}</h3>
      <div class="product-meta">
        ${priceHtml}
        <span class="stock">${soldOut ? "Restock soon" : `${colorStock} left`}</span>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-full" ${soldOut ? "disabled" : ""} data-id="${product.id}">${soldOut ? "Sold out" : "Add to cart"}</button>
      </div>
    `;
    // Color swatch logic
    const imgEl = card.querySelector('.product-img-main');
    const swatches = card.querySelectorAll('.color-swatch');
    const stockEl = card.querySelector('.stock');
    const button = card.querySelector('button');
    const ribbon = card.querySelector('.ribbon');
    if (swatches.length) {
      swatches.forEach((swatch, i) => {
        if (i === 0) swatch.classList.add('selected');
        swatch.addEventListener('click', function() {
          swatches.forEach(s => s.classList.remove('selected'));
          swatch.classList.add('selected');
          selectedColor = i;
          imgEl.src = sortedColors[i].image;
          colorStock = sortedColors[i].stock;
          stockEl.textContent = colorStock === 0 ? "Restock soon" : `${colorStock} left`;
          if (colorStock === 0) {
            button.disabled = true;
            button.textContent = "Sold out";
            ribbon.style.display = 'inline-block';
          } else {
            button.disabled = false;
            button.textContent = "Add to cart";
            ribbon.style.display = 'none';
          }
        });
      });
    }
    // Set initial button/ribbon state
    if (soldOut) {
      button.disabled = true;
      button.textContent = "Sold out";
      if (ribbon) ribbon.style.display = 'inline-block';
    } else {
      button.disabled = false;
      button.textContent = "Add to cart";
      if (ribbon) ribbon.style.display = 'none';
      button.onclick = () => {
        let prodToCart = {
          id: product.id,
          name: product.name,
          price: product.price,
          oldPrice: product.oldPrice,
          image: sortedColors.length ? sortedColors[selectedColor].image : product.image,
          colorName: sortedColors.length ? sortedColors[selectedColor].name : undefined,
          qty: 1
        };
        addToCart(prodToCart);
      };
    }
    shop.appendChild(card);
  });
}

// --- Initialization ---

function initProductSearch() {
  allProducts = loadProducts();
  window.products = allProducts;
  if (!allProducts || !Array.isArray(allProducts)) {
    allProducts = window.products;
  }
  renderProducts();
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      renderProducts(this.value);
    });
  }
}
initProductSearch();

// Listen for storage changes (cart/products) and reload products/cart in all tabs
window.addEventListener('storage', function(e) {
  if (e.key === 'products') {
    allProducts = loadProducts();
    window.products = allProducts;
    renderProducts();
  }
  if (e.key === 'cart') {
    cart = window.getCart();
    updateCartCount();
    renderCart();
  }
});
