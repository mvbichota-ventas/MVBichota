/**
 * MV Bichota - Combo Builder System
 * Floating button + product selector for creating combos
 */

class ComboBuilder {
    constructor() {
        this.products = [];
        this.comboItems = [];
        this.STORAGE_KEY = 'mvbichota_combo';
        this.isPanelOpen = false;
        this.isSelectorOpen = false;
        this.activeCategory = 'all';
        this.selectorSearch = '';
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.loadFromStorage();
        this.cacheDOM();
        this.createFloatingButton();
        this.createProductSelector();
        this.setupEventListeners();
        this.renderComboBar();
        this.renderComboPanel();
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    cacheDOM() {
        this.comboBar = document.getElementById('comboBar');
        this.comboBarCount = document.getElementById('comboBarCount');
        this.comboBarTotal = document.getElementById('comboBarTotal');
        this.comboBarViewBtn = document.getElementById('comboBarViewBtn');
        this.comboPanel = document.getElementById('comboPanel');
        this.comboPanelItems = document.getElementById('comboPanelItems');
        this.comboPanelTotal = document.getElementById('comboPanelTotal');
        this.comboPanelCount = document.getElementById('comboPanelCount');
        this.comboPanelClose = document.querySelector('.combo-panel__close');
        this.comboPanelAddBtn = document.getElementById('comboPanelAddBtn');
        this.comboPanelClearBtn = document.getElementById('comboPanelClearBtn');
    }

    async loadProducts() {
        try {
            const data = window.MVStoreData ? await window.MVStoreData.load() : await (async()=>{const response=await fetch('data/products.json');if(!response.ok)throw new Error('fetch failed');return response.json()})();
            this.products = (data.products || []).filter(p => p.active && p.allowInCombo !== false);
        } catch (error) {
            this.products = this.getEmbeddedProducts();
        }
    }

    getEmbeddedProducts() {
        return [
            {id:"arroz",name:"Arroz",category:"alimentos",price:2.50,unit:"paquete",image:"https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"frijoles-negros",name:"Frijoles Negros",category:"alimentos",price:3.00,unit:"paquete",image:"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"frijoles-cabrioles",name:"Frijoles Cabrioles",category:"alimentos",price:3.50,unit:"libra",image:"https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"espaguetis",name:"Espaguetis",category:"alimentos",price:1.80,unit:"paquete",image:"https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"pollo",name:"Pollo",category:"alimentos",price:8.50,unit:"caja",image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"salchichas",name:"Salchichas",category:"alimentos",price:4.50,unit:"paquete",image:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"higado-pollo",name:"Hígado de Pollo",category:"alimentos",price:3.25,unit:"paquete",image:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"picadillo-pollo",name:"Picadillo de Pollo",category:"alimentos",price:5.00,unit:"caja",image:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"picadillo-original",name:"Picadillo de Pollo Original",category:"alimentos",price:4.75,unit:"tubo",image:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"mortadella",name:"Mortadella de Pollo Original",category:"alimentos",price:4.50,unit:"tubo",image:"https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"azucar",name:"Azúcar",category:"alimentos",price:2.80,unit:"libra",image:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"aceite",name:"Aceite",category:"alimentos",price:3.50,unit:"unidad",image:"https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"huevos",name:"Huevos",category:"alimentos",price:4.00,unit:"docena",image:"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"cerdo",name:"Cerdo",category:"alimentos",price:9.50,unit:"libra",image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"pasta-tomate",name:"Pasta de Tomate",category:"alimentos",price:1.25,unit:"unidad",image:"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"leche-condensada",name:"Leche Condensada",category:"alimentos",price:2.50,unit:"unidad",image:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"leche-polvo",name:"Leche en Polvo",category:"alimentos",price:6.50,unit:"libra",image:"https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"mayonesa",name:"Mayonesa",category:"alimentos",price:3.25,unit:"unidad",image:"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"vinagre",name:"Vinagre",category:"alimentos",price:1.50,unit:"unidad",image:"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"gelatina",name:"Gelatina",category:"alimentos",price:1.00,unit:"unidad",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"maicena",name:"Maicena",category:"alimentos",price:1.75,unit:"unidad",image:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"sazon",name:"Sazón",category:"alimentos",price:1.25,unit:"unidad",image:"https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"queso-blanco",name:"Queso Blanco",category:"alimentos",price:5.50,unit:"libra",image:"https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"jabon-bano",name:"Jabones de Baño",category:"aseo",price:1.50,unit:"unidad",image:"https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"jabon-lavar",name:"Jabones de Lavar",category:"aseo",price:2.00,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"detergente",name:"Detergente",category:"aseo",price:3.50,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"pasta-dental",name:"Pasta Dental",category:"aseo",price:2.75,unit:"unidad",image:"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"champu-crema",name:"Juegos de Champú y Crema",category:"aseo",price:8.50,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"papel-sanitario",name:"Papel Sanitario",category:"aseo",price:1.25,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"desodorante",name:"Desodorante",category:"aseo",price:3.00,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"crema-piel",name:"Crema de la Piel",category:"aseo",price:4.50,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"colonias",name:"Colonias",category:"aseo",price:6.00,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"talco-corporal",name:"Talco Corporal",category:"aseo",price:2.50,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"diarias",name:"Diarias",category:"aseo",price:3.50,unit:"unidad",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"galletas-soda",name:"Galletas de Soda",category:"confituras",price:1.50,unit:"paquete",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"caramelos",name:"Caramelos",category:"confituras",price:2.00,unit:"paquete",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"galletas-dulce",name:"Galletas de Dulce",category:"confituras",price:2.50,unit:"paquete",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"chupa-chupa",name:"Chupa Chupa",category:"confituras",price:1.75,unit:"paquete",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"refrescos-nectar",name:"Refrescos Néctar",category:"bebidas",price:1.50,unit:"unidad",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"refrescos",name:"Refrescos",category:"bebidas",price:1.75,unit:"unidad",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"malta",name:"Malta",category:"bebidas",price:2.00,unit:"unidad",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"ensalada-fria",name:"Ensalada Fría Básica",category:"bufet",price:15.00,unit:"cubeta",image:"https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"helado",name:"Helado",category:"bufet",price:12.00,unit:"cubeta",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"panetelas",name:"Panetelas",category:"bufet",price:3.50,unit:"unidad",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"marquesitas",name:"Marquesitas",category:"bufet",price:2.50,unit:"unidad",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true},
            {id:"tres-leches",name:"Dulce Tres Leches",category:"bufet",price:4.50,unit:"unidad",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,allowInCombo:true}
        ];
    }

    // ================================================
    // Create Floating Button
    // ================================================
    createFloatingButton() {
        const fab = document.createElement('button');
        fab.className = 'combo-fab';
        fab.id = 'comboFab';
        fab.setAttribute('aria-label', 'Arma tu combo');
        fab.setAttribute('aria-live', 'polite');
        fab.innerHTML = `
            <img class="combo-brand-icon" src="assets/images/mv-bichota-icon.webp" alt="">
            <span class="combo-fab__copy">
                <span class="combo-fab__text">Arma tu combo</span>
                <span class="combo-fab__status">Elige tus favoritos</span>
            </span>
            <span class="combo-fab__badge" aria-hidden="true" hidden>0</span>
        `;
        document.body.appendChild(fab);

        // El botón flotante siempre abre el catálogo para seguir agregando productos.
        // El resumen del combo se consulta desde "VER MI COMBO".
        fab.addEventListener('click', () => this.toggleSelector());
    }

    // ================================================
    // Create Product Selector Modal
    // ================================================
    createProductSelector() {
        const selector = document.createElement('div');
        selector.className = 'combo-selector';
        selector.id = 'comboSelector';
        selector.innerHTML = `
            <div class="combo-selector__container">
                <div class="combo-selector__header">
                    <div class="combo-selector__header-main"><h3><img class="combo-brand-icon" src="assets/images/mv-bichota-icon.webp" alt=""> Selecciona productos para tu combo</h3><a class="combo-selector__home" href="index.html#inicio" id="comboSelectorHome"><i data-lucide="arrow-left"></i><span>Volver al inicio</span></a></div>
                    <button class="combo-selector__close" id="comboSelectorClose">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="combo-selector__categories" id="comboSelectorCategories">
                    <button class="combo-selector__cat active" data-category="all">Todos</button>
                </div>
                <label class="combo-selector__search" for="comboSelectorSearch">
                    <i data-lucide="search"></i>
                    <input id="comboSelectorSearch" type="search" placeholder="Buscar productos por nombre..." autocomplete="off">
                    <button type="button" id="comboSelectorSearchClear" aria-label="Limpiar búsqueda" hidden><i data-lucide="x"></i></button>
                </label>
                <div class="combo-selector__products" id="comboSelectorProducts">
                    <!-- Products will be loaded here -->
                </div>
                <section class="combo-selector__selected" id="comboSelectorSelected" aria-label="Productos agregados al combo"></section>
                <div class="combo-selector__footer">
                    <div class="combo-selector__summary">
                        <span id="selectorCount">0 productos</span>
                        <span id="selectorTotal">$0.00</span>
                    </div>
                    <button class="combo-selector__view-btn" id="selectorViewBtn">
                        VER MI COMBO
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(selector);
        
        // Render categories
        this.renderSelectorCategories();
    }

    renderSelectorCategories() {
        const container = document.getElementById('comboSelectorCategories');
        if (!container) return;
        
        const categories = [...new Set(this.products.map(p => p.category))];
        const categoryNames = {
            'alimentos': '🍎 Alimentos',
            'aseo': '✨ Aseo',
            'confituras': '🍪 Confituras',
            'bebidas': '☕ Bebidas',
            'bufet': '🎂 Bufet'
        };
        
        container.innerHTML = `
            <button class="combo-selector__cat active" data-category="all">Todos</button>
            ${categories.map(cat => `
                <button class="combo-selector__cat" data-category="${cat}">
                    ${categoryNames[cat] || cat}
                </button>
            `).join('')}
        `;
        
        // Add click events
        container.querySelectorAll('.combo-selector__cat').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.combo-selector__cat').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeCategory = btn.dataset.category;
                this.renderSelectorProducts(this.activeCategory);
            });
        });
    }

    renderSelectorProducts(category = this.activeCategory || 'all') {
        const container = document.getElementById('comboSelectorProducts');
        if (!container) return;
        this.activeCategory = category;
        const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const query = normalize(this.selectorSearch);
        const filtered = this.products.filter(product => {
            const matchesCategory = category === 'all' || product.category === category;
            const matchesSearch = !query || normalize(product.name).includes(query) || normalize(product.category).includes(query) || normalize(product.unit).includes(query);
            return matchesCategory && matchesSearch;
        });
        
        container.innerHTML = filtered.length ? filtered.map(product => {
            const inCombo = this.comboItems.find(item => item.id === product.id);
            const qty = inCombo ? inCombo.quantity : 0;
            
            return `
                <div class="combo-selector__product ${qty > 0 ? 'in-combo' : ''}">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/80?text=Producto'">
                    <div class="combo-selector__product-info">
                        <h4>${product.name}</h4>
                        <p class="combo-selector__product-price">USD ${Number(product.price || 0).toFixed(2)} / ${product.unit}${product.priceCup != null ? `<span class=\"combo-price-cup\">CUP ${Number(product.priceCup).toFixed(2)}</span>` : ''}</p>
                    </div>
                    <div class="combo-selector__product-actions">
                        ${qty > 0 ? `
                            <div class="combo-selector__qty">
                                <button class="combo-selector__qty-btn" data-id="${product.id}" data-action="minus">-</button>
                                <span>${qty}</span>
                                <button class="combo-selector__qty-btn" data-id="${product.id}" data-action="plus">+</button>
                            </div>
                        ` : `
                            <button class="combo-selector__add-btn" data-id="${product.id}">
                                <i data-lucide="plus"></i> Agregar
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('') : '<div class="combo-selector__empty"><i data-lucide="search-x"></i><strong>No encontramos productos</strong><span>Prueba con otro nombre o categoría</span></div>';
        
        // Add click events
        container.querySelectorAll('.combo-selector__add-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addToCombo(btn.dataset.id));
        });
        
        container.querySelectorAll('.combo-selector__qty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                this.updateQuantity(id, action === 'plus' ? 1 : -1);
            });
        });
        
        // Update footer summary
        this.updateSelectorSummary();
        this.renderSelectorSelected();
        const clearSearch = document.getElementById('comboSelectorSearchClear');
        if (clearSearch) clearSearch.hidden = !this.selectorSearch;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderSelectorSelected() {
        const container = document.getElementById('comboSelectorSelected');
        if (!container) return;
        if (!this.comboItems.length) {
            container.innerHTML = '<div class="combo-selector__selected-empty">Tus productos agregados aparecerán aquí</div>';
            return;
        }
        container.innerHTML = `
            <div class="combo-selector__selected-heading">
                <strong>Tu combo</strong>
                <span>${this.getComboUnitCount()} unidades seleccionadas</span>
            </div>
            <div class="combo-selector__selected-list">
                ${this.comboItems.map(item => `
                    <div class="combo-selector__selected-item" data-id="${item.id}">
                        <button type="button" class="combo-selector__selected-thumb" title="Quitar una unidad de ${item.name}" aria-label="Quitar una unidad de ${item.name}">
                            <img src="${item.image || ''}" alt="" onerror="this.src='https://via.placeholder.com/64?text=+'">
                            <span class="combo-selector__selected-qty">${item.quantity}</span>
                        </button>
                        <span class="combo-selector__selected-name">${item.name}</span>
                    </div>
                `).join('')}
            </div>`;
    }

    updateSelectorSummary() {
        const countEl = document.getElementById('selectorCount');
        const totalEl = document.getElementById('selectorTotal');
        
        if (countEl) {
            const count = this.getComboItemCount();
            countEl.textContent = `${count} producto${count !== 1 ? 's' : ''}`;
        }
        
        if (totalEl) {
            totalEl.textContent = `$${this.getComboTotal().toFixed(2)}`;
        }
    }

    toggleSelector() {
        this.isSelectorOpen = !this.isSelectorOpen;
        const selector = document.getElementById('comboSelector');
        if (selector) {
            selector.classList.toggle('open', this.isSelectorOpen);
        }
        
        if (this.isSelectorOpen) {
            this.closePanel();
            this.renderSelectorProducts();
            document.body.classList.add('combo-overlay-open');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.classList.remove('combo-overlay-open');
            document.body.style.overflow = (this.isPanelOpen || document.body.classList.contains('cart-open')) ? 'hidden' : '';
        }
    }

    closeSelector() {
        this.isSelectorOpen = false;
        const selector = document.getElementById('comboSelector');
        if (selector) {
            selector.classList.remove('open');
        }
        document.body.classList.remove('combo-overlay-open');
        document.body.style.overflow = (this.isPanelOpen || document.body.classList.contains('cart-open')) ? 'hidden' : '';
    }

    // ================================================
    // Combo Management
    // ================================================
    addToCombo(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        if (!product.price || product.price === 0) {
            this.showToast('Este producto requiere cotización', 'warning');
            return;
        }
        
        const existingItem = this.comboItems.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.comboItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                priceCup: product.priceCup == null ? null : Number(product.priceCup),
                unit: product.unit || 'unidad',
                image: product.image || '',
                quantity: 1
            });
        }
        
        this.saveToStorage();
        this.renderSelectorProducts();
        this.renderComboBar();
        this.showToast(`${product.name} agregado al combo`, 'success');
    }

    removeFromCombo(productId) {
        const item = this.comboItems.find(i => i.id === productId);
        this.comboItems = this.comboItems.filter(i => i.id !== productId);
        
        this.saveToStorage();
        this.renderSelectorProducts();
        this.renderComboBar();
        this.renderComboPanel();
        
        if (item) {
            this.showToast(`${item.name} eliminado del combo`, 'info');
        }
    }

    updateQuantity(productId, change) {
        const item = this.comboItems.find(i => i.id === productId);
        if (!item) return;
        
        const newQty = item.quantity + change;
        
        if (newQty <= 0) {
            this.removeFromCombo(productId);
        } else {
            item.quantity = newQty;
            this.saveToStorage();
            this.renderSelectorProducts();
            this.renderComboBar();
            this.renderComboPanel();
        }
    }

    clearCombo() {
        if (this.comboItems.length === 0) return;
        
        // Vaciar el combo de inmediato, sin alertas nativas del navegador.
        this.comboItems = [];
        
        this.saveToStorage();
        this.renderSelectorProducts();
        this.renderComboBar();
        this.renderComboPanel();
        
        this.showToast('Combo vaciado', 'info');
    }

    // ================================================
    // Calculations
    // ================================================
    getComboTotal() {
        return this.comboItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getComboItemCount() {
        return this.comboItems.length;
    }

    getComboUnitCount() {
        return this.comboItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    updateFloatingButton(hasItems, total, itemCount, unitCount) {
        const fab = document.getElementById('comboFab');
        if (!fab) return;

        const label = fab.querySelector('.combo-fab__text');
        const status = fab.querySelector('.combo-fab__status');
        const badge = fab.querySelector('.combo-fab__badge');
        const icon = fab.querySelector('.combo-brand-icon');

        if (label) label.textContent = hasItems ? 'Ver mi combo' : 'Arma tu combo';
        if (status) {
            status.textContent = hasItems
                ? `${itemCount} producto${itemCount !== 1 ? 's' : ''} · ${total.toFixed(2)}`
                : 'Elige tus favoritos';
        }
        if (badge) {
            badge.hidden = !hasItems;
            badge.textContent = String(unitCount);
        }
        if (icon) {
            icon.src = 'assets/images/mv-bichota-icon.webp';
            icon.alt = '';
        }

        fab.classList.toggle('has-items', hasItems);
        fab.setAttribute('aria-label', hasItems
            ? `Ver mi combo: ${itemCount} productos, total ${total.toFixed(2)}`
            : 'Arma tu combo');
        fab.setAttribute('aria-expanded', String(this.isPanelOpen || this.isSelectorOpen));
    }

    // ================================================
    // Render Combo Bar
    // ================================================
    renderComboBar() {
        const hasItems = this.comboItems.length > 0;
        const total = this.getComboTotal();
        const itemCount = this.getComboItemCount();
        const unitCount = this.getComboUnitCount();
        this.updateFloatingButton(hasItems, total, itemCount, unitCount);
        
        if (hasItems) {
            this.showComboBar();
        } else {
            this.hideComboBar();
            return;
        }
        
        // Update bar content
        if (this.comboBarCount) {
            this.comboBarCount.textContent = `${itemCount} producto${itemCount !== 1 ? 's' : ''} · ${unitCount} unidad${unitCount !== 1 ? 'es' : ''}`;
        }
        
        if (this.comboBarTotal) {
            this.comboBarTotal.textContent = `$${total.toFixed(2)}`;
        }
    }

    showComboBar() {
        if (this.comboBar) {
            this.comboBar.classList.add('visible');
        }
    }

    hideComboBar() {
        if (this.comboBar) {
            this.comboBar.classList.remove('visible');
        }
    }

    // ================================================
    // Render Combo Panel
    // ================================================
    renderComboPanel() {
        if (!this.comboPanelItems) return;
        
        if (this.comboItems.length === 0) {
            this.comboPanelItems.innerHTML = `
                <div class="combo-panel__empty">
                    <i data-lucide="package"></i>
                    <p>Tu combo está vacío</p>
                    <p class="combo-panel__empty-sub">Agrega productos del catálogo</p>
                </div>
            `;
        } else {
            this.comboPanelItems.innerHTML = this.comboItems.map(item => this.getPanelItemHTML(item)).join('');
        }
        
        // Update panel totals
        const total = this.getComboTotal();
        const itemCount = this.getComboItemCount();
        const unitCount = this.getComboUnitCount();
        
        if (this.comboPanelTotal) {
            this.comboPanelTotal.textContent = `$${total.toFixed(2)}`;
        }
        
        if (this.comboPanelCount) {
            this.comboPanelCount.textContent = `${itemCount} producto${itemCount !== 1 ? 's' : ''} · ${unitCount} unidad${unitCount !== 1 ? 'es' : ''}`;
        }
        
        if (this.comboPanelAddBtn) {
            this.comboPanelAddBtn.disabled = this.comboItems.length === 0;
        }
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    getPanelItemHTML(item) {
        const subtotal = item.price * item.quantity;
        return `
            <div class="combo-panel-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="combo-panel-item__image" 
                     onerror="this.src='https://via.placeholder.com/60?text=Producto'">
                <div class="combo-panel-item__info">
                    <h4 class="combo-panel-item__name">${item.name}</h4>
                    <p class="combo-panel-item__price">USD ${Number(item.price || 0).toFixed(2)} / ${item.unit}${item.priceCup != null ? `<span class=\"combo-price-cup\">CUP ${Number(item.priceCup).toFixed(2)}</span>` : ''}</p>
                    <p class="combo-panel-item__subtotal">Subtotal: $${subtotal.toFixed(2)}</p>
                </div>
                <div class="combo-panel-item__actions">
                    <div class="combo-panel-item__qty">
                        <button class="combo-panel-qty-btn" data-id="${item.id}" data-action="minus" aria-label="Disminuir">-</button>
                        <span class="combo-panel-qty-value">${item.quantity}</span>
                        <button class="combo-panel-qty-btn" data-id="${item.id}" data-action="plus" aria-label="Aumentar">+</button>
                    </div>
                    <button class="combo-panel-item__remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // ================================================
    // Panel Visibility
    // ================================================
    openPanel() {
        this.closeSelector();
        this.isPanelOpen = true;
        if (this.comboPanel) {
            this.comboPanel.classList.add('open');
            document.body.classList.add('combo-overlay-open');
            document.body.style.overflow = 'hidden';
        }
        this.renderComboPanel();
    }

    closePanel() {
        this.isPanelOpen = false;
        if (this.comboPanel) {
            this.comboPanel.classList.remove('open');
        }
        if (!this.isSelectorOpen) document.body.classList.remove('combo-overlay-open');
        document.body.style.overflow = (this.isSelectorOpen || document.body.classList.contains('cart-open')) ? 'hidden' : '';
    }

    togglePanel() {
        if (this.isPanelOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    // ================================================
    // Add Combo to Cart
    // ================================================
    addToCart() {
        if (this.comboItems.length === 0) {
            this.showToast('Tu combo está vacío. Agrega algunos productos para continuar.', 'warning');
            return;
        }
        
        const total = this.getComboTotal();
        
        const combo = {
            name: 'Combo personalizado',
            type: 'personalizado',
            items: this.comboItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                priceCup: item.priceCup == null ? null : Number(item.priceCup),
                quantity: item.quantity,
                unit: item.unit,
                image: item.image
            })),
            subtotal: total,
            total: total
        };
        
        const cart = window.mvCart;
        if (!cart || typeof cart.addCombo !== 'function' || typeof cart.openCart !== 'function') {
            this.showToast('El carrito todavía no está disponible. Inténtalo nuevamente.', 'error');
            return;
        }

        this.closePanel();
        cart.addCombo(combo);
        this.comboItems = [];
        this.saveToStorage();
        this.renderSelectorProducts();
        this.renderComboBar();
        this.renderComboPanel();
        window.requestAnimationFrame(() => cart.openCart());
        this.showToast('¡Combo agregado al carrito!', 'success');
    }

    // ================================================
    // Event Listeners
    // ================================================
    setupEventListeners() {
        // Selector home link closes the selector without clearing its saved items.
        const selectorHome = document.getElementById('comboSelectorHome');
        if (selectorHome) selectorHome.addEventListener('click', () => this.closeSelector());

        // Selector close button
        const searchInput = document.getElementById('comboSelectorSearch');
        if (searchInput) searchInput.addEventListener('input', () => { this.selectorSearch = searchInput.value; this.renderSelectorProducts(this.activeCategory); });
        const clearSearch = document.getElementById('comboSelectorSearchClear');
        if (clearSearch) clearSearch.addEventListener('click', () => { this.selectorSearch = ''; if (searchInput) { searchInput.value = ''; searchInput.focus(); } this.renderSelectorProducts(this.activeCategory); });
        const selectedStrip = document.getElementById('comboSelectorSelected');
        if (selectedStrip) selectedStrip.addEventListener('click', event => { const thumb = event.target.closest('.combo-selector__selected-thumb'); if (thumb) { const item = thumb.closest('.combo-selector__selected-item'); const product = item && this.comboItems.find(entry => entry.id === item.dataset.id); if (product) this.updateQuantity(product.id, -1); } });

        const selectorClose = document.getElementById('comboSelectorClose');
        if (selectorClose) {
            selectorClose.addEventListener('click', () => this.closeSelector());
        }
        
        // Selector view button
        const selectorViewBtn = document.getElementById('selectorViewBtn');
        if (selectorViewBtn) {
            selectorViewBtn.addEventListener('click', () => this.openPanel());
        }
        
        // Combo bar view button
        if (this.comboBarViewBtn) {
            this.comboBarViewBtn.addEventListener('click', () => this.openPanel());
        }
        
        // Panel home link closes the panel and preserves the saved combo.
        const panelHome = document.getElementById('comboPanelHome');
        if (panelHome) panelHome.addEventListener('click', () => this.closePanel());

        // Panel close button
        if (this.comboPanelClose) {
            this.comboPanelClose.addEventListener('click', () => this.closePanel());
        }
        
        // Panel add to cart button
        if (this.comboPanelAddBtn) {
            this.comboPanelAddBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Panel clear button
        if (this.comboPanelClearBtn) {
            this.comboPanelClearBtn.addEventListener('click', () => this.clearCombo());
        }
        
        // Panel items click events (event delegation)
        if (this.comboPanelItems) {
            this.comboPanelItems.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (!btn) return;
                
                const id = btn.dataset.id;
                if (btn.classList.contains('combo-panel-qty-btn')) {
                    const action = btn.dataset.action;
                    this.updateQuantity(id, action === 'plus' ? 1 : -1);
                } else if (btn.classList.contains('combo-panel-item__remove')) {
                    this.removeFromCombo(id);
                }
            });
        }
        
        // Close selector when clicking outside
        const selector = document.getElementById('comboSelector');
        if (selector) {
            selector.addEventListener('click', (e) => {
                if (e.target === selector) {
                    this.closeSelector();
                }
            });
        }
        
        // Close panel when clicking outside
        if (this.comboPanel) {
            this.comboPanel.addEventListener('click', (e) => {
                if (e.target === this.comboPanel) {
                    this.closePanel();
                }
            });
        }
        
        // Close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.isSelectorOpen) {
                    this.closeSelector();
                } else if (this.isPanelOpen) {
                    this.closePanel();
                }
            }
        });
        
        // Close combo overlays before following Home, Products or Contact.
        // The saved combo itself remains untouched in localStorage.
        document.querySelectorAll('.mobile-bottom-nav a.mobile-nav-item[href]').forEach(link => {
            link.addEventListener('click', () => {
                this.closeSelector();
                this.closePanel();
            });
        });

        // Combo nav button in mobile bottom nav
        const comboNavBtn = document.getElementById('comboNavBtn');
        if (comboNavBtn) {
            comboNavBtn.addEventListener('click', () => this.toggleSelector());
        }
    }

    // ================================================
    // Persistence
    // ================================================
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.comboItems));
        } catch (e) {
            console.error('Error saving combo:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (Array.isArray(data)) {
                    this.comboItems = data.filter(item => 
                        item && item.id && item.name && item.price > 0 && item.quantity > 0
                    );
                }
            }
        } catch (e) {
            console.error('Error loading combo:', e);
            this.comboItems = [];
        }
    }

    // ================================================
    // Toast Notifications
    // ================================================
    showToast(message, type = 'success') {
        const existing = document.querySelector('.combo-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `combo-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.comboBuilder = new ComboBuilder();
});
