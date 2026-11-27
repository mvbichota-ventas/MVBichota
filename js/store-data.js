/* Shared catalog source: Supabase first, JSON fallback. Public key only; RLS controls visibility. */
(function () {
  'use strict';

  const CACHE_TTL_MS = 60 * 1000;
  let cachedLoad = null;
  let cachedAt = 0;
  let liveUpdatesStarted = false;
  let refreshTimer = null;
  let refreshInFlight = false;

  async function fallback() {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error('No se pudo leer el catálogo local');
    return response.json();
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
    const discounted = salePrice !== null && salePrice < regularPrice;

    return {
      id: product.legacy_id || product.slug || product.id,
      dbId: product.id,
      slug: product.slug || '',
      name: product.name,
      description: product.description || '',
      price: salePrice !== null ? salePrice : regularPrice,
      originalPrice: discounted ? regularPrice : null,
      oldPrice: discounted ? regularPrice : null,
      unit: product.unit || 'unidad',
      category: category.slug || '',
      categoryId: product.category_id || null,
      image: product.image_url || (Array.isArray(product.images) ? product.images[0] : null) || '',
      images: Array.isArray(product.images) ? product.images.filter(image => typeof image === 'string') : [],
      priceCup: product.price_cup == null ? null : Number(product.price_cup),
      stock: Number(product.stock || 0),
      available: product.is_available !== false && Number(product.stock || 0) > 0,
      active: product.active !== false,
      featured: product.featured === true,
      featuredOrder: Number(product.featured_order || 0),
      comboOrder: Number(product.combo_order || product.sort_order || 0),
      allowInCombo: product.allow_in_combo !== false && product.is_available !== false && Number(product.stock || 0) > 0
    };
  }


  function ensureCatalogStylesheet() {
    if (document.querySelector('link[data-mv-catalog-styles]')) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'css/catalog-grid.css';
    stylesheet.dataset.mvCatalogStyles = 'true';
    document.head.appendChild(stylesheet);
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
      if (count && query) count.textContent = visible + ' producto' + (visible === 1 ? '' : 's') +
        ' encontrado' + (visible === 1 ? '' : 's');
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
        const id = card.dataset.id || card.querySelector('[data-product-id]')?.dataset.productId;
        const product = products.find(item => String(item.id) === String(id));
        if (!product || product.available !== false) return;
        const button = card.querySelector('.product-card__cart-btn');
        if (button) {
          if (!button.disabled) button.disabled = true;
          if (button.getAttribute('aria-disabled') !== 'true') {
            button.setAttribute('aria-disabled', 'true');
          }
          if (button.textContent !== 'No disponible') {
            button.textContent = 'No disponible';
          }
          if (!button.classList.contains('is-unavailable')) {
            button.classList.add('is-unavailable');
          }
        }
        if (!card.querySelector('.availability-badge')) {
          const badge = document.createElement('span');
          badge.className = 'availability-badge';
          badge.textContent = Number(product.stock || 0) <= 0 ? 'Agotado' : 'No disponible';
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
    try {
      // Supabase es la fuente principal; el JSON se consulta únicamente si falla.
      if (!window.supabase || !window.MV_SUPABASE_URL || !window.MV_SUPABASE_KEY) {
        throw new Error('Supabase no está configurado');
      }

      if (typeof window.MV_getSupabaseClient !== 'function') {
        throw new Error('No está disponible el cliente compartido de Supabase');
      }
      const client = window.MV_getSupabaseClient();
      startLiveUpdates(client);

      let timeoutId;
      const productFields = 'id,legacy_id,slug,name,description,price,sale_price,unit,category_id,image_url,images,stock,is_available,active,featured,sort_order,allow_in_combo,combo_order,featured_order';
      const loadProducts = async () => {
        let result = await client.from('products')
          .select(productFields + ',price_cup')
          .eq('active', true)
          .order('sort_order', { ascending: true });

        // price_cup es opcional hasta que se apruebe y ejecute la migración.
        // Si aún no existe, seguimos cargando el catálogo con el esquema anterior.
        const errorText = [result.error?.message, result.error?.details, result.error?.hint].join(' ');
        const missingCupColumn = result.error &&
          /price_cup/i.test(errorText) &&
          (['42703', 'PGRST204'].includes(result.error.code) || /(column|schema cache|does not exist|not found)/i.test(errorText));
        if (missingCupColumn) {
          result = await client.from('products')
            .select(productFields)
            .eq('active', true)
            .order('sort_order', { ascending: true });
        }
        return result;
      };

      const request = Promise.all([
        loadProducts(),
        client.from('categories')
          .select('id,name,slug,description,image_url,active,allow_in_combo,sort_order,icon')
          .eq('active', true)
          .order('sort_order', { ascending: true })
      ]);
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Supabase tardó más de 6 segundos en responder')),
          6000
        );
      });

      let productResult;
      let categoryResult;
      try {
        [productResult, categoryResult] = await Promise.race([request, timeout]);
      } finally {
        clearTimeout(timeoutId);
      }

      if (productResult.error) throw productResult.error;

      // Si no hay productos activos, respetamos el resultado de Supabase:
      // no sustituimos un catálogo vacío por datos locales desactualizados.
      const productRows = productResult.data || [];
      const categoryRows = !categoryResult.error && Array.isArray(categoryResult.data)
        ? categoryResult.data
        : [];

      const categories = categoryRows.map(mapCategory);
      const categoryById = new Map(categoryRows.map(category => [category.id, category]));
      const products = productRows.map(product => {
        const mapped = mapProduct(product, categoryById);
        const stock = Number(product.stock || 0);
        mapped.available = product.is_available !== false && stock > 0;
        mapped.stock = stock;
        if (!mapped.category) {
          const category = categoryById.get(product.category_id);
          if (category) mapped.category = category.slug || category.id;
        }
        return mapped;
      });

      categories.forEach(category => {
        category.count = products.filter(product => product.category === category.id).length;
      });

      let local = { products: [], categories: [], business: {} };
      if (categoryResult.error) {
        console.warn('[MV Bichota] No se pudieron cargar categorías:', categoryResult.error.message);
        try { local = await fallback(); } catch (_) {}
      }

      return {
        ...local,
        products,
        categories: categories.length ? categories : (local.categories || []),
        source: 'supabase'
      };
    } catch (error) {
      console.error('[MV Bichota] Falló la carga desde Supabase:', error.message);
      let local = { products: [], categories: [], business: {} };
      try {
        local = await fallback();
      } catch (fallbackError) {
        console.error('[MV Bichota] También falló el catálogo local:', fallbackError);
      }
      return {
        ...local,
        products: (local.products || []).filter(product => product.active !== false),
        categories: (local.categories || []).filter(category => category.active !== false),
        source: 'json'
      };
    }
  }

  function startLiveUpdates(client) {
    if (liveUpdatesStarted) return;
    liveUpdatesStarted = true;

    const refresh = async () => {
      if (refreshInFlight || document.hidden) return;
      refreshInFlight = true;
      try {
        invalidate();
        const data = await load({ forceRefresh: true });
        window.dispatchEvent(new CustomEvent('mv:catalog-updated', {
          detail: copyForConsumer(data)
        }));
      } catch (error) {
        console.warn('[MV Bichota] No se pudo actualizar el catálogo automáticamente:', error.message);
      } finally {
        refreshInFlight = false;
      }
    };

    // Realtime acelera los cambios; el sondeo cubre proyectos donde
    // products/categories aún no están habilitados en la publicación Realtime.
    try {
      client.channel('mv-public-catalog')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(refresh, 350);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(refresh, 350);
        })
        .subscribe();
    } catch (error) {
      console.warn('[MV Bichota] Realtime no está disponible; se usará actualización periódica:', error.message);
    }

    window.setInterval(refresh, 45000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
  }

  function copyForConsumer(data) {
    return {
      ...data,
      products: (data.products || []).map(product => ({ ...product })),
      categories: (data.categories || []).map(category => ({ ...category }))
    };
  }

  async function load(options = {}) {
    const forceRefresh = options && options.forceRefresh === true;
    const cacheIsFresh = cachedLoad && Date.now() - cachedAt < CACHE_TTL_MS;

    if (forceRefresh || !cacheIsFresh) {
      cachedAt = Date.now();
      cachedLoad = loadCatalog().catch(error => {
        cachedLoad = null;
        throw error;
      });
    }

    const data = await cachedLoad;
    window.MV_PUBLIC_PRODUCTS = data.products || [];
    return copyForConsumer(data);
  }

  function invalidate() {
    cachedLoad = null;
    cachedAt = 0;
  }

  window.MVStoreData = { load, invalidate };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installCatalogBehavior, { once: true });
  } else {
    installCatalogBehavior();
  }
})();
