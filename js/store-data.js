/* Shared catalog source: Supabase first, JSON fallback. Public key only; RLS controls visibility. */
(function () {
  'use strict';

  const CACHE_TTL_MS = 60 * 1000;
  let cachedLoad = null;
  let cachedAt = 0;

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
      images: Array.isArray(product.images) ? product.images : [],
      stock: Number(product.stock || 0),
      active: product.active !== false,
      featured: product.featured === true,
      featuredOrder: Number(product.featured_order || 0),
      comboOrder: Number(product.combo_order || product.sort_order || 0),
      allowInCombo: product.allow_in_combo !== false
    };
  }

  async function loadCatalog() {
    let local;
    try {
      local = await fallback();
    } catch (error) {
      local = { products: [], categories: [] };
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
      const [productResult, categoryResult] = await Promise.all([
        client.from('products').select('*, categories(slug,name)').eq('active', true).order('sort_order'),
        client.from('categories').select('*').eq('active', true).order('sort_order')
      ]);

      if (productResult.error) throw productResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (!productResult.data || productResult.data.length === 0) {
        throw new Error('Supabase no contiene productos; se usa el catálogo de respaldo');
      }

      const categories = categoryResult.data.map(mapCategory);
      const categoryById = new Map(categoryResult.data.map(category => [category.id, category]));
      const products = productResult.data.map(product => mapProduct(product, categoryById));

      if (products.some(product => !product.category)) {
        const localCategories = local.categories || [];
        products.forEach(product => {
          if (!product.category) {
            const category = localCategories.find(item => item.id === product.categoryId);
            if (category) product.category = category.id;
          }
        });
      }

      categories.forEach(category => {
        category.count = products.filter(product => product.category === category.id).length;
      });

      return { ...local, products, categories, source: 'supabase' };
    } catch (error) {
      console.warn('[MV Bichota] Catálogo de respaldo:', error.message);
      return {
        ...local,
        products: (local.products || []).filter(product => product.active !== false),
        categories: (local.categories || []).filter(category => category.active !== false),
        source: 'json'
      };
    }
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
    return copyForConsumer(data);
  }

  function invalidate() {
    cachedLoad = null;
    cachedAt = 0;
  }

  window.MVStoreData = { load, invalidate };
})();
