// --- Real-time Cart & Stock Updates ---

function checkoutCart() {
  // Reduce stock
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

  // Clear cart
  cart = [];
  saveCart();

  // Persist products
  saveProducts(allProducts);

  // Update UI immediately
  updateCartCount();
  renderCart();
  renderProducts();

  // Notify other tabs
  localStorage.setItem('cart', JSON.stringify(cart));
  localStorage.setItem('products', JSON.stringify(allProducts));
  window.dispatchEvent(new Event('storage'));

  showAddedToCartMessage('Checkout complete! Stock updated.');
}

// Update button/ribbon dynamically for each product card
function updateProductCardUI(card, product, selectedColor = 0) {
  const swatches = card.querySelectorAll('.color-swatch');
  const button = card.querySelector('button');
  const ribbon = card.querySelector('.ribbon');
  const stockEl = card.querySelector('.stock');

  let colorStock = 0;
  let soldOut = false;

  if (product.colors && product.colors.length) {
    colorStock = product.colors[selectedColor].stock;
    soldOut = colorStock === 0;
  } else {
    colorStock = product.stock || 0;
    soldOut = colorStock === 0;
  }

  stockEl.textContent = soldOut ? 'Restock soon' : `${colorStock} left`;
  button.disabled = soldOut;
  button.textContent = soldOut ? 'Sold out' : 'Add to cart';
  if (ribbon) ribbon.style.display = soldOut ? 'inline-block' : 'none';
}

// Override renderProducts to include live updates
function renderProducts(filter = '') {
  if (!shop) return;

  const category = getCategory();
  let list = category ? allProducts.filter(p => p.category === category) : allProducts.slice();
  if (filter) list = list.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));
  if (shop.dataset.limit) list = list.slice(0, parseInt(shop.dataset.limit, 10));

  shop.innerHTML = list.length === 0 ? '<div class="not-found">Bag not found</div>' : '';

  list.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const sortedColors = product.colors ? [...product.colors].sort((a, b) => (a.stock === 0) - (b.stock === 0)) : [];
    let selectedColor = 0;

    let swatchHtml = sortedColors.length ? `<div class="color-swatches">${sortedColors.map((c, i) => `<span class="color-swatch" title="${c.name}" style="background:${c.swatch}" data-img="${c.image}" data-index="${i}"></span>`).join('')}</div>` : '';
    let priceHtml = `<span class="price">${formatPrice(product.price)}</span>`;
    if (product.oldPrice) priceHtml = `<span class="old-price">${formatPrice(product.oldPrice)}</span> <span class="price">${formatPrice(product.price)}</span>`;

    const ribbonDisplay = (sortedColors.length ? sortedColors[0].stock === 0 : product.stock === 0) ? 'inline-block' : 'none';
    const stockText = (sortedColors.length ? sortedColors[0].stock : product.stock || 0) === 0 ? 'Restock soon' : `${sortedColors.length ? sortedColors[0].stock : product.stock} left`;

    card.innerHTML = `
      <div class="product-media">
        <span class="ribbon" style="display:${ribbonDisplay}">Sold Out</span>
        <img src="${sortedColors.length ? sortedColors[0].image : product.image}" alt="${product.name}" class="product-img-main">
        ${swatchHtml}
      </div>
      <h3>${product.name}</h3>
      <div class="product-meta">
        ${priceHtml}
        <span class="stock">${stockText}</span>
      </div>
      <div class="product-actions">
        <button class="btn btn-primary btn-full" ${stockText === 'Restock soon' ? 'disabled' : ''}>${stockText === 'Restock soon' ? 'Sold out' : 'Add to cart'}</button>
      </div>
    `;

    const imgEl = card.querySelector('.product-img-main');
    const swatchesEls = card.querySelectorAll('.color-swatch');
    const button = card.querySelector('button');

    swatchesEls.forEach((swatch, i) => {
      if (i === 0) swatch.classList.add('selected');
      swatch.addEventListener('click', () => {
        swatchesEls.forEach(s => s.classList.remove('selected'));
        swatch.classList.add('selected');
        selectedColor = i;
        imgEl.src = sortedColors[i].image;
        updateProductCardUI(card, product, selectedColor);
      });
    });

    button.onclick = () => {
      if (button.disabled) return;
      const prodToCart = { ...product };
      if (sortedColors.length) {
        prodToCart.colorName = sortedColors[selectedColor].name;
        prodToCart.image = sortedColors[selectedColor].image;
      }
      addToCart(prodToCart);
      updateProductCardUI(card, product, selectedColor);
    };

    shop.appendChild(card);
  });
}
