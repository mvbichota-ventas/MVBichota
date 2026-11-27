/**
 * MV Bichota - Main Application Controller
 * Dynamic product loading, search, catalog, categories, interactions
 */

(function() {
    'use strict';

    // ================================================
    // Global State
    // ================================================
    let allProducts = [];
    let storeCategories = [];
    let storeBusiness = {};
    let currentCategory = 'all';
    let currentSort = 'default';

    // ================================================
    // Embedded products fallback (for file:// protocol)
    // ================================================
    const EMBEDDED_PRODUCTS = [
        {"id":"arroz","name":"Arroz","description":"Arroz de alta calidad, ideal para acompañar cualquier plato.","category":"alimentos","price":2.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop","stock":100,"active":true,"featured":true,"allowInCombo":true,"comboOrder":1,"featuredOrder":1},
        {"id":"frijoles-negros","name":"Frijoles Negros","description":"Frijoles negros frescos, perfectos para guisos y ensaladas.","category":"alimentos","price":3,"unit":"paquete","image":"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},
        {"id":"frijoles-cabrioles","name":"Frijoles Cabrioles","description":"Frijoles cabrioles de excelente calidad.","category":"alimentos","price":3.5,"unit":"libra","image":"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},
        {"id":"espaguetis","name":"Espaguetis","description":"Espaguetis italianos de grano duro.","category":"alimentos","price":1.8,"unit":"paquete","image":"https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},
        {"id":"pollo","name":"Pollo","description":"Pollo fresco, listo para cocinar.","category":"alimentos","price":8.5,"unit":"caja","image":"https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=300&h=300&fit=crop","stock":50,"active":true,"featured":true,"allowInCombo":true,"comboOrder":5,"featuredOrder":2},
        {"id":"salchichas","name":"Salchichas","description":"Salchichas de primera calidad.","category":"alimentos","price":4.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop","stock":70,"active":true,"featured":false,"allowInCombo":true,"comboOrder":6,"featuredOrder":0},
        {"id":"higado-pollo","name":"Hígado de Pollo","description":"Hígado de pollo fresco y nutritivo.","category":"alimentos","price":3.25,"unit":"paquete","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":40,"active":true,"featured":false,"allowInCombo":true,"comboOrder":7,"featuredOrder":0},
        {"id":"picadillo-pollo","name":"Picadillo de Pollo","description":"Picadillo de pollo preparado para cocinar.","category":"alimentos","price":5,"unit":"caja","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":8,"featuredOrder":0},
        {"id":"picadillo-original","name":"Picadillo de Pollo Original","description":"Picadillo de pollo original en tubo.","category":"alimentos","price":4.75,"unit":"tubo","image":"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop","stock":35,"active":true,"featured":false,"allowInCombo":true,"comboOrder":9,"featuredOrder":0},
        {"id":"mortadella","name":"Mortadella de Pollo Original","description":"Mortadella de pollo en tubo, ideal para sándwiches.","category":"alimentos","price":4.5,"unit":"tubo","image":"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop","stock":55,"active":true,"featured":false,"allowInCombo":true,"comboOrder":10,"featuredOrder":0},
        {"id":"azucar","name":"Azúcar","description":"Azúcar blanca de caña.","category":"alimentos","price":2.8,"unit":"libra","image":"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":11,"featuredOrder":0},
        {"id":"aceite","name":"Aceite","description":"Aceite vegetal refinado.","category":"alimentos","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":12,"featuredOrder":0},
        {"id":"huevos","name":"Huevos","description":"Huevos frescos de gallina.","category":"alimentos","price":4,"unit":"docena","image":"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop","stock":200,"active":true,"featured":true,"allowInCombo":true,"comboOrder":13,"featuredOrder":3},
        {"id":"cerdo","name":"Cerdo","description":"Carne de cerdo fresca.","category":"alimentos","price":9.5,"unit":"libra","image":"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop","stock":40,"active":true,"featured":true,"allowInCombo":true,"comboOrder":14,"featuredOrder":4},
        {"id":"pasta-tomate","name":"Pasta de Tomate","description":"Pasta de tomate concentrada.","category":"alimentos","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":15,"featuredOrder":0},
        {"id":"leche-condensada","name":"Leche Condensada","description":"Leche condensada dulce.","category":"alimentos","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":16,"featuredOrder":0},
        {"id":"leche-polvo","name":"Leche en Polvo","description":"Leche en polvo entera.","category":"alimentos","price":6.5,"unit":"libra","image":"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":17,"featuredOrder":0},
        {"id":"mayonesa","name":"Mayonesa","description":"Mayonesa cremosa y sabrosa.","category":"alimentos","price":3.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":70,"active":true,"featured":false,"allowInCombo":true,"comboOrder":18,"featuredOrder":0},
        {"id":"vinagre","name":"Vinagre","description":"Vinagre blanco destilado.","category":"alimentos","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":19,"featuredOrder":0},
        {"id":"gelatina","name":"Gelatina","description":"Gelatina de various sabores.","category":"alimentos","price":1,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":20,"featuredOrder":0},
        {"id":"maicena","name":"Maicena","description":"Maicena para espesar preparaciones.","category":"alimentos","price":1.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop","stock":85,"active":true,"featured":false,"allowInCombo":true,"comboOrder":21,"featuredOrder":0},
        {"id":"sazon","name":"Sazón","description":"Sazonador para mejorar tus platos.","category":"alimentos","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":22,"featuredOrder":0},
        {"id":"queso-blanco","name":"Queso Blanco","description":"Queso blanco fresco.","category":"alimentos","price":5.5,"unit":"libra","image":"https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":23,"featuredOrder":0},
        {"id":"jabon-bano","name":"Jabones de Baño","description":"Jabón para baño de various aromas.","category":"aseo","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},
        {"id":"jabon-lavar","name":"Jabones de Lavar","description":"Jabón para lavar ropa.","category":"aseo","price":2,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":80,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},
        {"id":"detergente","name":"Detergente","description":"Detergente en polvo o líquido.","category":"aseo","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":90,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},
        {"id":"pasta-dental","name":"Pasta Dental","description":"Pasta dental para dientes sanos.","category":"aseo","price":2.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop","stock":110,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},
        {"id":"champu-crema","name":"Juegos de Champú y Crema","description":"Set de champú y crema para el cabello.","category":"aseo","price":8.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":40,"active":true,"featured":false,"allowInCombo":true,"comboOrder":5,"featuredOrder":0},
        {"id":"papel-sanitario","name":"Papel Sanitario","description":"Rollo de papel sanitario.","category":"aseo","price":1.25,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":200,"active":true,"featured":false,"allowInCombo":true,"comboOrder":6,"featuredOrder":0},
        {"id":"desodorante","name":"Desodorante","description":"Desodorante personal.","category":"aseo","price":3,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":75,"active":true,"featured":false,"allowInCombo":true,"comboOrder":7,"featuredOrder":0},
        {"id":"crema-piel","name":"Crema de la Piel","description":"Crema hidratante para la piel.","category":"aseo","price":4.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":55,"active":true,"featured":false,"allowInCombo":true,"comboOrder":8,"featuredOrder":0},
        {"id":"colonias","name":"Colonias","description":"Colonias de various aromas.","category":"aseo","price":6,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":45,"active":true,"featured":false,"allowInCombo":true,"comboOrder":9,"featuredOrder":0},
        {"id":"perfumes","name":"Perfumes","description":"Perfumes de alta calidad.","category":"aseo","price":12,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":30,"active":true,"featured":false,"allowInCombo":false,"comboOrder":10,"featuredOrder":0},
        {"id":"talco-corporal","name":"Talco Corporal","description":"Talco para el cuerpo.","category":"aseo","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":65,"active":true,"featured":false,"allowInCombo":true,"comboOrder":11,"featuredOrder":0},
        {"id":"diarias","name":"Diarias","description":"Toallas higiénicas diarias.","category":"aseo","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop","stock":85,"active":true,"featured":false,"allowInCombo":true,"comboOrder":12,"featuredOrder":0},
        {"id":"galletas-soda","name":"Galletas de Soda","description":"Galletas de soda crujientes.","category":"confituras","price":1.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},
        {"id":"caramelos","name":"Caramelos","description":"Caramelos de various sabores.","category":"confituras","price":2,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":120,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},
        {"id":"galletas-dulce","name":"Galletas de Dulce","description":"Galletas dulces artesanales.","category":"confituras","price":2.5,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":80,"active":true,"featured":true,"allowInCombo":true,"comboOrder":3,"featuredOrder":5},
        {"id":"chupa-chupa","name":"Chupa Chupa","description":"Chupa chupa de various colores.","category":"confituras","price":1.75,"unit":"paquete","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},
        {"id":"refrescos-nectar","name":"Refrescos Néctar","description":"Refrescos de various sabores.","category":"bebidas","price":1.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":200,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},
        {"id":"refrescos","name":"Refrescos","description":"Refrescos gaseosos.","category":"bebidas","price":1.75,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":180,"active":true,"featured":false,"allowInCombo":true,"comboOrder":2,"featuredOrder":0},
        {"id":"malta","name":"Malta","description":"Malta sin alcohol.","category":"bebidas","price":2,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":150,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},
        {"id":"cervezas","name":"Cervezas","description":"Cervezas artesanales e importadas.","category":"bebidas","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop","stock":100,"active":true,"featured":false,"allowInCombo":false,"comboOrder":4,"featuredOrder":0},
        {"id":"ensalada-fria","name":"Ensalada Fría Básica","description":"Ensalada fría preparada.","category":"bufet","price":15,"unit":"cubeta","image":"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop","stock":20,"active":true,"featured":false,"allowInCombo":true,"comboOrder":1,"featuredOrder":0},
        {"id":"helado","name":"Helado","description":"Helado de various sabores.","category":"bufet","price":12,"unit":"cubeta","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":25,"active":true,"featured":true,"allowInCombo":true,"comboOrder":2,"featuredOrder":6},
        {"id":"panetelas","name":"Panetelas","description":"Panetelas de various tamaños.","category":"bufet","price":3.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":50,"active":true,"featured":false,"allowInCombo":true,"comboOrder":3,"featuredOrder":0},
        {"id":"marquesitas","name":"Marquesitas","description":"Marquesitas crujientes.","category":"bufet","price":2.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":60,"active":true,"featured":false,"allowInCombo":true,"comboOrder":4,"featuredOrder":0},
        {"id":"tres-leches","name":"Dulce Tres Leches","description":"Postre tres leches tradicional.","category":"bufet","price":4.5,"unit":"unidad","image":"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop","stock":35,"active":true,"featured":true,"allowInCombo":true,"comboOrder":5,"featuredOrder":7},
        {"id":"olla-presion","name":"Olla de Presión 5 Litros","description":"Olla de presión de acero inoxidable.","category":"electrodomesticos","price":35,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":15,"active":true,"featured":false,"allowInCombo":false,"comboOrder":1,"featuredOrder":0},
        {"id":"ventilador","name":"Ventilador Recargable F6","description":"Ventilador portátil recargable.","category":"electrodomesticos","price":28,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":20,"active":true,"featured":true,"allowInCombo":false,"comboOrder":2,"featuredOrder":8},
        {"id":"turbinas","name":"Turbinas","description":"Turbinas de various potencias.","category":"electrodomesticos","price":45,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":10,"active":true,"featured":false,"allowInCombo":false,"comboOrder":3,"featuredOrder":0},
        {"id":"alarma","name":"Alarma para Paneles","description":"Sistema de alarma para paneles solares.","category":"electrodomesticos","price":22,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":18,"active":true,"featured":false,"allowInCombo":false,"comboOrder":4,"featuredOrder":0},
        {"id":"tv","name":"TV","description":"Televisor LED de última generación.","category":"electrodomesticos","price":150,"unit":"unidad","image":"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop","stock":8,"active":true,"featured":false,"allowInCombo":false,"comboOrder":5,"featuredOrder":0}
    ];

    const EMBEDDED_CATEGORIES = [
        {"id":"alimentos","name":"Alimentos","icon":"apple","count":23,"active":true,"allowInCombo":true},
        {"id":"aseo","name":"Aseo Personal","icon":"sparkles","count":12,"active":true,"allowInCombo":true},
        {"id":"confituras","name":"Confituras","icon":"cookie","count":4,"active":true,"allowInCombo":true},
        {"id":"bebidas","name":"Bebidas","icon":"coffee","count":4,"active":true,"allowInCombo":true},
        {"id":"bufet","name":"Bufet Cumpleaños","icon":"cake","count":5,"active":true,"allowInCombo":true},
        {"id":"electrodomesticos","name":"Electrodomésticos","icon":"tv","count":5,"active":true,"allowInCombo":false}
    ];

    const EMBEDDED_BUSINESS = {
        name: "MV Bichota",
        tagline: "Todo lo que necesitas, en un solo lugar",
        whatsapp: "+535458602",
        freeDeliveryMin: 50.00
    };

    // ================================================
    // Load Data
    // ================================================
    async function loadData(options = {}) {
        try {
            const data = window.MVStoreData ? await window.MVStoreData.load(options) : await (async()=>{const response=await fetch('data/products.json');return response.json()})();
            allProducts = data.products || EMBEDDED_PRODUCTS;
            storeCategories = data.categories || EMBEDDED_CATEGORIES;
            storeBusiness = data.business || EMBEDDED_BUSINESS;
            window.MV_STORE_CATALOG_SOURCE = data.source || 'json';
        } catch (e) {
            console.warn('Using embedded products:', e.message);
            allProducts = EMBEDDED_PRODUCTS;
            storeCategories = EMBEDDED_CATEGORIES;
            storeBusiness = EMBEDDED_BUSINESS;
        }

        // Filter active products only
        allProducts = allProducts.filter(p => p.active !== false);

        // Calculate real category counts
        storeCategories.forEach(cat => {
            cat.count = allProducts.filter(p => p.category === cat.id).length;
        });

        initCatalog();
        initCategories();
        initSearch();
    }

    // ================================================
    // Catalog - Product Grid
    // ================================================
    function initCatalog() {
        renderProducts();
        setupSortListener();
    }

    function getFilteredProducts() {
        let products = [...allProducts];

        // Filter by category
        if (currentCategory !== 'all') {
            products = products.filter(p => p.category === currentCategory);
        }

        // Sort
        switch (currentSort) {
            case 'price-asc':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'featured':
                products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
                break;
            default:
                // Keep original order (comboOrder)
                products.sort((a, b) => a.comboOrder - b.comboOrder);
        }

        return products;
    }

    function renderProducts() {
        const grid = document.getElementById('productsGrid');
        const countEl = document.getElementById('catalogCount');
        const emptyEl = document.getElementById('catalogEmpty');
        const loadingEl = document.getElementById('catalogLoading');

        if (!grid) return;

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';

        const products = getFilteredProducts();

        if (products.length === 0) {
            grid.innerHTML = '';
            if (emptyEl) emptyEl.style.display = 'flex';
            if (countEl) countEl.textContent = '';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (countEl) {
            const catName = currentCategory === 'all' ? '' : ` en ${getCategoryName(currentCategory)}`;
            countEl.textContent = `${products.length} producto${products.length !== 1 ? 's' : ''}${catName}`;
        }

        grid.innerHTML = products.map(p => createProductCard(p)).join('');

        // Re-init Lucide icons for new elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Attach event listeners to new cards
        attachProductCardListeners();
    }

    function createProductCard(product) {
        const categoryName = getCategoryName(product.category);
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const discount = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

        let badgeHtml = '';
        if (product.featured) {
            badgeHtml = '<div class="product-card__badge new">Popular</div>';
        } else if (discount > 0) {
            badgeHtml = `<div class="product-card__badge">-${discount}%</div>`;
        }

        return `
            <div class="product-card" data-id="${product.id}" data-category="${product.category}">
                ${badgeHtml}
                <button class="product-card__wishlist" aria-label="Agregar ${product.name} a favoritos" tabindex="0">
                    <i data-lucide="heart"></i>
                </button>
                <div class="product-card__image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" width="300" height="300">
                </div>
                <div class="product-card__content">
                    <span class="product-card__category">${categoryName}</span>
                    <h3 class="product-card__title">${product.name}</h3>
                    <p class="product-card__description">${product.description || ''}</p>
                    <div class="product-card__price">
                        ${hasDiscount ? `<span class="price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                    </div>
                    <button class="product-card__cart-btn" data-product-id="${product.id}" aria-label="Agregar ${product.name} al carrito">
                        <i data-lucide="shopping-cart"></i>
                        + Agregar
                    </button>
                </div>
            </div>
        `;
    }

    function attachProductCardListeners() {
        // Cart buttons
        document.querySelectorAll('.product-card__cart-btn').forEach(btn => {
            // Remove existing listeners to avoid duplicates
            btn.removeEventListener('click', handleAddToCart);
            btn.addEventListener('click', handleAddToCart);
        });

        // Wishlist buttons
        document.querySelectorAll('.product-card__wishlist').forEach(btn => {
            btn.removeEventListener('click', handleWishlistToggle);
            btn.addEventListener('click', handleWishlistToggle);
        });
    }

    function handleAddToCart(e) {
        e.preventDefault();
        e.stopPropagation();

        const productId = this.dataset.productId || this.closest('.product-card')?.dataset.id;
        if (!productId) return;

        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        if (window.mvCart) {
            window.mvCart.addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: getCategoryName(product.category),
                unit: product.unit || 'unidad'
            });
        }

        // Button animation
        this.style.transform = 'scale(0.95)';
        this.innerHTML = '<i data-lucide="check"></i> Agregado';
        this.style.background = '#10B981';

        setTimeout(() => {
            this.style.transform = '';
            this.innerHTML = '<i data-lucide="shopping-cart"></i> + Agregar';
            this.style.background = '';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 1200);
    }

    function handleWishlistToggle(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.toggle('active');
        const icon = this.querySelector('i');
        if (this.classList.contains('active')) {
            icon.style.fill = 'currentColor';
        } else {
            icon.style.fill = 'none';
        }
    }

    function setupSortListener() {
        const sortSelect = document.getElementById('sortSelect');
        if (!sortSelect) return;
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            renderProducts();
        });
    }

    // ================================================
    // Categories
    // ================================================
    function initCategories() {
        const grid = document.getElementById('categoriesGrid');
        const filtersContainer = document.getElementById('catalogFilters');

        if (grid) {
            grid.innerHTML = storeCategories.map(cat => `
                <a href="#catalogo" class="category-card" data-category="${cat.id}" aria-label="Ver productos de ${cat.name}">
                    <div class="category-card__image">
                        <img src="${getCategoryImage(cat.id)}" alt="${cat.name}" loading="lazy" width="400" height="500">
                        <div class="category-card__overlay">
                            <h3 class="category-card__name">${cat.name}</h3>
                            <span class="category-card__count">${cat.count} producto${cat.count !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </a>
            `).join('');

            // Category click handlers
            grid.querySelectorAll('.category-card').forEach(card => {
                card.addEventListener('click', function(e) {
                    e.preventDefault();
                    const catId = this.dataset.category;
                    setCatalogCategory(catId);
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
                });
            });
        }

        if (filtersContainer) {
            // Add category filter buttons
            storeCategories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'catalog__filter';
                btn.dataset.category = cat.id;
                btn.setAttribute('role', 'tab');
                btn.setAttribute('aria-selected', 'false');
                btn.textContent = cat.name;
                filtersContainer.appendChild(btn);
            });

            // Filter click handlers
            filtersContainer.querySelectorAll('.catalog__filter').forEach(btn => {
                btn.addEventListener('click', function() {
                    filtersContainer.querySelectorAll('.catalog__filter').forEach(b => {
                        b.classList.remove('active');
                        b.setAttribute('aria-selected', 'false');
                    });
                    this.classList.add('active');
                    this.setAttribute('aria-selected', 'true');
                    currentCategory = this.dataset.category;
                    renderProducts();
                });
            });
        }
    }

    function setCatalogCategory(catId) {
        currentCategory = catId;
        const filtersContainer = document.getElementById('catalogFilters');
        if (filtersContainer) {
            filtersContainer.querySelectorAll('.catalog__filter').forEach(b => {
                b.classList.toggle('active', b.dataset.category === catId);
                b.setAttribute('aria-selected', b.dataset.category === catId ? 'true' : 'false');
            });
        }
        renderProducts();
    }

    function getCategoryName(catId) {
        const cat = storeCategories.find(c => c.id === catId);
        if (cat) return cat.name;
        // Fallback for HTML category names
        const names = {
            alimentos: 'Alimentos', aseo: 'Aseo Personal', confituras: 'Confituras',
            bebidas: 'Bebidas', bufet: 'Bufet Cumpleaños', electrodomesticos: 'Electrodomésticos'
        };
        return names[catId] || catId;
    }

    function getCategoryImage(catId) {
        const images = {
            alimentos: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=500&fit=crop',
            aseo: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=500&fit=crop',
            confituras: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=500&fit=crop',
            bebidas: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=500&fit=crop',
            bufet: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=500&fit=crop',
            electrodomesticos: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=500&fit=crop'
        };
        return images[catId] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=500&fit=crop';
    }

    // ================================================
    // Search
    // ================================================
    function initSearch() {
        const toggle = document.getElementById('searchToggle');
        const overlay = document.getElementById('searchOverlay');
        const closeBtn = document.getElementById('searchClose');
        const input = document.getElementById('searchInput');

        if (!toggle || !overlay || !input) return;

        toggle.addEventListener('click', function() {
            overlay.classList.add('active');
            overlay.setAttribute('aria-hidden', 'false');
            setTimeout(() => input.focus(), 300);
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
                input.value = '';
                renderSearchResults('');
            });
        }

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
                input.value = '';
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                overlay.classList.remove('active');
                overlay.setAttribute('aria-hidden', 'true');
                input.value = '';
            }
        });

        // Search input
        let searchTimeout;
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                renderSearchResults(this.value.trim());
            }, 200);
        });
    }

    function renderSearchResults(query) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (!query || query.length < 2) {
            container.innerHTML = '<p class="search-overlay__hint">Escribe al menos 2 caracteres para buscar</p>';
            return;
        }

        const lowerQuery = query.toLowerCase();
        const results = allProducts.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            getCategoryName(p.category).toLowerCase().includes(lowerQuery)
        );

        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-overlay__empty">
                    <i data-lucide="search-x"></i>
                    <p>No se encontraron productos para "${query}"</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <p class="search-overlay__count">${results.length} resultado${results.length !== 1 ? 's' : ''}</p>
            <div class="search-overlay__list">
                ${results.map(p => `
                    <a href="#catalogo" class="search-result-item" data-product-id="${p.id}" data-category="${p.category}">
                        <img src="${p.image}" alt="${p.name}" class="search-result-item__img" width="50" height="50" loading="lazy">
                        <div class="search-result-item__info">
                            <span class="search-result-item__name">${p.name}</span>
                            <span class="search-result-item__category">${getCategoryName(p.category)}</span>
                        </div>
                        <span class="search-result-item__price">$${p.price.toFixed(2)}</span>
                    </a>
                `).join('')}
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Click handlers for search results
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const catId = this.dataset.category;

                // Close search overlay
                const overlay = document.getElementById('searchOverlay');
                if (overlay) {
                    overlay.classList.remove('active');
                    overlay.setAttribute('aria-hidden', 'true');
                }

                // Set category filter and scroll
                setCatalogCategory(catId);
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // ================================================
    // Header & Navigation
    // ================================================
    function initHeader() {
        const header = document.getElementById('header');
        const hamburger = document.getElementById('hamburgerBtn');
        const mobileNav = document.getElementById('mobileNav');
        const backToTop = document.getElementById('backToTop');

        // Sticky header
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const current = window.scrollY;
            if (header) {
                header.classList.toggle('scrolled', current > 50);
            }
            if (backToTop) {
                backToTop.classList.toggle('visible', current > 500);
            }
            lastScroll = current;
        }, { passive: true });

        // Back to top
        if (backToTop) {
            backToTop.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Hamburger
        if (hamburger && mobileNav) {
            hamburger.addEventListener('click', function() {
                const isActive = this.classList.toggle('active');
                mobileNav.classList.toggle('active');
                this.setAttribute('aria-expanded', isActive);
                document.body.style.overflow = isActive ? 'hidden' : '';
            });

            // Close mobile nav on link click
            mobileNav.querySelectorAll('.mobile-nav__link').forEach(link => {
                link.addEventListener('click', function() {
                    hamburger.classList.remove('active');
                    mobileNav.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });
        }

        // Active nav link on scroll
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        const mobileLinks = document.querySelectorAll('.mobile-nav__link');

        window.addEventListener('scroll', function() {
            const scrollPos = window.scrollY + 150;
            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                const id = section.getAttribute('id');
                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
                    mobileLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
                }
            });
        }, { passive: true });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    const offset = header ? header.offsetHeight : 0;
                    const targetPos = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({
                        top: targetPos,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ================================================
    // Mobile Bottom Nav
    // ================================================
    function initMobileBottomNav() {
        // Active state on scroll
        const navItems = document.querySelectorAll('.mobile-nav-item');
        const sections = document.querySelectorAll('section[id]');

        window.addEventListener('scroll', function() {
            const scrollPos = window.scrollY + 200;
            let currentId = 'inicio';
            sections.forEach(section => {
                if (scrollPos >= section.offsetTop) {
                    currentId = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href) {
                    item.classList.toggle('active', href === `#${currentId}`);
                }
            });
        }, { passive: true });
    }

    // ================================================
    // Hero Combo Button
    // ================================================
    function initHeroComboBtn() {
        const heroBtn = document.getElementById('heroComboBtn');

        function openCombo() {
            // The combo FAB is created dynamically by combo-bar.js
            // Clicking it calls toggleSelector() which uses the '.open' class
            const comboFab = document.getElementById('comboFab');
            if (comboFab) {
                comboFab.click();
            }
        }

        if (heroBtn) heroBtn.addEventListener('click', openCombo);

        // All "open-combo-btn" buttons
        document.querySelectorAll('.open-combo-btn').forEach(btn => {
            btn.addEventListener('click', openCombo);
        });
    }

    // ================================================
    // Scroll Reveal
    // ================================================
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.benefit, .category-card, .product-card, .feature, .testimonial-card, .combo-cta, .promo-banner');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal', 'active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });
    }

    // ================================================
    // Notification System
    // ================================================
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type || ''}`;
        notification.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            background: ${type === 'info' ? '#3B82F6' : '#10B981'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            font-weight: 500;
            font-family: var(--font-sans);
        `;

        if (!document.querySelector('#notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight { from { opacity:0; transform:translateX(100px); } to { opacity:1; transform:translateX(0); } }
                @keyframes slideOutRight { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(100px); } }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ================================================
    // Initialize
    // ================================================
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Load data and initialize
        loadData();

        // Refrescar el catálogo cuando Supabase notifique cambios o el sondeo detecte novedades.
        window.addEventListener('mv:catalog-updated', function(event) {
            const data = event.detail || {};
            allProducts = (data.products || []).filter(p => p.active !== false);
            storeCategories = data.categories || [];
            storeBusiness = data.business || EMBEDDED_BUSINESS;
            window.MV_STORE_CATALOG_SOURCE = data.source || 'supabase';
            storeCategories.forEach(cat => {
                cat.count = allProducts.filter(p => p.category === cat.id).length;
            });
            initCatalog();
            initCategories();
            initSearch();
        });

        // Initialize UI
        initHeader();
        initMobileBottomNav();
        initHeroComboBtn();
        initScrollReveal();

        // Add loaded class
        document.body.classList.add('loaded');
        console.log('MV Bichota initialized successfully');
    });

})();
