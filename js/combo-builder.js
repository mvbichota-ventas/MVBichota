/**
 * MV Bichota - Combo Builder
 * Multi-step combo creation system
 */

class ComboBuilder {
    constructor() {
        this.currentStep = 1;
        this.selectedType = null;
        this.selectedBudget = 0;
        this.customBudget = 0;
        this.selectedPeople = 0;
        this.selectedProducts = [];
        this.products = [];
        this.comboTypes = [];
        this.budgetOptions = [];
        this.peopleOptions = [];
        
        this.init();
    }

    async init() {
        // Load data
        await this.loadData();
        
        // Initialize UI
        this.initComboTypes();
        this.initBudgetOptions();
        this.initPeopleOptions();
        this.initEventListeners();
        this.initFilters();
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadData() {
        try {
            const data = window.MVStoreData ? await window.MVStoreData.load() : await (async()=>{const response=await fetch('data/products.json');return response.json()})();
            
            this.products = data.products;
            this.comboTypes = data.comboTypes;
            this.budgetOptions = data.budgetOptions;
            this.peopleOptions = data.peopleOptions;
        } catch (error) {
            console.error('Error loading data:', error);
            // Use default data
            this.comboTypes = [
                { id: 'cumpleanos', name: 'Cumpleaños', icon: '🎂', description: 'Para celebrar tu día especial' },
                { id: 'regalo', name: 'Regalo', icon: '🎁', description: 'Sorprende a alguien especial' },
                { id: 'comida', name: 'Comida', icon: '🍖', description: 'Combos para compartir' },
                { id: 'mercado', name: 'Mercado', icon: '🛒', description: 'Lo básico para tu hogar' },
                { id: 'aseo', name: 'Aseo', icon: '🧹', description: 'Limpieza y cuidado personal' },
                { id: 'personalizado', name: 'Personalizado', icon: '💝', description: 'Crea tu combo ideal' }
            ];
            this.budgetOptions = [
                { value: 25, label: '$25' },
                { value: 50, label: '$50' },
                { value: 75, label: '$75' },
                { value: 100, label: '$100' },
                { value: 150, label: '$150' },
                { value: 0, label: 'Otro' }
            ];
            this.peopleOptions = [
                { value: 10, label: '10 personas' },
                { value: 20, label: '20 personas' },
                { value: 30, label: '30 personas' },
                { value: 40, label: '40 personas' },
                { value: 50, label: '50 personas' },
                { value: 0, label: 'Personalizado' }
            ];
        }
    }

    // ================================================
    // Step 1: Combo Type
    // ================================================
    initComboTypes() {
        const grid = document.getElementById('comboTypeGrid');
        if (!grid) return;

        grid.innerHTML = this.comboTypes.map(type => `
            <div class="combo-type-card" data-id="${type.id}">
                <div class="combo-type-card__icon">${type.icon}</div>
                <h3 class="combo-type-card__name">${type.name}</h3>
                <p class="combo-type-card__desc">${type.description}</p>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.combo-type-card').forEach(card => {
            card.addEventListener('click', () => {
                grid.querySelectorAll('.combo-type-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.selectedType = this.comboTypes.find(t => t.id === card.dataset.id);
                document.getElementById('nextStep1').disabled = false;
            });
        });
    }

    // ================================================
    // Step 2: Budget & People
    // ================================================
    initBudgetOptions() {
        const container = document.getElementById('budgetOptions');
        if (!container) return;

        container.innerHTML = this.budgetOptions.map(option => `
            <button class="budget-option" data-value="${option.value}">${option.label}</button>
        `).join('');

        container.querySelectorAll('.budget-option').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.budget-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                const value = parseInt(btn.dataset.value);
                const customBudgetEl = document.getElementById('customBudget');
                
                if (value === 0) {
                    customBudgetEl.style.display = 'block';
                    this.selectedBudget = 0;
                } else {
                    customBudgetEl.style.display = 'none';
                    this.selectedBudget = value;
                    this.customBudget = 0;
                }
            });
        });

        // Custom budget input
        const budgetInput = document.getElementById('budgetInput');
        if (budgetInput) {
            budgetInput.addEventListener('input', (e) => {
                this.customBudget = parseFloat(e.target.value) || 0;
                this.selectedBudget = this.customBudget;
            });
        }
    }

    initPeopleOptions() {
        const container = document.getElementById('peopleOptions');
        if (!container) return;

        container.innerHTML = this.peopleOptions.map(option => `
            <button class="people-option" data-value="${option.value}">${option.label}</button>
        `).join('');

        container.querySelectorAll('.people-option').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.people-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedPeople = parseInt(btn.dataset.value);
            });
        });
    }

    // ================================================
    // Step 3: Products
    // ================================================
    initFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderProducts(btn.dataset.category);
            });
        });
    }

    renderProducts(category = 'all') {
        const grid = document.getElementById('comboProductsGrid');
        if (!grid) return;

        let filteredProducts = this.products.filter(p => p.active && p.allowInCombo);
        
        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }

        // Sort by combo order
        filteredProducts.sort((a, b) => (a.comboOrder || 0) - (b.comboOrder || 0));

        grid.innerHTML = filteredProducts.map(product => {
            const selected = this.selectedProducts.find(p => p.id === product.id);
            const quantity = selected ? selected.quantity : 0;
            const outOfStock = product.stock <= 0;

            return `
                <div class="combo-product-card ${outOfStock ? 'unavailable' : ''}" data-id="${product.id}">
                    <img src="${product.image}" alt="${product.name}" class="combo-product__image">
                    <div class="combo-product__info">
                        <span class="combo-product__category">${product.category}</span>
                        <h4 class="combo-product__name">${product.name}</h4>
                        <p class="combo-product__price">$${product.price.toFixed(2)} <span class="combo-product__unit">/ ${product.unit}</span></p>
                        ${outOfStock ? '<p style="color: #EF4444; font-size: 0.75rem;">Sin stock</p>' : ''}
                    </div>
                    <div class="combo-product__quantity">
                        <button class="qty-btn qty-minus" data-id="${product.id}" ${quantity === 0 ? 'disabled' : ''}>-</button>
                        <span class="qty-value">${quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${product.id}" ${outOfStock ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        grid.querySelectorAll('.qty-plus').forEach(btn => {
            btn.addEventListener('click', () => this.updateProductQuantity(btn.dataset.id, 1));
        });

        grid.querySelectorAll('.qty-minus').forEach(btn => {
            btn.addEventListener('click', () => this.updateProductQuantity(btn.dataset.id, -1));
        });

        this.updateBudgetDisplay();
        this.renderSuggestions();
    }

    updateProductQuantity(productId, change) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingIndex = this.selectedProducts.findIndex(p => p.id === productId);
        
        if (existingIndex > -1) {
            const newQuantity = this.selectedProducts[existingIndex].quantity + change;
            
            if (newQuantity <= 0) {
                this.selectedProducts.splice(existingIndex, 1);
            } else if (newQuantity <= product.stock) {
                this.selectedProducts[existingIndex].quantity = newQuantity;
            }
        } else if (change > 0) {
            this.selectedProducts.push({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                quantity: 1,
                category: product.category
            });
        }

        // Re-render products
        const activeFilter = document.querySelector('.filter-btn.active');
        this.renderProducts(activeFilter ? activeFilter.dataset.category : 'all');
    }

