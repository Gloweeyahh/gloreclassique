// --- Cart Logic ---
// Expose getCart/setCart globally for cross-page compatibility
window.getCart = function() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
};
window.setCart = function(newCart) {
  cart = newCart;
  saveCart();
  updateCartCount();
  renderCart();
};
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const els = [
    document.getElementById('cart-count'),
    document.getElementById('nav-cart-count')
  ];
  els.forEach(el => { if (el) el.textContent = count; });
  // Close nav when X or overlay is clicked
  const closeBtn = document.querySelector('.side-nav .close-nav');
  if (closeBtn) {
    closeBtn.onclick = function() { toggleNav(false); };
  }
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
      <button class="cart-remove" onclick="removeFromCart(${item.id}, ${item.colorName ? `'${item.colorName.replace(/'/g, "\\'")}'` : 'null'})">&times;</button>
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
  setTimeout(() => {
    msg.style.opacity = '0';
    setTimeout(() => { msg.style.display = 'none'; }, 400);
  }, 1200);
}

function addToCart(product) {
  // Treat each color as a unique cart item
  const idx = cart.findIndex(i =>
    i.id === product.id &&
    (i.colorName || null) === (product.colorName || null)
  );
  // Find available stock for this color
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

function removeFromCart(id, colorName) {
  cart = cart.filter(i => {
    if (i.id !== id) return true;
    // If colorName is provided, only remove the matching color variant
    if ((i.colorName || null) !== (colorName || null)) return true;
    return false;
  });
  saveCart();
  updateCartCount();
  renderCart();
}

function toggleCart() {
  const sidebar = document.querySelector('.cart-sidebar');
  const overlay = document.querySelector('.cart-overlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
}

function continueShopping() {
  toggleCart();
}

function checkoutCart() {
  // For each cart item, reduce the stock in allProducts
  cart.forEach(item => {
    const prod = allProducts.find(p => p.id === item.id);
    if (prod && item.colorName && prod.colors) {
      const colorObj = prod.colors.find(c => c.name === item.colorName);
      if (colorObj) {
        colorObj.stock = Math.max(0, colorObj.stock - item.qty);
      }
    } else if (prod && !item.colorName && prod.stock !== undefined) {
      prod.stock = Math.max(0, prod.stock - item.qty);
    }
  });
  // Clear cart
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();
  renderProducts();
  showAddedToCartMessage('Checkout complete! Stock updated.');
}

// On page load
updateCartCount();
renderCart();

// Hamburger alignment fix for all pages
document.addEventListener('DOMContentLoaded', function() {
  const wrap = document.querySelector('.hamburger-wrap');
  if (wrap) wrap.style.alignItems = 'flex-start';
});
const shop = document.getElementById("shop");
const searchInput = document.querySelector('.search-input');
let allProducts = [];

// Get category from URL
function getCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("category");
}

// Format price
function formatPrice(amount) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

// Render products (optionally filtered)
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
    const card = document.createElement("div");
    card.className = "product-card";
    // Sort colors: available first, sold out last
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
    const button = card.querySelector("button");
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
        let prodToCart = { ...product };
        if (sortedColors.length) {
          prodToCart.selectedColor = selectedColor;
          prodToCart.colorName = sortedColors[selectedColor].name;
          prodToCart.image = sortedColors[selectedColor].image;
        }
        addToCart(prodToCart);
      };
    }
    shop.appendChild(card);
  });
}

// Paystack payment
function payWithPaystack(product) {
  const customerEmail = prompt("Enter your email");
  if (!customerEmail) return;

  const customerName = prompt("Enter your full name");
  if (!customerName) return;

  const customerPhone = prompt("Enter your phone number");
  if (!customerPhone) return;

  PaystackPop.setup({
    key: "YOUR_PUBLIC_KEY_HERE",
    email: customerEmail,
    amount: product.price * 100,
    currency: "NGN",
    ref: "BAG_" + Math.floor(Math.random() * 1000000000),
    callback: async (response) => {
      // Send order to backend
      await fetch("https://YOUR_BACKEND_URL_HERE/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          reference: response.reference
        })
      });

      // Re-render to update stock
      renderProducts();
      alert("Payment successful! 🎉 Your order has been confirmed.");
    },
    onClose: () => alert("Payment cancelled")
  }).openIframe();
}

// DEBUG: Check if products are loaded and search input is found
console.log('DEBUG: window.products', window.products);
console.log('DEBUG: searchInput', searchInput);

// Ensure products are loaded before rendering and searching
function initProductSearch() {
  if (window.products && Array.isArray(window.products)) {
    allProducts = window.products;
    console.log('DEBUG: allProducts set', allProducts);
    renderProducts();
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        console.log('DEBUG: search input event', this.value);
        renderProducts(this.value);
      });
    } else {
      console.log('DEBUG: searchInput not found');
    }
  } else {
    // Try again after DOMContentLoaded if not ready
    document.addEventListener('DOMContentLoaded', function() {
      if (window.products && Array.isArray(window.products)) {
        allProducts = window.products;
        console.log('DEBUG: allProducts set (DOMContentLoaded)', allProducts);
        renderProducts();
        if (searchInput) {
          searchInput.addEventListener('input', function(e) {
            console.log('DEBUG: search input event (DOMContentLoaded)', this.value);
            renderProducts(this.value);
          });
        } else {
          console.log('DEBUG: searchInput not found (DOMContentLoaded)');
        }
      } else {
        console.log('DEBUG: window.products not found (DOMContentLoaded)');
      }
    });
  }
}
initProductSearch();
