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
    let localCatalog;
    try {
      localCatalog = await fallback();
    } catch (error) {
      localCatalog = { products: [], categories: [] };
    }

    try {
      if (!window.supabase || !window.MV_SUPABASE_URL || !window.MV_SUPABASE_KEY) {
        throw new Error('Supabase no configurado');
      }

      const client = window.supabase.createClient(
        window.MV_SUPABASE_URL,
        window.MV_SUPABASE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      // Request only storefront fields; avoid fetching every column and a nested relation.
      // A bounded wait prevents a slow Supabase response from leaving the storefront loading forever.
      let timeoutId;
      const remoteRequest = Promise.all([
        client.from('products')
          .select('id,legacy_id,slug,name,description,price,sale_price,unit,category_id,image_url,images,stock,is_available,active,featured,sort_order,allow_in_combo,combo_order,featured_order')
          .eq('active', true)
          .order('sort_order'),
        client.from('categories')
          .select('id,name,slug,description,image_url,active,allow_in_combo,sort_order,icon')
          .eq('active', true)
          .order('sort_order')
      ]);
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Supabase tardó demasiado; se muestra el catálogo de respaldo')), 6000);
      });
      let results;
      try {
        results = await Promise.race([remoteRequest, timeout]);
      } finally {
        clearTimeout(timeoutId);
      }
      const [productResult, categoryResult] = results;

      if (productResult.error) throw productResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (!productResult.data || productResult.data.length === 0) {
        throw new Error('Supabase no contiene productos; se usa el catálogo de respaldo');
      }

      const categories = categoryResult.data.map(mapCategory);
      const categoryById = new Map(categoryResult.data.map(category => [category.id, category]));
      const products = productResult.data.map(product => mapProduct(product, categoryById));

      products.forEach(product => {
        if (!product.category) {
          const localCategory = (localCatalog.categories || [])
            .find(category => category.id === product.categoryId);
          if (localCategory) product.category = localCategory.id;
        }
      });
      categories.forEach(category => {
        category.count = products.filter(product => product.category === category.id).length;
      });

      return { ...localCatalog, products, categories, source: 'supabase' };
    } catch (error) {
      console.warn('[MV Bichota] Catálogo de respaldo:', error.message);
      const products = (localCatalog.products || [])
        .filter(product => product.active !== false)
        .map(product => ({ ...product, available: Number(product.stock || 0) > 0 }));

      return {
        ...localCatalog,
        products,
        categories: (localCatalog.categories || []).filter(category => category.active !== false),
        source: 'json'
      };
    }
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