    updateBudgetDisplay() {
        const budget = this.selectedBudget || this.customBudget;
        const selected = this.getSelectedTotal();
        const available = budget - selected;
        
        document.getElementById('budgetDisplay').textContent = budget > 0 ? `$${budget.toFixed(2)}` : 'Libre';
        document.getElementById('selectedDisplay').textContent = `$${selected.toFixed(2)}`;
        document.getElementById('availableDisplay').textContent = budget > 0 ? `$${available.toFixed(2)}` : 'Libre';
        
        // Update progress bar
        const fill = document.getElementById('budgetFill');
        const warning = document.getElementById('budgetWarning');
        
        if (budget > 0) {
            const percentage = Math.min((selected / budget) * 100, 100);
            fill.style.width = `${percentage}%`;
            fill.classList.toggle('over-budget', selected > budget);
            warning.style.display = selected > budget ? 'flex' : 'none';
        } else {
            fill.style.width = '0%';
            fill.classList.remove('over-budget');
            warning.style.display = 'none';
        }
    }

    getSelectedTotal() {
        return this.selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    }

    renderSuggestions() {
        const container = document.getElementById('comboSuggestions');
        const list = document.getElementById('suggestionsList');
        
        if (!container || !list) return;

        // Get categories of selected products
        const selectedCategories = [...new Set(this.selectedProducts.map(p => p.category))];
        
        // Find products in those categories that aren't selected
        const suggestions = this.products
            .filter(p => p.active && p.allowInCombo && 
                        !this.selectedProducts.find(sp => sp.id === p.id) &&
                        selectedCategories.includes(p.category))
            .slice(0, 5);

        if (suggestions.length > 0 && this.selectedProducts.length > 0) {
            container.style.display = 'block';
            list.innerHTML = suggestions.map(p => `
                <div class="suggestion-item" data-id="${p.id}">
                    + ${p.name}
                </div>
            `).join('');

            list.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.updateProductQuantity(item.dataset.id, 1);
                });
            });
        } else {
            container.style.display = 'none';
        }
    }

    // ================================================
    // Step 4: Summary
    // ================================================
    renderSummary() {
        const budget = this.selectedBudget || this.customBudget;
        
        document.getElementById('summaryTypeIcon').textContent = this.selectedType?.icon || '💝';
        document.getElementById('summaryTypeName').textContent = this.selectedType?.name || 'Combo Personalizado';
        document.getElementById('summaryTypeDesc').textContent = this.selectedType?.description || '';
        
        document.getElementById('summaryBudget').textContent = budget > 0 ? `$${budget.toFixed(2)}` : 'Libre';
        document.getElementById('summaryPeople').textContent = this.selectedPeople > 0 ? `${this.selectedPeople} personas` : 'No especificado';
        
        const itemsList = document.getElementById('summaryItemsList');
        itemsList.innerHTML = this.selectedProducts.map(p => `
            <li>
                <span>${p.name} x${p.quantity}</span>
                <span>$${(p.price * p.quantity).toFixed(2)}</span>
            </li>
        `).join('');

        const subtotal = this.getSelectedTotal();
        const discount = this.calculateDiscount(subtotal);
        const total = subtotal - discount;

        document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('summaryDiscount').textContent = `-$${discount.toFixed(2)}`;
        document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
        
        document.getElementById('summaryDiscountRow').style.display = discount > 0 ? 'flex' : 'none';
    }

    calculateDiscount(subtotal) {
        // Example discount rules
        if (subtotal >= 100) {
            return subtotal * 0.05; // 5% off for orders over $100
        }
        return 0;
    }

    // ================================================
    // Navigation
    // ================================================
    goToStep(step) {
        // Hide current step
        document.getElementById(`comboStep${this.currentStep}`).classList.remove('active');
        
        // Show new step
        document.getElementById(`comboStep${step}`).classList.add('active');
        
        // Update progress
        document.querySelectorAll('.combo-progress__step').forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            if (index + 1 < step) {
                stepEl.classList.add('completed');
            } else if (index + 1 === step) {
                stepEl.classList.add('active');
            }
        });
        
        this.currentStep = step;
        
        // Initialize step content
        if (step === 3) {
            this.renderProducts();
        } else if (step === 4) {
            this.renderSummary();
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ================================================
    // Event Listeners
    // ================================================
    initEventListeners() {
        // Step 1 navigation
        document.getElementById('nextStep1')?.addEventListener('click', () => {
            if (this.selectedType) {
                this.goToStep(2);
            }
        });

        // Step 2 navigation
        document.getElementById('backStep2')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('nextStep2')?.addEventListener('click', () => this.goToStep(3));

        // Step 3 navigation
        document.getElementById('backStep3')?.addEventListener('click', () => this.goToStep(2));
        document.getElementById('nextStep3')?.addEventListener('click', () => this.goToStep(4));

        // Step 4 navigation
        document.getElementById('backStep4')?.addEventListener('click', () => this.goToStep(3));
        document.getElementById('addToCartBtn')?.addEventListener('click', () => this.addComboToCart());
    }

    // ================================================
    // Add to Cart
    // ================================================
    addComboToCart() {
        const budget = this.selectedBudget || this.customBudget;
        const subtotal = this.getSelectedTotal();
        const discount = this.calculateDiscount(subtotal);
        const total = subtotal - discount;

        const combo = {
            name: `${this.selectedType?.name || 'Combo'} - ${this.selectedPeople > 0 ? this.selectedPeople + ' personas' : 'Personalizado'}`,
            type: this.selectedType?.id || 'personalizado',
            budget: budget,
            people: this.selectedPeople,
            items: [...this.selectedProducts],
            subtotal: subtotal,
            discount: discount,
            total: total
        };

        if (!window.mvCart || typeof window.mvCart.addCombo !== 'function') {
            this.showSuccessMessage('No se pudo abrir el carrito. Actualiza la página e inténtalo de nuevo.', true);
            return;
        }
        window.mvCart.addCombo(combo);
        window.requestAnimationFrame(() => window.mvCart?.openCart?.());
        this.showSuccessMessage('¡Combo agregado! El carrito está abierto.');
    }

    showSuccessMessage(message = '¡Combo agregado al carrito!', isError = false) {
        const toast = document.createElement('div');
        toast.className = 'combo-builder-toast' + (isError ? ' is-error' : '');
        toast.setAttribute('role', 'status');
        toast.textContent = message;
        document.body.appendChild(toast);
        window.setTimeout(() => toast.classList.add('is-visible'), 10);
        window.setTimeout(() => {
            toast.classList.remove('is-visible');
            window.setTimeout(() => toast.remove(), 220);
        }, 3000);
    }
}

// Initialize combo builder when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.combo-builder')) {
        new ComboBuilder();
    }
});