/**
 * MV Bichota - Shopping Cart System
 * Uses localStorage for persistence
 */

// Global cart instance
let mvCart = null;

class MVCart {
    constructor() {
        this.storageKey = 'mvbichota_cart';
        this.cart = this.loadCart();
        this.sidebar = null;
        
        // Create sidebar immediately
        this.createCartSidebar();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update displays
        this.updateCartCount();
        this.updateCartDisplay();
    }

    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : { items: [], combos: [] };
        } catch (e) {
            console.error('Error loading cart:', e);
            return { items: [], combos: [] };
        }
    }

    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.updateCartCount();
            this.updateCartDisplay();
        } catch (e) {
            console.error('Error saving cart:', e);
        }
    }

    // ================================================
    // Items Management
    // ================================================
    addItem(product, quantity = 1) {
        const existingIndex = this.cart.items.findIndex(item => item.id === product.id);
        
        if (existingIndex > -1) {
            this.cart.items[existingIndex].quantity += quantity;
        } else {
            this.cart.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit || 'unidad',
                image: product.image,
                quantity: quantity,
                category: product.category
            });
        }
        
        this.saveCart();
        this.showNotification(`${product.name} agregado al carrito`);
        this.openCart();
    }

    removeItem(productId) {
        const item = this.cart.items.find(i => i.id === productId);
        this.cart.items = this.cart.items.filter(item => item.id !== productId);
        this.saveCart();
        if (item) {
            this.showNotification(`${item.name} eliminado del carrito`, 'info');
        }
    }

    updateItemQuantity(productId, quantity) {
        const item = this.cart.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    // ================================================
    // Combos Management
    // ================================================
    addCombo(combo) {
        const comboId = 'combo-' + Date.now();
        this.cart.combos.push({
            id: comboId,
            name: combo.name || 'Combo Personalizado',
            type: combo.type,
            budget: combo.budget,
            people: combo.people,
            items: combo.items || [],
            subtotal: combo.subtotal,
            discount: combo.discount || 0,
            total: combo.total
        });
        this.saveCart();
        this.showNotification('Combo agregado al carrito');
        this.openCart();
    }

    removeCombo(comboId) {
        const combo = this.cart.combos.find(c => c.id === comboId);
        this.cart.combos = this.cart.combos.filter(combo => combo.id !== comboId);
        this.saveCart();
        if (combo) {
            this.showNotification(`${combo.name} eliminado del carrito`, 'info');
        }
    }

    clearCart() {
        this.cart = { items: [], combos: [] };
        this.saveCart();
        this.showNotification('Carrito vaciado', 'info');
    }

    // ================================================
    // Calculations
    // ================================================
    getSubtotal() {
        let subtotal = 0;
        
        this.cart.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        
        this.cart.combos.forEach(combo => {
            subtotal += combo.total;
        });
        
        return subtotal;
    }

    getDiscount() {
        let discount = 0;
        
        this.cart.combos.forEach(combo => {
            discount += combo.discount || 0;
        });
        
        return discount;
    }

    getDeliveryFee() {
        const subtotal = this.getSubtotal();
        return subtotal >= 50 ? 0 : 5.00;
    }

    getSurcharge(paymentMethodId) {
        const surcharges = {
            'zelle': 0,
            'efectivo': 0,
            'transferencia': 0.05
        };
        
        const rate = surcharges[paymentMethodId] || 0;
        return this.getSubtotal() * rate;
    }

    getTotal(paymentMethodId = 'efectivo') {
        return this.getSubtotal() - this.getDiscount() + this.getDeliveryFee() + this.getSurcharge(paymentMethodId);
    }

    getItemCount() {
        let count = 0;
        
        this.cart.items.forEach(item => {
            count += item.quantity;
        });
        
        this.cart.combos.forEach(combo => {
            combo.items.forEach(item => {
                count += item.quantity;
            });
        });
        
        return count;
    }

    // ================================================
    // Cart UI
    // ================================================
    createCartSidebar() {
        // Remove existing sidebar if any
        const existing = document.getElementById('cartSidebar');
        if (existing) {
            existing.remove();
        }

        // Create sidebar
        this.sidebar = document.createElement('div');
        this.sidebar.id = 'cartSidebar';
        this.sidebar.className = 'cart-sidebar';
        this.sidebar.innerHTML = `
            <div class="cart-sidebar__header">
                <h3>Mi Carrito</h3>
                <button class="close-cart" aria-label="Cerrar carrito">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="cart-items" id="cartItemsContainer">
                <div class="cart-empty">
                    <i data-lucide="shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <p style="font-size: 0.8rem; margin-top: 10px;">Agrega productos para comenzar</p>
                </div>
            </div>
            <div class="cart-summary" id="cartSummary" style="display: none;">
                <div class="cart-summary__row">
                    <span>Subtotal</span>
                    <span id="cartSubtotal">$0.00</span>
                </div>
                <div class="cart-summary__row cart-summary__discount" id="cartDiscountRow" style="display: none;">
                    <span>Descuento</span>
                    <span id="cartDiscount">-$0.00</span>
                </div>
                <div class="cart-summary__row">
                    <span>Entrega</span>
                    <span id="cartDelivery">$5.00</span>
                </div>
                <div class="cart-summary__total">
                    <span>Total</span>
                    <span id="cartTotal">$0.00</span>
                </div>
                <div class="cart-summary__actions">
                    <a href="checkout.html" class="btn btn-primary btn-block">
                        <i data-lucide="credit-card"></i>
                        Ir a Pagar
                    </a>
                    <button class="btn btn-outline btn-block" id="clearCartBtn">
                        <i data-lucide="trash-2"></i>
                        Vaciar Carrito
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.sidebar);

        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Close button - try both class names
        const closeBtn = this.sidebar.querySelector('.close-cart-btn') || this.sidebar.querySelector('.close-cart');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeCart();
            });
        }

        // Clear cart button
        this.sidebar.querySelector('#clearCartBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.clearCart();
        });

        // Cart buttons in header and mobile nav
        document.querySelectorAll('.cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCart();
            });
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.sidebar.classList.contains('open') && 
                !this.sidebar.contains(e.target) && 
                !e.target.closest('.cart-btn')) {
                this.closeCart();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.sidebar.classList.contains('open')) {
                this.closeCart();
            }
        });
    }

    openCart() {
        if (this.sidebar) {
            this.sidebar.classList.add('open');
            document.body.style.overflow = 'hidden';
            
            // Refresh icons
            if (typeof lucide !== 'undefined') {
                setTimeout(() => lucide.createIcons(), 100);
            }
        }
    }

    closeCart() {
        if (this.sidebar) {
            this.sidebar.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    toggleCart() {
        if (this.sidebar.classList.contains('open')) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    // ================================================
    // UI Updates
    // ================================================
    updateCartCount() {
        const count = this.getItemCount();
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    updateCartDisplay() {
        const itemsContainer = document.getElementById('cartItemsContainer');
        const summary = document.getElementById('cartSummary');
        const emptyMsg = this.sidebar.querySelector('.cart-empty');
        
        if (!itemsContainer) return;

        const hasItems = this.cart.items.length > 0 || this.cart.combos.length > 0;

        // Show/hide empty message
        if (emptyMsg) {
            emptyMsg.style.display = hasItems ? 'none' : 'flex';
        }
        
        // Show/hide summary
        if (summary) {
            summary.style.display = hasItems ? 'block' : 'none';
        }

        // Clear and rebuild items
        itemsContainer.innerHTML = '';

        if (!hasItems) {
            itemsContainer.innerHTML = `
                <div class="cart-empty">
                    <i data-lucide="shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <p style="font-size: 0.8rem; margin-top: 10px;">Agrega productos para comenzar</p>
                </div>
            `;
        } else {
            // Render individual items
            this.cart.items.forEach(item => {
                itemsContainer.appendChild(this.createCartItemHTML(item));
            });

            // Render combos
            this.cart.combos.forEach(combo => {
                itemsContainer.appendChild(this.createComboItemHTML(combo));
            });
        }

        // Update summary
        this.updateSummary();

        // Refresh icons
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }

    createCartItemHTML(item) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item__image" onerror="this.src='https://via.placeholder.com/60?text=Producto'">
            <div class="cart-item__info">
                <h4 class="cart-item__name">${item.name}</h4>
                <p class="cart-item__price">$${item.price.toFixed(2)} / ${item.unit}</p>
                <div class="cart-item__quantity">
                    <button class="qty-btn qty-minus" data-id="${item.id}">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="cart-item__remove" data-id="${item.id}" aria-label="Eliminar ${item.name}">
                <i data-lucide="trash-2"></i>
                <span>Eliminar</span>
            </button>
        `;

        // Event listeners
        div.querySelector('.qty-minus').addEventListener('click', () => {
            this.updateItemQuantity(item.id, item.quantity - 1);
        });

        div.querySelector('.qty-plus').addEventListener('click', () => {
            this.updateItemQuantity(item.id, item.quantity + 1);
        });

        div.querySelector('.cart-item__remove').addEventListener('click', () => {
            this.removeItem(item.id);
        });

        return div;
    }

    createComboItemHTML(combo) {
        const div = document.createElement('div');
        div.className = 'cart-item cart-combo';
        
        const itemsList = combo.items.map(item => 
            `${item.name} x${item.quantity}`
        ).join(', ');

        div.innerHTML = `
            <div class="cart-item__combo-icon">🧩</div>
            <div class="cart-item__info">
                <h4 class="cart-item__name">${combo.name}</h4>
                <p class="cart-item__combo-items">${itemsList || 'Combo personalizado'}</p>
                <p class="cart-item__price">$${combo.total.toFixed(2)}</p>
            </div>
            <button class="cart-item__remove combo-remove" data-combo-id="${combo.id}" aria-label="Eliminar combo">
                <i data-lucide="trash-2"></i>
                <span>Eliminar</span>
            </button>
        `;

        div.querySelector('.combo-remove').addEventListener('click', () => {
            this.removeCombo(combo.id);
        });

        return div;
    }

    updateSummary() {
        const subtotal = this.getSubtotal();
        const discount = this.getDiscount();
        const delivery = this.getDeliveryFee();
        const total = this.getTotal();

        const subtotalEl = document.getElementById('cartSubtotal');
        const discountEl = document.getElementById('cartDiscount');
        const discountRow = document.getElementById('cartDiscountRow');
        const deliveryEl = document.getElementById('cartDelivery');
        const totalEl = document.getElementById('cartTotal');

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (discountEl) discountEl.textContent = `-$${discount.toFixed(2)}`;
        if (discountRow) discountRow.style.display = discount > 0 ? 'flex' : 'none';
        if (deliveryEl) deliveryEl.textContent = delivery === 0 ? 'Gratis' : `$${delivery.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // ================================================
    // Notifications
    // ================================================
    showNotification(message, type = 'success') {
        // Remove existing notification
        const existing = document.querySelector('.mv-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'mv-notification';
        
        // Set icon and color based on type
        let icon = '✅';
        let bgColor = '#10B981';
        
        if (type === 'error') {
            icon = '❌';
            bgColor = '#EF4444';
        } else if (type === 'info') {
            icon = 'ℹ️';
            bgColor = '#3B82F6';
        }
        
        notification.innerHTML = `<span>${icon} ${message}</span>`;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            font-weight: 500;
            z-index: 100000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // ================================================
    // WhatsApp Integration
    // ================================================
    generateWhatsAppMessage(customerInfo = {}) {
        let message = `Hola, quiero realizar un pedido en MV Bichota.\n\n`;
        
        message += `*PEDIDO:*\n`;
        
        if (this.cart.items.length > 0) {
            message += `\n*Productos:*\n`;
            this.cart.items.forEach(item => {
                message += `- ${item.name} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})\n`;
            });
        }
        
        if (this.cart.combos.length > 0) {
            message += `\n*Combos:*\n`;
            this.cart.combos.forEach(combo => {
                message += `\n📦 ${combo.name}:\n`;
                combo.items.forEach(item => {
                    message += `  - ${item.name} x${item.quantity}\n`;
                });
                message += `  Subtotal: $${combo.total.toFixed(2)}\n`;
            });
        }
        
        message += `\n*RESUMEN:*\n`;
        message += `Subtotal: $${this.getSubtotal().toFixed(2)}\n`;
        
        const discount = this.getDiscount();
        if (discount > 0) {
            message += `Descuento: -$${discount.toFixed(2)}\n`;
        }
        
        message += `Entrega: ${this.getDeliveryFee() === 0 ? 'Gratis' : '$' + this.getDeliveryFee().toFixed(2)}\n`;
        message += `*TOTAL: $${this.getTotal().toFixed(2)}*\n`;
        
        if (customerInfo.name) {
            message += `\n*CLIENTE:*\n`;
            message += `Nombre: ${customerInfo.name}\n`;
            message += `WhatsApp: ${customerInfo.phone}\n`;
            message += `Municipio: ${customerInfo.municipality}\n`;
            message += `Dirección: ${customerInfo.address}\n`;
            if (customerInfo.reference) message += `Referencia: ${customerInfo.reference}\n`;
            message += `Método de pago: ${customerInfo.paymentMethod}\n`;
            if (customerInfo.comments) message += `Comentarios: ${customerInfo.comments}\n`;
            if (customerInfo.deliveryDate) message += `Fecha de entrega: ${customerInfo.deliveryDate}\n`;
            if (customerInfo.deliveryTime) message += `Horario preferido: ${customerInfo.deliveryTime}\n`;
        }
        
        return message;
    }

    sendToWhatsApp(customerInfo = {}) {
        const message = this.generateWhatsAppMessage(customerInfo);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/535458602?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }
}

// ================================================
// Initialize cart when DOM is ready
// ================================================
document.addEventListener('DOMContentLoaded', () => {
    mvCart = new MVCart();
    window.mvCart = mvCart;
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
            from { opacity: 1; transform: translateX(0); }
            to { opacity: 0; transform: translateX(100px); }
        }
    `;
    document.head.appendChild(style);
});