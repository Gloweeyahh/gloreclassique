window.getCart = function() {
  try {
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    return Array.isArray(items) ? items : [];
  } catch (e) {
    return [];
  }
};

window.setCart = function(newCart) {
  cart = newCart;
  saveCart();
  refreshCart();
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
  renderCartItems(document.getElementById('cart-items'));
}

function renderCartItems(container) {
  if (!container) return;
  container.replaceChildren();
  if (cart.length === 0) {
    const message = document.createElement('p');
    message.textContent = 'Your cart is empty.';
    container.append(message);
    return;
  }
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    const image = document.createElement('img');
    image.className = 'cart-thumb';
    image.src = item.image;
    image.alt = item.name;
    const details = document.createElement('div');
    details.className = 'cart-info';
    const title = document.createElement('div');
    title.className = 'cart-title';
    title.textContent = item.name + (item.colorName ? ` (${item.colorName})` : '');
    const meta = document.createElement('div');
    meta.className = 'cart-meta';
    meta.textContent = `₦${item.price.toLocaleString()} x ${item.qty}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'cart-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${title.textContent} from cart`);
    remove.addEventListener('click', () => removeFromCart(item.id, item.colorName || null));
    details.append(title, meta);
    row.append(image, details, remove);
    container.append(row);
  });
}

function renderCartPage() {
  renderCartItems(document.getElementById('cart-list'));
  const total = document.getElementById('cart-total');
  if (total) {
    total.textContent = cart.length ? `Total: ₦${cart.reduce((amount, item) => amount + item.price * item.qty, 0).toLocaleString()}` : '';
  }
}

function refreshCart() {
  updateCartCount();
  renderCart();
  renderCartPage();
  window.dispatchEvent(new Event('cart-updated'));
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
  window.setCart(cart);
  showAddedToCartMessage();
}

// Remove from Cart
function removeFromCart(id, colorName) {
  cart = cart.filter(i => {
    if (i.id !== id) return true;
    if ((i.colorName || null) !== (colorName || null)) return true;
    return false;
  });
  window.setCart(cart);
}

// Cart Sidebar Toggle
function toggleCart() {
  setPanel('cart', activePanel !== 'cart');
}

let activePanel = null;
let panelOpener = null;

function toggleNav() {
  setPanel('nav', activePanel !== 'nav');
}

function setPanel(type, opened) {
  const nextPanel = opened ? type : null;
  const previousOpener = panelOpener;
  if (opened) panelOpener = document.activeElement;
  ['nav', 'cart'].forEach(panelType => {
    const panel = document.querySelector(panelType === 'nav' ? '.side-nav' : '.cart-sidebar');
    const overlay = document.querySelector(`.${panelType}-overlay`);
    const trigger = document.querySelector(panelType === 'nav' ? '.hamburger' : '.cart-btn');
    const selected = nextPanel === panelType;
    if (panel) {
      panel.classList.toggle('active', selected);
      panel.inert = !selected;
      panel.setAttribute('aria-hidden', String(!selected));
    }
    if (overlay) overlay.classList.toggle('active', selected);
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(selected));
      if (panelType === 'nav') trigger.classList.toggle('active', selected);
    }
  });
  activePanel = nextPanel;
  document.body.classList.toggle('panel-open', Boolean(nextPanel));
  const topBar = document.querySelector('.top-bar');
  if (topBar) topBar.classList.toggle('nav-open', nextPanel === 'nav');
  if (opened) {
    const panel = document.querySelector(type === 'nav' ? '.side-nav' : '.cart-sidebar');
    if (panel) panel.querySelector('button, a[href]')?.focus();
  } else if (previousOpener) {
    previousOpener.focus();
    panelOpener = null;
  }
}

function initializeNavigation() {
  ['nav', 'cart'].forEach(type => {
    const panel = document.querySelector(type === 'nav' ? '.side-nav' : '.cart-sidebar');
    const trigger = document.querySelector(type === 'nav' ? '.hamburger' : '.cart-btn');
    const overlay = document.querySelector(`.${type}-overlay`);
    const close = document.querySelector(`.close-${type}`);
    if (panel) {
      panel.id = `${type}-panel`;
      panel.setAttribute('aria-label', type === 'nav' ? 'Store navigation' : 'Shopping cart');
      panel.inert = true;
      panel.setAttribute('aria-hidden', 'true');
    }
    if (trigger) {
      trigger.setAttribute('aria-controls', `${type}-panel`);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', () => setPanel(type, activePanel !== type));
    }
    if (overlay) overlay.addEventListener('click', () => setPanel(type, false));
    if (close) close.addEventListener('click', () => setPanel(type, false));
    if (panel) panel.addEventListener('click', event => {
      if (event.target.closest('a[href]')) setPanel(type, false);
    });
  });
  document.addEventListener('keydown', event => {
    if (!activePanel) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setPanel(activePanel, false);
    } else if (event.key === 'Tab') {
      const panel = document.querySelector(activePanel === 'nav' ? '.side-nav' : '.cart-sidebar');
      const controls = Array.from(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])'))
        .filter(control => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
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
  initializeNavigation();
  const search = document.querySelector('.search-input');
  if (search) {
    search.value = new URLSearchParams(window.location.search).get('search') || '';
    search.addEventListener('input', renderProducts);
    const form = search.closest('form');
    if (form) form.addEventListener('submit', event => {
      event.preventDefault();
      if (document.querySelector('#shop, #all-products')) renderProducts();
      else window.location.assign('shop.html?search=' + encodeURIComponent(search.value.trim()));
    });
  }
  renderProducts();
  refreshCart();
  window.addEventListener('storage', event => {
    if (event.key === 'cart' || event.key === null) {
      cart = window.getCart();
      refreshCart();
    }
  });
});
