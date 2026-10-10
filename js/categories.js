document.addEventListener('DOMContentLoaded', () => {
  const categoryList = document.getElementById('category-list');
  const categoryView = document.getElementById('category-view');

  function showCategory(category) {
    categoryView.replaceChildren();
    const heading = document.createElement('h2');
    heading.textContent = `${category} Bags`;
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    const products = (window.products || []).filter(product => product.category === category);
    products.forEach(product => grid.appendChild(createProductCard(product)));
    if (!products.length) {
      const message = document.createElement('p');
      message.className = 'not-found';
      message.textContent = 'No bags found in this category.';
      grid.append(message);
    }
    const back = document.createElement('a');
    back.className = 'btn btn-ghost';
    back.href = 'categories.html';
    back.textContent = 'Back to Categories';
    categoryView.append(heading, grid, back);
    categoryView.style.display = '';
    categoryList.style.display = 'none';
  }

  const category = new URLSearchParams(window.location.search).get('category');
  if (category) showCategory(category);
});
