/**
 * MV Bichota - Checkout System
 */

class Checkout {
    constructor() {
        this.selectedPaymentMethod = null;
        this.paymentMethods = [];
        
        this.init();
    }

    async init() {
        // Load payment methods
        await this.loadPaymentMethods();
        
        // Render order summary
        this.renderOrderSummary();
        
        // Initialize payment methods UI
        this.initPaymentMethods();
        
        // Initialize form
        this.initForm();
        
        // Initialize icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async loadPaymentMethods() {
        try {
            const response = await fetch('data/products.json');
            const data = await response.json();
            this.paymentMethods = data.paymentMethods.filter(m => m.active);
        } catch (error) {
            console.error('Error loading payment methods:', error);
            this.paymentMethods = [
                { id: 'zelle', name: 'Zelle', instructions: 'Envía el pago a través de Zelle.', surchargePercent: 0 },
                { id: 'efectivo', name: 'Efectivo / CUP', instructions: 'Pago en efectivo al momento de la entrega.', surchargePercent: 0 },
                { id: 'transferencia', name: 'Transferencia Bancaria', instructions: 'Realiza la transferencia a nuestra cuenta.', surchargePercent: 5 }
            ];
        }
    }

    renderOrderSummary() {
        if (!window.mvCart) return;

        const itemsContainer = document.getElementById('orderItems');
        if (!itemsContainer) return;

        itemsContainer.innerHTML = '';

        // Render individual items
        window.mvCart.cart.items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'order-item';
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="order-item__image">
                <div class="order-item__info">
                    <h4 class="order-item__name">${item.name}</h4>
                    <p class="order-item__quantity">Cantidad: ${item.quantity}</p>
                </div>
                <span class="order-item__price">$${(item.price * item.quantity).toFixed(2)}</span>
            `;
            itemsContainer.appendChild(itemEl);
        });

        // Render combos
        window.mvCart.cart.combos.forEach(combo => {
            const comboEl = document.createElement('div');
            comboEl.className = 'order-item';
            
            const itemsList = combo.items.map(item => `${item.name} x${item.quantity}`).join(', ');
            
            comboEl.innerHTML = `
                <div class="order-item__combo-icon">🧩</div>
                <div class="order-item__info">
                    <h4 class="order-item__name">${combo.name}</h4>
                    <p class="order-item__combo-items">${itemsList}</p>
                </div>
                <span class="order-item__price">$${combo.total.toFixed(2)}</span>
            `;
            itemsContainer.appendChild(comboEl);
        });

        this.updateTotals();
    }

    updateTotals() {
        if (!window.mvCart) return;

        const subtotal = window.mvCart.getSubtotal();
        const discount = window.mvCart.getDiscount();
        const delivery = window.mvCart.getDeliveryFee();
        const surcharge = window.mvCart.getSurcharge(this.selectedPaymentMethod);
        const total = window.mvCart.getTotal(this.selectedPaymentMethod);

        document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
        
        // Discount
        const discountRow = document.getElementById('summaryDiscountRow');
        if (discount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('summaryDiscount').textContent = `-$${discount.toFixed(2)}`;
        } else {
            discountRow.style.display = 'none';
        }
        
        // Delivery
        document.getElementById('summaryDelivery').textContent = delivery === 0 ? 'Gratis' : `$${delivery.toFixed(2)}`;
        
        // Surcharge
        const surchargeRow = document.getElementById('summarySurchargeRow');
        const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
        if (surcharge > 0 && method) {
            surchargeRow.style.display = 'flex';
            document.getElementById('surchargePercent').textContent = method.surchargePercent;
            document.getElementById('summarySurcharge').textContent = `$${surcharge.toFixed(2)}`;
        } else {
            surchargeRow.style.display = 'none';
        }
        
        // Total
        document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
    }

    initPaymentMethods() {
        const container = document.getElementById('paymentMethods');
        if (!container) return;

        container.innerHTML = this.paymentMethods.map(method => `
            <div class="payment-method" data-id="${method.id}">
                <div class="payment-method__radio"></div>
                <div class="payment-method__icon">
                    <i data-lucide="${method.id === 'zelle' ? 'smartphone' : method.id === 'efectivo' ? 'banknote' : 'building-2'}"></i>
                </div>
                <div class="payment-method__info">
                    <h4 class="payment-method__name">${method.name}</h4>
                    ${method.surchargePercent > 0 ? `<p class="payment-method__surcharge">+${method.surchargePercent}% de recargo</p>` : ''}
                </div>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.payment-method').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                el.classList.add('selected');
                
                this.selectedPaymentMethod = el.dataset.id;
                
                // Show instructions
                const method = this.paymentMethods.find(m => m.id === this.selectedPaymentMethod);
                const instructionsEl = document.getElementById('paymentInstructions');
                const instructionsText = document.getElementById('paymentInstructionsText');
                
                if (method && method.instructions) {
                    instructionsEl.style.display = 'block';
                    instructionsText.textContent = method.instructions;
                } else {
                    instructionsEl.style.display = 'none';
                }
                
                this.updateTotals();
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });

        // Select first method by default
        if (this.paymentMethods.length > 0) {
            container.querySelector('.payment-method').click();
        }
    }

    initForm() {
        const form = document.getElementById('checkoutForm');
        if (!form) return;

        // Set minimum date to today
        const dateInput = document.getElementById('deliveryDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitOrder();
        });
    }

    submitOrder() {
        // Validate form
        const form = document.getElementById('checkoutForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const customerInfo = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            municipality: formData.get('municipality'),
            address: formData.get('address'),
            reference: formData.get('reference'),
            paymentMethod: this.paymentMethods.find(m => m.id === this.selectedPaymentMethod)?.name || this.selectedPaymentMethod,
            comments: formData.get('comments'),
            deliveryDate: formData.get('deliveryDate'),
            deliveryTime: formData.get('deliveryTime')
        };

        // Send to WhatsApp
        if (window.mvCart) {
            window.mvCart.sendToWhatsApp(customerInfo);
            
            // Show confirmation
            this.showConfirmation();
        } else {
            alert('Error: Sistema de carrito no disponible');
        }
    }

    showConfirmation() {
        const modal = document.createElement('div');
        modal.className = 'checkout-confirmation';
        modal.innerHTML = `
            <div class="checkout-confirmation__content">
                <div class="confirmation-icon">📱</div>
                <h2>Abriendo WhatsApp...</h2>
                <p>Tu pedido será enviado por WhatsApp. Por favor completa los datos si es necesario.</p>
                <p class="confirmation-note">Si WhatsApp no se abrió automáticamente, copia el mensaje y envíalo manualmente.</p>
                <a href="index.html" class="btn btn-primary">Volver a la Tienda</a>
            </div>
        `;

        document.body.appendChild(modal);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .checkout-confirmation {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            .checkout-confirmation__content {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
            }
            .confirmation-icon {
                font-size: 4rem;
                margin-bottom: 20px;
            }
            .checkout-confirmation__content h2 {
                font-family: var(--font-serif);
                font-size: 1.5rem;
                margin-bottom: 10px;
            }
            .checkout-confirmation__content p {
                color: #666;
                margin-bottom: 15px;
            }
            .confirmation-note {
                font-size: 0.875rem;
                color: #999;
                margin-bottom: 30px;
            }
        `;
        document.head.appendChild(style);

        // Clear cart after order
        setTimeout(() => {
            if (window.mvCart) {
                window.mvCart.clearCart();
            }
        }, 2000);
    }
}

// Initialize checkout when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.checkout')) {
        new Checkout();
    }
});