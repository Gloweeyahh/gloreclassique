// --- Cart Logic ---
// Expose getCart/setCart globally
window.getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
window.setCart = (newCart) => {
  cart = newCart;
  saveCart();
  updateCartCount();
  renderCart();
};

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let allProducts = [];

// ----------------------
// Product Persistence
// ----------------------
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
  window.products = products;
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ----------------------
// Cart Rendering
// ----------------------
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  [document.getElementById('cart-count'), document.getElementById('nav-cart-count')]
    .forEach(el => { if (el) el.textContent = count; });
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
        <div class="cart-title">${item.name}${item.colorName ? ` <span class='cart-color'>(${item.colorName})</span>` : ''}</div>
        <div class="cart-meta">₦${item.price.toLocaleString()} x ${item.qty}</div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id}, ${item.colorName ? `'${item.colorName}'` : 'null'})">&times;</button>
    </div>
  `).join('');
}

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
  setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => { msg.style.display = 'none'; }, 400); }, 1200);
}

// ----------------------
// Cart Operations
// ----------------------
function addToCart(product) {
  const idx = cart.findIndex(i => i.id === product.id && (i.colorName || null) === (product.colorName || null));
  const prodData = allProducts.find(p => p.id === product.id);
  let availableStock = null;

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

  if (idx > -1) cart[idx].qty += 1;
  else cart.push({ ...product, qty: 1 });

  saveCart();
  updateCartCount();
  renderCart();
  showAddedToCartMessage();
}

function removeFromCart(id, colorName) {
  cart = cart.filter(i => !(i.id === id && (i.colorName || null) === (colorName || null)));
  saveCart();
  updateCartCount();
  renderCart();
}

function toggleCart() {
  const sidebar = document.querySelector('.cart-sidebar');
  const overlay = document.querySelector('.cart-overlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

function continueShopping() {
  toggleCart();
}

// ----------------------
// Checkout
// ----------------------
function checkoutCart() {
  cart.forEach(item => {
    const prod = allProducts.find(p => p.id === item.id);
    if (!prod) return;

    if (item.colorName && prod.colors) {
      const colorObj = prod.colors.find(c => c.name === item.colorName);
      if (colorObj) colorObj.stock = Math.max(0, colorObj.stock - item.qty);
    } else if (!item.colorName && prod.stock !== undefined) {
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  });

  saveProducts(allProducts);

  cart = [];
  saveCart();
  updateCartCount();
  renderCart();

  renderProducts(); // Re-render shop with updated stock

  // Broadcast changes to other tabs
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('products', JSON.stringify(allProducts));
  window.dispatchEvent(new Event('storage'));

  showAddedToCartMessage('Checkout complete! Stock updated.');
}

// ----------------------
// Shop Rendering
// ----------------------
const shop = document.getElementById("shop");
const searchInput = document.querySelector('.search-input');

function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
}

function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function renderProducts(filter = "") {
  if (!shop) return;

  const category = getCategory();
  const limit = shop.dataset.limit ? parseInt(shop.dataset.limit, 10) : null;

  let list = category ? allProducts.filter(p => p.category === category) : allProducts.slice();
  if (filter) list = list.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  if (limit && list.length > limit) list = list.slice(0, limit);

  shop.innerHTML = "";

  if (list.length === 0) {
    shop.innerHTML = '<div class="not-found">Bag not found</div>';
    return;
  }

  list.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    let sortedColors = product.colors ? [...product.colors].sort((a, b) => (a.stock === 0) - (b.stock === 0)) : [];
    let selectedColor = 0;
    let colorStock = sortedColors.length ? sortedColors[0].stock : (product.stock || 0);
    let soldOut = colorStock === 0;

    let swatchHtml = "";
    if (sortedColors.length) {
      swatchHtml = `<div class="color-swatches">${sortedColors.map((c, i) =>
        `<span class="color-swatch" title="${c.name}" style="background:${c.swatch}" data-img="${c.image}" data-index="${i}"></span>`).join('')}</div>`;
    }

    let priceHtml = `<span class="price">${formatPrice(product.price)}</span>`;
    if (product.oldPrice) priceHtml = `<span class="old-price">${formatPrice(product.oldPrice)}</span> <span class="price">${formatPrice(product.price)}</span>`;

    card.innerHTML = `
      <div class="product-media">
        <span class="ribbon" style="display:${soldOut ? 'inline-block' : 'none'}">Sold Out</span>
        <img src="${sortedColors.length ? sortedColors[0].image : product.image}" alt="${product.name}" class="product-img-main">
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

    const imgEl = card.querySelector('.product-img-main');
    const swatches = card.querySelectorAll('.color-swatch');
    const stockEl = card.querySelector('.stock');
    const button = card.querySelector("button");
    const ribbon = card.querySelector('.ribbon');

    swatches.forEach((swatch, i) => {
      if (i === 0) swatch.classList.add('selected');
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = i;
        imgEl.src = sortedColors[i].image;
        colorStock = sortedColors[i].stock;
        stockEl.textContent = colorStock === 0 ? "Restock soon" : `${colorStock} left`;
        button.disabled = colorStock === 0;
        button.textContent = colorStock === 0 ? "Sold out" : "Add to cart";
        ribbon.style.display = colorStock === 0 ? 'inline-block' : 'none';
      });
    });

    button.onclick = () => {
      if (sortedColors.length) {
        addToCart({
          ...product,
          colorName: sortedColors[selectedColor].name,
          image: sortedColors[selectedColor].image,
          selectedColor
        });
      } else addToCart(product);
    };

    shop.appendChild(card);
  });
}

// ----------------------
// Initialize
// ----------------------
function initProductSearch() {
  allProducts = loadProducts();
  window.products = allProducts;
  renderProducts();
  if (searchInput) searchInput.addEventListener('input', function() {
    renderProducts(this.value);
  });
}

initProductSearch();

// Listen for cross-tab storage updates
window.addEventListener('storage', (e) => {
  if (e.key === 'products') {
    allProducts = loadProducts();
    window.products = allProducts;
    renderProducts();
  }
  if (e.key === 'cart') {
    cart = JSON.parse(localStorage.getItem('cart') || '[]');
    updateCartCount();
    renderCart();
  }
});
