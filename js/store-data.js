/* Public product catalog data: Supabase first, local JSON fallback. Public key only; RLS controls visibility. */
(function () {
  'use strict';

  let catalogPromise;

  async function fallback() {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error('No se pudo leer el catálogo local');
    return response.json();
  }

  function ensureCatalogStylesheet() {
    if (document.querySelector('link[data-mv-catalog-styles]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/catalog-grid.css';
    stylesheet.dataset.mvCatalogStyles = 'true';
    document.head.appendChild(stylesheet);
  }

  function mapCategory(category) {
    return {
      id: category.slug || category.id,
      name: category.name,
      icon: category.icon || 'shopping-bag',
      description: category.description || '',
      image: category.image_url || '',
      active: category.active !== false,
      allowInCombo: category.allow_in_combo !== false,
      sortOrder: Number(category.sort_order || 0)
    };
  }

  function mapProduct(product, categoryById) {
    const category = product.categories || product.category || categoryById.get(product.category_id) || {};
    const regularPrice = Number(product.price || 0);
    const salePrice = product.sale_price == null ? null : Number(product.sale_price);
    const images = Array.isArray(product.images)
      ? product.images.filter(image => typeof image === 'string')
      : [];
    const stock = Number(product.stock || 0);
    const available = product.is_available !== false && stock > 0;

    return {
      id: product.legacy_id || product.slug || product.id,
      dbId: product.id,
      slug: product.slug || '',
      name: product.name,
      description: product.description || '',
      price: salePrice !== null ? salePrice : regularPrice,
      originalPrice: salePrice !== null && salePrice < regularPrice ? regularPrice : null,
      oldPrice: salePrice !== null && salePrice < regularPrice ? regularPrice : null,
      unit: product.unit || 'unidad',
      category: category.slug || '',
      categoryId: product.category_id || null,
      image: product.image_url || images[0] || '',
      images,
      stock,
      available,
      active: product.active !== false,
      featured: product.featured === true,
      featuredOrder: Number(product.featured_order || 0),
      comboOrder: Number(product.combo_order || product.sort_order || 0),
      allowInCombo: product.allow_in_combo !== false && available
    };
  }

  function installCatalogBehavior() {
    ensureCatalogStylesheet();
    const grid = document.getElementById('productsGrid');
    const controls = document.querySelector('.catalog__controls');
    if (!grid || !controls) return;

    function applyCatalogFilters() {
      const searchInput = document.getElementById('catalogSearch');
      const query = (searchInput ? searchInput.value : '').trim().toLocaleLowerCase('es');
      let visible = 0;

      grid.querySelectorAll('.product-card').forEach(card => {
        const matches = !query || card.textContent.toLocaleLowerCase('es').includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
      });

      const count = document.getElementById('catalogCount');
      if (count && query) {
        count.textContent = visible + ' producto' + (visible === 1 ? '' : 's') +
          ' encontrado' + (visible === 1 ? '' : 's');
      }

      const empty = document.getElementById('catalogEmpty');
      if (empty && query) empty.style.display = visible ? 'none' : 'flex';
    }

    if (!document.getElementById('catalogSearch')) {
      const search = document.createElement('input');
      search.id = 'catalogSearch';
      search.className = 'catalog__search';
      search.type = 'search';
      search.placeholder = 'Buscar productos…';
      search.setAttribute('aria-label', 'Buscar productos en el catálogo');
      controls.prepend(search);
      search.addEventListener('input', applyCatalogFilters);
    }

    function decorateCards() {
      const products = window.MV_PUBLIC_PRODUCTS || [];
      grid.querySelectorAll('.product-card').forEach(card => {
        const id = card.dataset.id ||
          card.querySelector('[data-product-id]')?.dataset.productId;
        const product = products.find(item => String(item.id) === String(id));
        if (!product || product.available) return;

        const button = card.querySelector('.product-card__cart-btn');
        if (button) {
          button.disabled = true;
          button.setAttribute('aria-disabled', 'true');
          button.textContent = 'No disponible';
          button.classList.add('is-unavailable');
        }

        if (!card.querySelector('.availability-badge')) {
          const badge = document.createElement('span');
          badge.className = 'availability-badge';
          badge.textContent = product.stock <= 0 ? 'Agotado' : 'No disponible';
          card.querySelector('.product-card__image')?.appendChild(badge);
        }
      });
      applyCatalogFilters();
    }

    new MutationObserver(decorateCards).observe(grid, { childList: true, subtree: true });
    grid.addEventListener('click', event => {
      if (event.target.closest('.product-card__cart-btn:disabled')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  async function loadCatalog() {
    // Consultar Supabase primero: el JSON local solo se descarga si Supabase falla.
    if (!window.supabase || !window.MV_SUPABASE_URL || !window.MV_SUPABASE_KEY) {
      throw new Error('Supabase no está configurado en la tienda');
    }

    const client = window.supabase.createClient(
      window.MV_SUPABASE_URL,
      window.MV_SUPABASE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let timeoutId;
    const remoteRequest = Promise.all([
      // '*' evita que una columna opcional nueva o todavía no creada rompa el catálogo.
      client.from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true }),
      client.from('categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true })
    ]);
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error('La consulta de Supabase superó el tiempo de espera')),
        8000
      );
    });

    let productResult;
    let categoryResult;
    try {
      [productResult, categoryResult] = await Promise.race([remoteRequest, timeout]);
    } finally {
      clearTimeout(timeoutId);
    }

    if (productResult.error) throw productResult.error;

    // La consulta de productos es la fuente principal. Si falla categorías,
    // se conserva el catálogo y se completan nombres con el JSON de respaldo.
    let localCatalog = { products: [], categories: [], business: {} };
    if (categoryResult.error) {
      console.warn('[MV Bichota] No se pudieron cargar categorías desde Supabase:', categoryResult.error.message);
      try { localCatalog = await fallback(); } catch (_) {}
    }

    const categoryRows = !categoryResult.error && Array.isArray(categoryResult.data)
      ? categoryResult.data
      : [];
    const categories = categoryRows.map(mapCategory);
    const categoryById = new Map(categoryRows.map(category => [category.id, category]));
    const products = (productResult.data || []).map(product => mapProduct(product, categoryById));

    products.forEach(product => {
      if (!product.category) {
        const localCategory = (localCatalog.categories || [])
          .find(category => String(category.id) === String(product.categoryId));
        if (localCategory) product.category = localCategory.id;
      }
    });

    categories.forEach(category => {
      category.count = products.filter(product => product.category === category.id).length;
    });

    // Un resultado vacío de Supabase es válido: no mostrar productos antiguos del JSON.
    return {
      ...localCatalog,
      products,
      categories: categories.length ? categories : (localCatalog.categories || []),
      source: 'supabase'
    };
  }

  function load() {
    if (!catalogPromise) catalogPromise = loadCatalog();
    return catalogPromise.then(catalog => {
      window.MV_PUBLIC_PRODUCTS = catalog.products || [];
      return catalog;
    });
  }

  window.MVStoreData = { load };
  document.addEventListener('DOMContentLoaded', installCatalogBehavior);
})();
