/**
 * MV Bichota - Product Carousel System
 * Featured products carousel with touch/swipe support
 */

class ProductCarousel {
    constructor() {
        this.products = [];
        this.featuredProducts = [];
        this.currentIndex = 0;
        this.itemsPerView = 4;
        this.autoplayInterval = null;
        this.autoplayDelay = 4000;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDragging = false;
        this.startX = 0;
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupCarousel();
        this.setupTouchEvents();
        
        setTimeout(() => {
            this.setupAutoplay();
        }, 1000);
    }

    async loadProducts() {
        try {
            const data = window.MVStoreData ? await window.MVStoreData.load() : await (async()=>{const response=await fetch('data/products.json');if(!response.ok)throw new Error('fetch failed');return response.json()})();
            this.products = data.products || [];
        } catch (error) {
            this.products = this.getEmbeddedProducts();
        }
        
        this.featuredProducts = this.products
            .filter(p => p.active && p.featured)
            .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0));
    }

    getEmbeddedProducts() {
        return [
            {id:"arroz",name:"Arroz",category:"alimentos",price:2.50,unit:"paquete",image:"https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:1,stock:100},
            {id:"pollo",name:"Pollo",category:"alimentos",price:8.50,unit:"caja",image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:2,stock:50},
            {id:"huevos",name:"Huevos",category:"alimentos",price:4.00,unit:"docena",image:"https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:3,stock:200},
            {id:"cerdo",name:"Cerdo",category:"alimentos",price:9.50,unit:"libra",image:"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:4,stock:40},
            {id:"galletas-dulce",name:"Galletas de Dulce",category:"confituras",price:2.50,unit:"paquete",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:5,stock:80},
            {id:"helado",name:"Helado",category:"bufet",price:12.00,unit:"cubeta",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:6,stock:25},
            {id:"tres-leches",name:"Dulce Tres Leches",category:"bufet",price:4.50,unit:"unidad",image:"https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:7,stock:35},
            {id:"ventilador",name:"Ventilador Recargable F6",category:"electrodomesticos",price:28.00,unit:"unidad",image:"https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",active:true,featured:true,featuredOrder:8,stock:20}
        ];
    }

    setupCarousel() {
        const track = document.getElementById('carouselTrack');
        if (!track || this.featuredProducts.length === 0) return;

        this.renderProducts(track);
        this.calculateItemsPerView();
        this.createDots();
        this.setupNavigation();
        this.goToSlide(0);
        
        window.addEventListener('resize', () => {
            this.calculateItemsPerView();
            this.goToSlide(0);
        });
    }

    renderProducts(track) {
        track.innerHTML = this.featuredProducts.map(product => {
            const hasDiscount = product.oldPrice && product.oldPrice > product.price;
            const discount = hasDiscount ? Math.round((1 - product.price / product.oldPrice) * 100) : 0;
            const outOfStock = product.stock <= 0;
            
            return `
                <div class="carousel__item">
                    <div class="carousel-card" data-id="${product.id}">
                        <div class="carousel-card__image">
                            <div class="carousel-card__badges">
                                ${hasDiscount ? `<span class="carousel-card__badge carousel-card__badge--sale">-${discount}%</span>` : ''}
                                ${product.featuredOrder <= 3 ? `<span class="carousel-card__badge carousel-card__badge--new">Nuevo</span>` : ''}
                                ${outOfStock ? `<span class="carousel-card__badge carousel-card__badge--out">Agotado</span>` : ''}
                            </div>
                            <button class="carousel-card__wishlist" aria-label="Agregar a favoritos">
                                <i data-lucide="heart"></i>
                            </button>
                            <img src="${product.image}" alt="${product.name}" loading="lazy"
                                 onerror="this.src='https://via.placeholder.com/300?text=Producto'">
                        </div>
                        <div class="carousel-card__content">
                            <span class="carousel-card__category">${this.getCategoryName(product.category)}</span>
                            <h3 class="carousel-card__title">${product.name}</h3>
                            <div class="carousel-card__price">
                                <span class="carousel-card__price-current">$${product.price.toFixed(2)}</span>
                                ${hasDiscount ? `<span class="carousel-card__price-old">$${product.oldPrice.toFixed(2)}</span>` : ''}
                                ${hasDiscount ? `<span class="carousel-card__discount">-${discount}%</span>` : ''}
                            </div>
                            <button class="carousel-card__cart-btn ${outOfStock ? 'carousel-card__cart-btn--disabled' : ''}" 
                                    data-id="${product.id}" ${outOfStock ? 'disabled' : ''}>
                                <i data-lucide="${outOfStock ? 'x' : 'shopping-cart'}"></i>
                                ${outOfStock ? 'Agotado' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        this.setupCardEvents(track);
    }

    getCategoryName(category) {
        const names = {
            'alimentos': 'Alimentos',
            'aseo': 'Aseo Personal',
            'confituras': 'Confituras',
            'bebidas': 'Bebidas',
            'bufet': 'Bufet',
            'electrodomesticos': 'Electrodomésticos'
        };
        return names[category] || category;
    }

    setupCardEvents(track) {
        track.querySelectorAll('.carousel-card__cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.id;
                this.addToCart(productId);
            });
        });

        track.querySelectorAll('.carousel-card__wishlist').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                btn.classList.toggle('active');
                const icon = btn.querySelector('i');
                if (btn.classList.contains('active')) {
                    icon.setAttribute('data-lucide', 'heart');
                    this.showToast('Agregado a favoritos', 'success');
                } else {
                    icon.setAttribute('data-lucide', 'heart');
                    this.showToast('Eliminado de favoritos', 'info');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            });
        });
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (typeof mvCart !== 'undefined') {
            mvCart.addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
            this.showToast(`${product.name} agregado al carrito`, 'success');
        }
    }

    showToast(message, type = 'info') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    calculateItemsPerView() {
        const width = window.innerWidth;
        if (width <= 600) {
            this.itemsPerView = 1;
        } else if (width <= 900) {
            this.itemsPerView = 2;
        } else if (width <= 1200) {
            this.itemsPerView = 3;
        } else {
            this.itemsPerView = 4;
        }
    }

    setupNavigation() {
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.prev();
                this.resetAutoplay();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.next();
                this.resetAutoplay();
            });
        }
    }

    createDots() {
        const dotsContainer = document.getElementById('carouselDots');
        if (!dotsContainer) return;

        const totalSlides = Math.ceil(this.featuredProducts.length / this.itemsPerView);
        dotsContainer.innerHTML = '';

        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.className = `carousel__dot ${i === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => {
                this.goToSlide(i);
                this.resetAutoplay();
            });
            dotsContainer.appendChild(dot);
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('carouselPrev');
        const nextBtn = document.getElementById('carouselNext');
        const dots = document.querySelectorAll('.carousel__dot');
        
        const totalSlides = Math.ceil(this.featuredProducts.length / this.itemsPerView);
        
        if (prevBtn) {
            prevBtn.classList.toggle('carousel__nav--disabled', this.currentIndex === 0);
        }
        
        if (nextBtn) {
            nextBtn.classList.toggle('carousel__nav--disabled', this.currentIndex >= totalSlides - 1);
        }
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    goToSlide(index) {
        const track = document.getElementById('carouselTrack');
        if (!track) return;

        const totalSlides = Math.ceil(this.featuredProducts.length / this.itemsPerView);
        
        if (index >= totalSlides) {
            index = 0;
        }
        if (index < 0) {
            index = totalSlides - 1;
        }
        
        this.currentIndex = index;

        const itemWidth = track.children[0] ? track.children[0].offsetWidth + 16 : 300;
        const offset = this.currentIndex * this.itemsPerView * itemWidth;
        track.style.transform = `translateX(-${offset}px)`;

        this.updateNavigation();
    }

    prev() {
        if (this.currentIndex > 0) {
            this.goToSlide(this.currentIndex - 1);
        } else {
            const totalSlides = Math.ceil(this.featuredProducts.length / this.itemsPerView);
            this.goToSlide(totalSlides - 1);
        }
    }

    next() {
        const totalSlides = Math.ceil(this.featuredProducts.length / this.itemsPerView);
        if (this.currentIndex < totalSlides - 1) {
            this.goToSlide(this.currentIndex + 1);
        } else {
            this.goToSlide(0);
        }
    }

    setupTouchEvents() {
        const track = document.getElementById('carouselTrack');
        if (!track) return;

        track.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.stopAutoplay();
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
            this.startAutoplay();
        }, { passive: true });

        track.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.pageX;
            track.style.cursor = 'grabbing';
            this.stopAutoplay();
        });

        track.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
        });

        track.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            track.style.cursor = 'grab';
            
            const diff = this.startX - e.pageX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }
            this.startAutoplay();
        });

        track.addEventListener('mouseleave', () => {
            if (this.isDragging) {
                this.isDragging = false;
                track.style.cursor = 'grab';
                this.startAutoplay();
            }
        });
    }

    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }

    setupAutoplay() {
        this.startAutoplay();
        
        const carousel = document.querySelector('.carousel');
        if (carousel) {
            carousel.addEventListener('mouseenter', () => this.stopAutoplay());
            carousel.addEventListener('mouseleave', () => this.startAutoplay());
        }
    }

    startAutoplay() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.autoplayDelay);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    resetAutoplay() {
        this.stopAutoplay();
        this.startAutoplay();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.productCarousel = new ProductCarousel();
});
